// Bridge between the Supabase database rows and the pure game engine.
//
// The engine (copied into ./engine) is authoritative for all in-round logic.
// This module reconstructs a GameState from the DB, and writes an updated
// GameState back, splitting the private hands into the RLS-protected `hands`
// table and the public state into `games.round_state`.

import {
  createInitialState,
  reduce,
  toPublicState,
  serializeHands,
  deserializeHand,
  reconstructState,
  Seat,
  SEAT_ORDER,
} from './engine.js';

// The engine types are erased in the built JS; we use light local aliases.
type AnyState = ReturnType<typeof createInitialState>;
type PublicState = ReturnType<typeof toPublicState>;

export interface GameRow {
  id: string;
  room_code: string;
  status: string;
  target_score: number;
  round_state: Record<string, unknown>;
  team1_score: number;
  team2_score: number;
  winner_team: string | null;
  round_number: number;
  round_history: unknown[];
}

export interface GamePlayerRow {
  game_id: string;
  player_id: string;
  seat: string;
  team: string;
  joined_at: string;
}

export interface HandRow {
  game_id: string;
  player_id: string;
  cards: string[];
}

/** Whether the game already has an initialized engine state. */
export function isEngineInitialized(game: GameRow): boolean {
  return !!game.round_state && typeof game.round_state === 'object' && 'phase' in game.round_state;
}

/** Map the fine-grained engine phase onto the coarse `games.status` column. */
export function phaseToStatus(phase: string): string {
  switch (phase) {
    case 'lobby':
      return 'lobby';
    case 'team_selection':
      return 'team_selection';
    case 'config':
      return 'config';
    case 'dealing':
    case 'bidding':
    case 'playing':
      return 'playing';
    case 'scoring':
      return 'scoring';
    case 'game_over':
      return 'finished';
    default:
      return 'playing';
  }
}

/** Build a fresh engine GameState from the lobby rows (pre-game bootstrap). */
export function buildLobbyState(
  game: GameRow,
  gamePlayers: GamePlayerRow[],
  nameById: Record<string, string>,
): AnyState {
  const ordered = [...gamePlayers].sort((a, b) => a.joined_at.localeCompare(b.joined_at));

  const players: Record<string, { id: string; name: string; seat: string }> = {};
  const playerOrder: string[] = [];
  for (const gp of ordered) {
    players[gp.player_id] = {
      id: gp.player_id,
      name: nameById[gp.player_id] ?? 'Joueur',
      seat: gp.seat,
    };
    playerOrder.push(gp.player_id);
  }

  const team1Ids = ordered.filter((p) => p.team === 'team1').map((p) => p.player_id);
  const team2Ids = ordered.filter((p) => p.team === 'team2').map((p) => p.player_id);

  const base = createInitialState(game.id, game.room_code);
  return {
    ...base,
    targetScore: game.target_score,
    players: players as AnyState['players'],
    playerOrder,
    teams: {
      team1: { id: 'team1', playerIds: team1Ids, score: 0 },
      team2: { id: 'team2', playerIds: team2Ids, score: 0 },
    } as AnyState['teams'],
    phase: 'config' as AnyState['phase'],
  };
}

/** Reconstruct the full GameState (with hands) from the DB rows. */
export function stateFromDb(game: GameRow, hands: HandRow[]): AnyState {
  const pub = game.round_state as unknown as PublicState;
  const seatToCards: Partial<Record<string, ReturnType<typeof deserializeHand>>> = {};

  const players = pub.players as Record<string, { seat: string }>;
  for (const row of hands) {
    const seat = players[row.player_id]?.seat;
    if (seat) seatToCards[seat] = deserializeHand((row.cards ?? []) as never);
  }

  return reconstructState(pub, seatToCards as never);
}

export interface PersistResult {
  gameUpdate: Record<string, unknown>;
  hands: { player_id: string; cards: string[] }[];
}

/** Compute the DB writes needed to persist a new GameState. */
export function toDbWrites(state: AnyState): PersistResult {
  const pub = toPublicState(state);
  const serialized = serializeHands(state);

  // Map each seat back to its player id so hands can be stored per player.
  const seatToPlayer: Record<string, string> = {};
  for (const p of Object.values(state.players as Record<string, { id: string; seat: string }>)) {
    seatToPlayer[p.seat] = p.id;
  }

  const hands: { player_id: string; cards: string[] }[] = [];
  for (const seat of SEAT_ORDER) {
    const playerId = seatToPlayer[seat];
    if (playerId) hands.push({ player_id: playerId, cards: serialized[seat] });
  }

  const teams = state.teams as null | {
    team1: { score: number };
    team2: { score: number };
  };

  return {
    gameUpdate: {
      round_state: pub,
      status: phaseToStatus(state.phase),
      team1_score: teams?.team1.score ?? 0,
      team2_score: teams?.team2.score ?? 0,
      winner_team: state.winner ?? null,
      round_number: state.roundNumber,
      round_history: state.roundHistory,
    },
    hands,
  };
}

/**
 * Apply an engine action, auto-dealing whenever the engine lands in the
 * `dealing` phase so clients never have to send an explicit DEAL.
 */
export function applyAction(
  state: AnyState,
  action: Record<string, unknown>,
): { state: AnyState; error?: string } {
  let result = reduce(state, action as never);
  if (result.error) return result;

  // Auto-advance through dealing (start of game, next round, redeal, rematch).
  let guard = 0;
  while (result.state.phase === 'dealing' && guard < 4) {
    const dealt = reduce(result.state, { type: 'DEAL' } as never);
    if (dealt.error) break;
    result = dealt;
    guard++;
  }
  return result;
}

export { Seat, SEAT_ORDER };
