import { describe, it, expect } from 'vitest';
import {
  toPublicState,
  serializeHands,
  deserializeHand,
  reconstructState,
  projectPublicState,
} from '../src/state/serialization.js';
import { createInitialState, type GameState } from '../src/state/game-state.js';
import { reduce } from '../src/state/game-reducer.js';
import { projectState } from '../src/state/state-projection.js';
import { Seat, SEAT_ORDER } from '../src/utils/seat.js';
import { TeamId } from '../src/domain/team.js';
import { Suit, cardId } from '../src/domain/card.js';

// ---- Helpers ----

function playerAtSeat(state: GameState, seat: Seat): string {
  const entry = Object.entries(state.players).find(([, p]) => p.seat === seat);
  return entry![0];
}

function setupPlayingState(): GameState {
  let state = createInitialState('game1', 'ROOM');
  state = reduce(state, { type: 'JOIN', playerId: 'p1', playerName: 'Alice' }).state;
  state = reduce(state, { type: 'JOIN', playerId: 'p2', playerName: 'Bob' }).state;
  state = reduce(state, { type: 'JOIN', playerId: 'p3', playerName: 'Charlie' }).state;
  state = reduce(state, { type: 'JOIN', playerId: 'p4', playerName: 'Diana' }).state;
  state = reduce(state, {
    type: 'SET_TEAMS',
    assignments: {
      p1: { seat: Seat.North, team: TeamId.Team1 },
      p2: { seat: Seat.East, team: TeamId.Team2 },
      p3: { seat: Seat.South, team: TeamId.Team1 },
      p4: { seat: Seat.West, team: TeamId.Team2 },
    },
  }).state;
  state = reduce(state, { type: 'START_GAME' }).state;
  state = reduce(state, { type: 'DEAL' }).state;

  const bidder = playerAtSeat(state, state.currentBidder!);
  state = reduce(state, { type: 'BID', playerId: bidder, points: 80, suit: Suit.Hearts }).state;
  for (let i = 0; i < 3; i++) {
    const passer = playerAtSeat(state, state.currentBidder!);
    state = reduce(state, { type: 'PASS', playerId: passer }).state;
  }
  return state;
}

/** Round-trip a value through JSON, as it would go through the DB (JSONB). */
function jsonRoundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- Tests ----

describe('toPublicState', () => {
  it('removes the private hands', () => {
    const state = setupPlayingState();
    const pub = toPublicState(state);
    expect('hands' in pub).toBe(false);
  });

  it('exposes accurate per-seat card counts', () => {
    const state = setupPlayingState();
    const pub = toPublicState(state);
    for (const seat of SEAT_ORDER) {
      expect(pub.handCounts[seat]).toBe(state.hands[seat].length);
      expect(pub.handCounts[seat]).toBe(8);
    }
  });

  it('keeps all public fields intact', () => {
    const state = setupPlayingState();
    const pub = toPublicState(state);
    expect(pub.phase).toBe(state.phase);
    expect(pub.contract).toEqual(state.contract);
    expect(pub.currentPlayer).toBe(state.currentPlayer);
    expect(pub.players).toEqual(state.players);
  });
});

describe('serializeHands / deserializeHand', () => {
  it('round-trips hands through CardId arrays', () => {
    const state = setupPlayingState();
    const serialized = serializeHands(state);
    for (const seat of SEAT_ORDER) {
      expect(serialized[seat]).toHaveLength(8);
      expect(deserializeHand(serialized[seat])).toEqual(state.hands[seat]);
    }
  });

  it('produces JSON-stable CardId strings', () => {
    const state = setupPlayingState();
    const serialized = serializeHands(state);
    const north = serialized[Seat.North];
    expect(north).toEqual(state.hands[Seat.North].map(cardId));
    // Survives a JSONB round-trip
    expect(jsonRoundTrip(serialized)).toEqual(serialized);
  });
});

describe('reconstructState', () => {
  it('rebuilds a GameState identical to the original after a full DB round-trip', () => {
    const state = setupPlayingState();

    const pub = jsonRoundTrip(toPublicState(state));
    const serializedHands = jsonRoundTrip(serializeHands(state));

    const hands = {} as Record<Seat, ReturnType<typeof deserializeHand>>;
    for (const seat of SEAT_ORDER) {
      hands[seat] = deserializeHand(serializedHands[seat]);
    }

    const rebuilt = reconstructState(pub, hands);
    expect(rebuilt).toEqual(state);
  });

  it('lets the reducer keep working on a reconstructed state', () => {
    const state = setupPlayingState();
    const rebuilt = reconstructState(
      jsonRoundTrip(toPublicState(state)),
      Object.fromEntries(
        SEAT_ORDER.map((s) => [s, deserializeHand(serializeHands(state)[s])]),
      ) as Record<Seat, ReturnType<typeof deserializeHand>>,
    );

    // Play a legal card from the current player and confirm it is accepted.
    const seat = rebuilt.currentPlayer!;
    const playerId = playerAtSeat(rebuilt, seat);
    const proj = projectState(rebuilt, playerId);
    const playable = proj.playableCards[0];
    const result = reduce(rebuilt, { type: 'PLAY_CARD', playerId, cardId: playable });
    expect(result.error).toBeUndefined();
    expect(result.state.hands[seat]).toHaveLength(7);
  });
});

describe('projectPublicState', () => {
  it('matches projectState for the requesting player', () => {
    const state = setupPlayingState();
    const pub = jsonRoundTrip(toPublicState(state));

    for (const seat of SEAT_ORDER) {
      const playerId = playerAtSeat(state, seat);
      const myHand = state.hands[seat];
      const viaPublic = projectPublicState(pub, playerId, myHand);
      const viaFull = projectState(state, playerId);
      expect(viaPublic).toEqual(viaFull);
    }
  });

  it('reveals only the requesting player hand and correct opponent counts', () => {
    const state = setupPlayingState();
    const pub = jsonRoundTrip(toPublicState(state));
    const playerId = playerAtSeat(state, Seat.North);

    const proj = projectPublicState(pub, playerId, state.hands[Seat.North]);
    expect(proj.myHand).toEqual(state.hands[Seat.North]);
    for (const p of proj.players) {
      expect(p.cardCount).toBe(8);
    }
  });

  it('throws for an unknown player', () => {
    const state = setupPlayingState();
    const pub = jsonRoundTrip(toPublicState(state));
    expect(() => projectPublicState(pub, 'ghost', [])).toThrow('not found');
  });
});
