import { DECK_32 } from './card.js';
/** Fisher-Yates shuffle (returns new array) */
export function shuffle(cards) {
    const result = [...cards];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
/** Deal cards from a shuffled deck in 3-2-3 pattern (8 cards per player) */
export function deal(shuffledDeck) {
    if (shuffledDeck.length !== 32) {
        throw new Error(`Expected 32 cards, got ${shuffledDeck.length}`);
    }
    const hands = [[], [], [], []];
    let idx = 0;
    // Round 1: 3 cards each
    for (let player = 0; player < 4; player++) {
        for (let c = 0; c < 3; c++) {
            hands[player].push(shuffledDeck[idx++]);
        }
    }
    // Round 2: 2 cards each
    for (let player = 0; player < 4; player++) {
        for (let c = 0; c < 2; c++) {
            hands[player].push(shuffledDeck[idx++]);
        }
    }
    // Round 3: 3 cards each
    for (let player = 0; player < 4; player++) {
        for (let c = 0; c < 3; c++) {
            hands[player].push(shuffledDeck[idx++]);
        }
    }
    return hands;
}
/** Create a shuffled 32-card deck */
export function createShuffledDeck() {
    return shuffle(DECK_32);
}
//# sourceMappingURL=deck.js.map