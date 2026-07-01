import { cardStrength, isTrump } from './trump.js';
/**
 * Determine the winner of a completed trick.
 *
 * Rules:
 * - If any trump was played, the highest trump wins
 * - Otherwise, the highest card of the led suit wins
 */
export function determineTrickWinner(trick, trumpSuit) {
    if (trick.cards.length !== 4) {
        throw new Error(`Trick must have 4 cards, got ${trick.cards.length}`);
    }
    const leadSuit = trick.cards[0].card.suit;
    // Find the highest trump played, if any
    const trumpCards = trick.cards.filter((tc) => isTrump(tc.card, trumpSuit));
    if (trumpCards.length > 0) {
        return highestCard(trumpCards, trumpSuit);
    }
    // No trump played: highest card of the led suit wins
    const leadSuitCards = trick.cards.filter((tc) => tc.card.suit === leadSuit);
    return highestCard(leadSuitCards, trumpSuit);
}
function highestCard(cards, trumpSuit) {
    let best = cards[0];
    for (let i = 1; i < cards.length; i++) {
        if (cardStrength(cards[i].card, trumpSuit) > cardStrength(best.card, trumpSuit)) {
            best = cards[i];
        }
    }
    return best.seat;
}
/**
 * Calculate the total points in a trick.
 */
export { cardPoints } from './trump.js';
//# sourceMappingURL=trick-winner.js.map