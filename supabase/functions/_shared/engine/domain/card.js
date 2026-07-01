export var Suit;
(function (Suit) {
    Suit["Spades"] = "spades";
    Suit["Hearts"] = "hearts";
    Suit["Diamonds"] = "diamonds";
    Suit["Clubs"] = "clubs";
})(Suit || (Suit = {}));
export var Rank;
(function (Rank) {
    Rank["Seven"] = "7";
    Rank["Eight"] = "8";
    Rank["Nine"] = "9";
    Rank["Ten"] = "10";
    Rank["Jack"] = "J";
    Rank["Queen"] = "Q";
    Rank["King"] = "K";
    Rank["Ace"] = "A";
})(Rank || (Rank = {}));
export function cardId(card) {
    return `${card.suit}-${card.rank}`;
}
export function parseCardId(id) {
    const [suit, rank] = id.split('-');
    return { suit, rank };
}
export function cardEquals(a, b) {
    return a.suit === b.suit && a.rank === b.rank;
}
export const ALL_SUITS = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
export const ALL_RANKS = [
    Rank.Seven,
    Rank.Eight,
    Rank.Nine,
    Rank.Ten,
    Rank.Jack,
    Rank.Queen,
    Rank.King,
    Rank.Ace,
];
/** The full 32-card deck */
export const DECK_32 = ALL_SUITS.flatMap((suit) => ALL_RANKS.map((rank) => ({ suit, rank })));
/** French suit names for display */
export const SUIT_NAMES_FR = {
    [Suit.Spades]: 'Pique',
    [Suit.Hearts]: 'Coeur',
    [Suit.Diamonds]: 'Carreau',
    [Suit.Clubs]: 'Trefle',
};
/** French rank names for display */
export const RANK_NAMES_FR = {
    [Rank.Seven]: '7',
    [Rank.Eight]: '8',
    [Rank.Nine]: '9',
    [Rank.Ten]: '10',
    [Rank.Jack]: 'Valet',
    [Rank.Queen]: 'Dame',
    [Rank.King]: 'Roi',
    [Rank.Ace]: 'As',
};
/** Suit symbols for display */
export const SUIT_SYMBOLS = {
    [Suit.Spades]: '\u2660',
    [Suit.Hearts]: '\u2665',
    [Suit.Diamonds]: '\u2666',
    [Suit.Clubs]: '\u2663',
};
const SUIT_ORDER = {
    [Suit.Spades]: 0,
    [Suit.Hearts]: 1,
    [Suit.Diamonds]: 2,
    [Suit.Clubs]: 3,
};
const TRUMP_RANK_ORDER = {
    [Rank.Seven]: 0, [Rank.Eight]: 1, [Rank.Queen]: 2,
    [Rank.King]: 3, [Rank.Ten]: 4, [Rank.Ace]: 5,
    [Rank.Nine]: 6, [Rank.Jack]: 7,
};
const PLAIN_RANK_ORDER = {
    [Rank.Seven]: 0, [Rank.Eight]: 1, [Rank.Nine]: 2,
    [Rank.Jack]: 3, [Rank.Queen]: 4, [Rank.Ten]: 5,
    [Rank.King]: 6, [Rank.Ace]: 7,
};
/** Sort a hand by suit then rank. Trump suit is placed last. */
export function sortHand(cards, trumpSuit) {
    return [...cards].sort((a, b) => {
        const suitA = trumpSuit && a.suit === trumpSuit ? 99 : SUIT_ORDER[a.suit];
        const suitB = trumpSuit && b.suit === trumpSuit ? 99 : SUIT_ORDER[b.suit];
        if (suitA !== suitB)
            return suitA - suitB;
        const rankOrder = trumpSuit && a.suit === trumpSuit ? TRUMP_RANK_ORDER : PLAIN_RANK_ORDER;
        return rankOrder[b.rank] - rankOrder[a.rank];
    });
}
//# sourceMappingURL=card.js.map