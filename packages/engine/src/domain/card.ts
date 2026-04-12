export enum Suit {
  Spades = 'spades',
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
}

export enum Rank {
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export interface Card {
  readonly suit: Suit;
  readonly rank: Rank;
}

/** Unique string identifier for a card, e.g. "hearts-J" */
export type CardId = `${Suit}-${Rank}`;

export function cardId(card: Card): CardId {
  return `${card.suit}-${card.rank}`;
}

export function parseCardId(id: CardId): Card {
  const [suit, rank] = id.split('-') as [Suit, Rank];
  return { suit, rank };
}

export function cardEquals(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export const ALL_SUITS: readonly Suit[] = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];

export const ALL_RANKS: readonly Rank[] = [
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
export const DECK_32: readonly Card[] = ALL_SUITS.flatMap((suit) =>
  ALL_RANKS.map((rank) => ({ suit, rank })),
);

/** French suit names for display */
export const SUIT_NAMES_FR: Record<Suit, string> = {
  [Suit.Spades]: 'Pique',
  [Suit.Hearts]: 'Coeur',
  [Suit.Diamonds]: 'Carreau',
  [Suit.Clubs]: 'Trefle',
};

/** French rank names for display */
export const RANK_NAMES_FR: Record<Rank, string> = {
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
export const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.Spades]: '\u2660',
  [Suit.Hearts]: '\u2665',
  [Suit.Diamonds]: '\u2666',
  [Suit.Clubs]: '\u2663',
};
