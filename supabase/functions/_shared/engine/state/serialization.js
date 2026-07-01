import { projectState } from './state-projection.js';
import { Suit, Rank, cardId, parseCardId } from '../domain/card.js';
import { SEAT_ORDER } from '../utils/seat.js';
/** A single card used only to pad opponents' hands so counts project correctly. */
const PLACEHOLDER_CARD = { suit: Suit.Spades, rank: Rank.Seven };
/** Strip the private hands from a GameState, keeping only public card counts. */
export function toPublicState(state) {
    const handCounts = {};
    for (const seat of SEAT_ORDER) {
        handCounts[seat] = state.hands[seat]?.length ?? 0;
    }
    const { hands: _hands, ...rest } = state;
    return { ...rest, handCounts };
}
/** Serialize every seat's hand to compact CardId arrays for DB storage. */
export function serializeHands(state) {
    const out = {};
    for (const seat of SEAT_ORDER) {
        out[seat] = (state.hands[seat] ?? []).map(cardId);
    }
    return out;
}
/** Parse a CardId array (as stored in the DB) back into Card objects. */
export function deserializeHand(ids) {
    return ids.map(parseCardId);
}
/**
 * Reconstruct a full GameState from a public state and the (partial) set of
 * real hands. Seats without a provided hand default to an empty array — the
 * Edge Function always passes all four, clients only pass their own.
 */
export function reconstructState(pub, hands) {
    const fullHands = {};
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
export function projectPublicState(pub, playerId, myHand) {
    const me = pub.players[playerId];
    if (!me) {
        throw new Error(`Player ${playerId} not found in game`);
    }
    const hands = {};
    for (const seat of SEAT_ORDER) {
        if (seat === me.seat) {
            hands[seat] = myHand;
        }
        else {
            const count = pub.handCounts[seat] ?? 0;
            hands[seat] = Array.from({ length: count }, () => PLACEHOLDER_CARD);
        }
    }
    return projectState(reconstructState(pub, hands), playerId);
}
//# sourceMappingURL=serialization.js.map