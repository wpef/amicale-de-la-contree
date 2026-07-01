import type { GameState } from './game-state.js';
import type { ProjectedGameState } from './state-projection.js';
import { projectState } from './state-projection.js';
import type { Card, CardId } from '../domain/card.js';
import { Suit, Rank, cardId, parseCardId } from '../domain/card.js';
import { Seat, SEAT_ORDER } from '../utils/seat.js';

/**
 * Serialization helpers shared by the frontend and the Supabase Edge Functions.
 *
 * The online mode splits the game state into two parts:
 *  - a PUBLIC state, stored in `games.round_state` and pushed to every client
 *    via Realtime. It is the full GameState minus the private hands, plus a
 *    per-seat card count so clients can still render opponents' hand sizes.
 *  - the PRIVATE hands, stored one row per player in the `hands` table (RLS:
 *    each player only reads their own row).
 */

/** Full GameState minus the private hands, plus public per-seat card counts. */
export type PublicGameState = Omit<GameState, 'hands'> & {
  readonly handCounts: Record<Seat, number>;
};

/** A single card used only to pad opponents' hands so counts project correctly. */
const PLACEHOLDER_CARD: Card = { suit: Suit.Spades, rank: Rank.Seven };

/** Strip the private hands from a GameState, keeping only public card counts. */
export function toPublicState(state: GameState): PublicGameState {
  const handCounts = {} as Record<Seat, number>;
  for (const seat of SEAT_ORDER) {
    handCounts[seat] = state.hands[seat]?.length ?? 0;
  }
  const { hands: _hands, ...rest } = state;
  return { ...rest, handCounts };
}

/** Serialize every seat's hand to compact CardId arrays for DB storage. */
export function serializeHands(state: GameState): Record<Seat, CardId[]> {
  const out = {} as Record<Seat, CardId[]>;
  for (const seat of SEAT_ORDER) {
    out[seat] = (state.hands[seat] ?? []).map(cardId);
  }
  return out;
}

/** Parse a CardId array (as stored in the DB) back into Card objects. */
export function deserializeHand(ids: readonly CardId[]): Card[] {
  return ids.map(parseCardId);
}

/**
 * Reconstruct a full GameState from a public state and the (partial) set of
 * real hands. Seats without a provided hand default to an empty array — the
 * Edge Function always passes all four, clients only pass their own.
 */
export function reconstructState(
  pub: PublicGameState,
  hands: Partial<Record<Seat, Card[]>>,
): GameState {
  const fullHands = {} as Record<Seat, Card[]>;
  for (const seat of SEAT_ORDER) {
    fullHands[seat] = hands[seat] ?? [];
  }
  const { handCounts: _handCounts, ...rest } = pub;
  return { ...rest, hands: fullHands };
}

/**
 * Project a public state for a given player using only that player's own hand.
 * Opponents' hands are padded with placeholder cards so the projection reports
 * accurate card counts without ever revealing their contents.
 */
export function projectPublicState(
  pub: PublicGameState,
  playerId: string,
  myHand: Card[],
): ProjectedGameState {
  const me = pub.players[playerId];
  if (!me) {
    throw new Error(`Player ${playerId} not found in game`);
  }

  const hands = {} as Record<Seat, Card[]>;
  for (const seat of SEAT_ORDER) {
    if (seat === me.seat) {
      hands[seat] = myHand;
    } else {
      const count = pub.handCounts[seat] ?? 0;
      hands[seat] = Array.from({ length: count }, () => PLACEHOLDER_CARD);
    }
  }

  return projectState(reconstructState(pub, hands), playerId);
}
