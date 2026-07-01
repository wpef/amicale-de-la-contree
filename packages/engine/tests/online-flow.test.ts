import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  reduce,
  toPublicState,
  serializeHands,
  deserializeHand,
  reconstructState,
  projectState,
  projectPublicState,
  type GameState,
  type PublicGameState,
} from '../src/index.js';
import { Seat, SEAT_ORDER } from '../src/utils/seat.js';
import { TeamId } from '../src/domain/team.js';
import { Suit, type CardId } from '../src/domain/card.js';

/**
 * End-to-end simulation of the online server loop implemented by the
 * `game-action` Edge Function, but running entirely in-memory:
 *
 *   persist(state) -> DB (JSONB round_state + per-player hand rows)
 *   reconstruct()  -> GameState
 *   reduce()       -> new GameState
 *
 * Every mutation is JSON round-tripped to mimic Postgres JSONB storage,
 * exercising scenarios 3-6 (start, bidding, playing a full round, scoring,
 * next round) without Docker/Supabase.
 */

interface FakeDb {
  roundState: PublicGameState;
  hands: Record<string, CardId[]>; // player_id -> cards
}

function json<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

const PLAYERS = [
  { id: 'p-north', name: 'Alice', seat: Seat.North, team: TeamId.Team1 },
  { id: 'p-east', name: 'Bob', seat: Seat.East, team: TeamId.Team2 },
  { id: 'p-south', name: 'Chloe', seat: Seat.South, team: TeamId.Team1 },
  { id: 'p-west', name: 'David', seat: Seat.West, team: TeamId.Team2 },
];

function playerIdForSeat(seat: Seat): string {
  return PLAYERS.find((p) => p.seat === seat)!.id;
}

/** Mirror of the Edge Function's lobby bootstrap. */
function buildLobbyState(): GameState {
  const base = createInitialState('game-online', 'ABCD');
  const players: GameState['players'] = {};
  for (const p of PLAYERS) players[p.id] = { id: p.id, name: p.name, seat: p.seat };
  return {
    ...base,
    players,
    playerOrder: PLAYERS.map((p) => p.id),
    teams: {
      team1: { id: TeamId.Team1, playerIds: ['p-north', 'p-south'], score: 0 },
      team2: { id: TeamId.Team2, playerIds: ['p-east', 'p-west'], score: 0 },
    },
    phase: 'config',
  };
}

/** Mirror of the Edge Function's persist step (with JSONB round-trip). */
function persist(state: GameState): FakeDb {
  const roundState = json(toPublicState(state));
  const serialized = json(serializeHands(state));
  const hands: Record<string, CardId[]> = {};
  for (const seat of SEAT_ORDER) {
    hands[playerIdForSeat(seat)] = serialized[seat];
  }
  return { roundState, hands };
}

/** Mirror of the Edge Function's reconstruct step. */
function reconstruct(db: FakeDb): GameState {
  const bySeat: Partial<Record<Seat, ReturnType<typeof deserializeHand>>> = {};
  for (const seat of SEAT_ORDER) {
    bySeat[seat] = deserializeHand(db.hands[playerIdForSeat(seat)] ?? []);
  }
  return reconstructState(db.roundState, bySeat);
}

/** Mirror of applyAction: run the action, auto-dealing on the dealing phase. */
function applyAction(state: GameState, action: Parameters<typeof reduce>[1]) {
  let result = reduce(state, action);
  if (result.error) return result;
  let guard = 0;
  while (result.state.phase === 'dealing' && guard < 4) {
    const dealt = reduce(result.state, { type: 'DEAL' });
    if (dealt.error) break;
    result = dealt;
    guard++;
  }
  return result;
}

/** One full server round-trip: read DB, apply action, write DB. */
function serverAction(db: FakeDb, action: Parameters<typeof reduce>[1]): { db: FakeDb; error?: string } {
  const state = reconstruct(db);
  const result = applyAction(state, action);
  if (result.error) return { db, error: result.error };
  return { db: persist(result.state) };
}

describe('online server loop', () => {
  it('scenario 4-6: start, bid, play a full round, score, next round', () => {
    // Scenario 3->4: START_GAME deals hands and enters bidding.
    let db = persist(applyAction(buildLobbyState(), { type: 'START_GAME' }).state);
    expect(db.roundState.phase).toBe('bidding');
    for (const p of PLAYERS) {
      expect(db.hands[p.id]).toHaveLength(8);
    }

    // Reconnection check: each player can rebuild their private view.
    for (const p of PLAYERS) {
      const view = projectPublicState(db.roundState, p.id, deserializeHand(db.hands[p.id]));
      expect(view.myHand).toHaveLength(8);
      expect(view.mySeat).toBe(p.seat);
    }

    // Scenario 4: bidding. Current bidder bids 80 hearts, the rest pass.
    const firstBidder = db.roundState.currentBidder!;
    let step = serverAction(db, {
      type: 'BID',
      playerId: playerIdForSeat(firstBidder),
      points: 80,
      suit: Suit.Hearts,
    });
    expect(step.error).toBeUndefined();
    db = step.db;

    for (let i = 0; i < 3; i++) {
      const bidder = db.roundState.currentBidder!;
      step = serverAction(db, { type: 'PASS', playerId: playerIdForSeat(bidder) });
      expect(step.error).toBeUndefined();
      db = step.db;
    }

    expect(db.roundState.phase).toBe('playing');
    expect(db.roundState.contract).not.toBeNull();
    expect(db.roundState.contract!.bid.suit).toBe(Suit.Hearts);

    // Reject an out-of-turn play (server must validate, not trust the client).
    const wrongSeat = SEAT_ORDER.find((s) => s !== db.roundState.currentPlayer)!;
    const wrongView = projectPublicState(
      db.roundState,
      playerIdForSeat(wrongSeat),
      deserializeHand(db.hands[playerIdForSeat(wrongSeat)]),
    );
    const bad = serverAction(db, {
      type: 'PLAY_CARD',
      playerId: playerIdForSeat(wrongSeat),
      cardId: deserializeHand(db.hands[playerIdForSeat(wrongSeat)])[0]
        ? (`${wrongView.myHand[0].suit}-${wrongView.myHand[0].rank}` as CardId)
        : ('hearts-7' as CardId),
    });
    expect(bad.error).toBeTruthy();

    // Scenario 5-6: play all 8 tricks (32 cards) by always choosing a legal card.
    let plays = 0;
    while (db.roundState.phase === 'playing' && plays < 40) {
      const seat = db.roundState.currentPlayer!;
      const pid = playerIdForSeat(seat);
      const view = projectPublicState(db.roundState, pid, deserializeHand(db.hands[pid]));
      const cardId = view.playableCards[0];
      expect(cardId).toBeTruthy();
      step = serverAction(db, { type: 'PLAY_CARD', playerId: pid, cardId });
      expect(step.error).toBeUndefined();
      db = step.db;
      plays++;
    }

    expect(plays).toBe(32);
    expect(db.roundState.phase).toBe('scoring');
    expect(db.roundState.roundScore).not.toBeNull();

    // Scores were applied to at least one team.
    const total =
      (db.roundState.teams?.team1.score ?? 0) + (db.roundState.teams?.team2.score ?? 0);
    expect(total).toBeGreaterThan(0);

    // Scenario 6: next round re-deals and returns to bidding.
    const prevRound = db.roundState.roundNumber;
    step = serverAction(db, { type: 'NEXT_ROUND' });
    expect(step.error).toBeUndefined();
    db = step.db;
    expect(db.roundState.phase).toBe('bidding');
    expect(db.roundState.roundNumber).toBe(prevRound + 1);
    for (const p of PLAYERS) expect(db.hands[p.id]).toHaveLength(8);
  });

  it('keeps opponents hands private in the persisted public state', () => {
    const db = persist(applyAction(buildLobbyState(), { type: 'START_GAME' }).state);
    // The public round_state must never contain raw hands.
    expect(JSON.stringify(db.roundState)).not.toContain('"hands"');
    // A player only ever reads their own hand row.
    const view = projectPublicState(
      db.roundState,
      'p-north',
      deserializeHand(db.hands['p-north']),
    );
    // Opponent card counts are visible, contents are not.
    const full = reconstruct(db);
    const truth = projectState(full, 'p-north');
    expect(view).toEqual(truth);
  });
});
