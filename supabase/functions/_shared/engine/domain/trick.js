export function createTrick(number, leader) {
    return { number, cards: [], leader };
}
export function isTrickComplete(trick) {
    return trick.cards.length === 4;
}
export function trickLeadSuit(trick) {
    return trick.cards.length > 0 ? trick.cards[0].card.suit : undefined;
}
//# sourceMappingURL=trick.js.map