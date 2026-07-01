import { isTrump, cardStrength } from './trump.js';
import { arePartners } from '../utils/seat.js';
/**
 * Determine which cards from a player's hand can legally be played.
 *
 * Rules of play in Contree:
 * 1. If leading (first to play): any card is valid
 * 2. If a suit was led:
 *    a. You have cards of the led suit:
 *       - If led suit is trump: MUST play trump AND MUST play higher than
 *         the current highest trump if possible ("monter a l'atout")
 *       - If led suit is not trump: MUST follow suit (any card of the led suit)
 *    b. You DON'T have cards of the led suit:
 *       - If your partner is currently winning: play anything
 *       - If your partner is NOT winning: MUST play trump if able ("couper"),
 *         and MUST play higher trump than any already in the trick if possible
 *       - If no trump available: play anything ("defausser")
 */
export function getPlayableCards(hand, trick, trumpSuit, playerSeat) {
    // Leading: any card
    if (trick.cards.length === 0) {
        return [...hand];
    }
    const leadSuit = trick.cards[0].card.suit;
    const cardsOfLeadSuit = hand.filter((c) => c.suit === leadSuit);
    const trumpCards = hand.filter((c) => isTrump(c, trumpSuit));
    // Case 2a: Has cards of the led suit
    if (cardsOfLeadSuit.length > 0) {
        if (leadSuit === trumpSuit) {
            // Led suit is trump: must play trump and try to go higher
            return mustGoHigherTrump(cardsOfLeadSuit, trick, trumpSuit);
        }
        // Led suit is not trump: must follow suit (any card of that suit)
        return cardsOfLeadSuit;
    }
    // Case 2b: Doesn't have the led suit
    const partnerWinning = isPartnerWinning(trick, trumpSuit, playerSeat);
    if (partnerWinning) {
        // Partner winning: play anything
        return [...hand];
    }
    // Partner not winning: must trump if possible
    if (trumpCards.length > 0) {
        // Must play trump, and go higher if possible
        return mustGoHigherTrump(trumpCards, trick, trumpSuit);
    }
    // No trump, no led suit: play anything (defausse)
    return [...hand];
}
/**
 * When must play trump, must go higher than the current highest trump
 * in the trick if possible. Otherwise, any trump.
 */
function mustGoHigherTrump(availableTrumps, trick, trumpSuit) {
    const highestTrumpInTrick = getHighestTrumpStrength(trick, trumpSuit);
    if (highestTrumpInTrick === null) {
        // No trump in trick yet, any trump is fine
        return availableTrumps;
    }
    const higherTrumps = availableTrumps.filter((c) => cardStrength(c, trumpSuit) > highestTrumpInTrick);
    // If has higher trumps, must play one of them
    if (higherTrumps.length > 0) {
        return higherTrumps;
    }
    // Can't go higher: any trump
    return availableTrumps;
}
/** Get the strength of the highest trump currently in the trick, or null */
function getHighestTrumpStrength(trick, trumpSuit) {
    let highest = null;
    for (const tc of trick.cards) {
        if (isTrump(tc.card, trumpSuit)) {
            const strength = cardStrength(tc.card, trumpSuit);
            if (highest === null || strength > highest) {
                highest = strength;
            }
        }
    }
    return highest;
}
/** Check if the current player's partner is winning the trick so far */
function isPartnerWinning(trick, trumpSuit, playerSeat) {
    if (trick.cards.length === 0)
        return false;
    // Build a partial trick to determine current winner
    const partialTrick = {
        ...trick,
        cards: trick.cards,
    };
    // Find current winner among played cards
    const currentWinner = determineTrickWinnerPartial(partialTrick, trumpSuit);
    return currentWinner !== null && arePartners(currentWinner, playerSeat);
}
/** Determine winner of a partial trick (< 4 cards) */
function determineTrickWinnerPartial(trick, trumpSuit) {
    if (trick.cards.length === 0)
        return null;
    const leadSuit = trick.cards[0].card.suit;
    let bestSeat = trick.cards[0].seat;
    let bestIsTrump = isTrump(trick.cards[0].card, trumpSuit);
    let bestStrength = cardStrength(trick.cards[0].card, trumpSuit);
    for (let i = 1; i < trick.cards.length; i++) {
        const tc = trick.cards[i];
        const cardIsTrump = isTrump(tc.card, trumpSuit);
        const strength = cardStrength(tc.card, trumpSuit);
        if (cardIsTrump && !bestIsTrump) {
            // Trump beats non-trump
            bestSeat = tc.seat;
            bestIsTrump = true;
            bestStrength = strength;
        }
        else if (cardIsTrump && bestIsTrump) {
            // Both trump: higher wins
            if (strength > bestStrength) {
                bestSeat = tc.seat;
                bestStrength = strength;
            }
        }
        else if (!cardIsTrump && !bestIsTrump && tc.card.suit === leadSuit) {
            // Both non-trump, same suit as lead: higher wins
            if (strength > bestStrength) {
                bestSeat = tc.seat;
                bestStrength = strength;
            }
        }
        // else: non-trump, different suit than lead and current best = loses
    }
    return bestSeat;
}
/** Validate that a specific card can be played */
export function isCardPlayable(card, hand, trick, trumpSuit, playerSeat) {
    const playable = getPlayableCards(hand, trick, trumpSuit, playerSeat);
    return playable.some((c) => c.suit === card.suit && c.rank === card.rank);
}
//# sourceMappingURL=play-validation.js.map