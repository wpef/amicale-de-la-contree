import { Rank, type Card, type Suit } from '../domain/card.js';

/** Point values for cards in the trump suit */
export const TRUMP_POINTS: Record<Rank, number> = {
  [Rank.Seven]: 0,
  [Rank.Eight]: 0,
  [Rank.Nine]: 14,
  [Rank.Ten]: 10,
  [Rank.Jack]: 20,
  [Rank.Queen]: 3,
  [Rank.King]: 4,
  [Rank.Ace]: 11,
};

/** Point values for cards in non-trump suits */
export const PLAIN_POINTS: Record<Rank, number> = {
  [Rank.Seven]: 0,
  [Rank.Eight]: 0,
  [Rank.Nine]: 0,
  [Rank.Ten]: 10,
  [Rank.Jack]: 2,
  [Rank.Queen]: 3,
  [Rank.King]: 4,
  [Rank.Ace]: 11,
};

/** Strength ordering for trump suit (higher = stronger) */
const TRUMP_STRENGTH: Record<Rank, number> = {
  [Rank.Seven]: 0,
  [Rank.Eight]: 1,
  [Rank.Nine]: 6, // 9 d'atout = 2nd strongest
  [Rank.Ten]: 4,
  [Rank.Jack]: 7, // Valet d'atout = strongest
  [Rank.Queen]: 2,
  [Rank.King]: 3,
  [Rank.Ace]: 5,
};

/** Strength ordering for non-trump suits (higher = stronger) */
const PLAIN_STRENGTH: Record<Rank, number> = {
  [Rank.Seven]: 0,
  [Rank.Eight]: 1,
  [Rank.Nine]: 2,
  [Rank.Ten]: 5,
  [Rank.Jack]: 3,
  [Rank.Queen]: 4,
  [Rank.King]: 6,
  [Rank.Ace]: 7,
};

/** Get card strength (for comparison within the same suit context) */
export function cardStrength(card: Card, trumpSuit: Suit): number {
  if (card.suit === trumpSuit) {
    return TRUMP_STRENGTH[card.rank];
  }
  return PLAIN_STRENGTH[card.rank];
}

/** Get point value of a card given the trump suit */
export function cardPoints(card: Card, trumpSuit: Suit): number {
  if (card.suit === trumpSuit) {
    return TRUMP_POINTS[card.rank];
  }
  return PLAIN_POINTS[card.rank];
}

/**
 * Compare two cards of the SAME suit.
 * Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function compareCards(a: Card, b: Card, trumpSuit: Suit): number {
  return cardStrength(a, trumpSuit) - cardStrength(b, trumpSuit);
}

/** Check if a card is trump */
export function isTrump(card: Card, trumpSuit: Suit): boolean {
  return card.suit === trumpSuit;
}
