import { describe, it, expect } from 'vitest';
import {
  Suit,
  Rank,
  DECK_32,
  ALL_SUITS,
  ALL_RANKS,
  cardId,
  parseCardId,
  cardEquals,
  type Card,
  type CardId,
} from '../src/domain/card.js';

describe('DECK_32', () => {
  it('has exactly 32 cards', () => {
    expect(DECK_32).toHaveLength(32);
  });

  it('contains all 4 suits', () => {
    const suits = new Set(DECK_32.map((c) => c.suit));
    expect(suits).toEqual(new Set([Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]));
  });

  it('contains all 8 ranks', () => {
    const ranks = new Set(DECK_32.map((c) => c.rank));
    expect(ranks).toEqual(
      new Set([
        Rank.Seven,
        Rank.Eight,
        Rank.Nine,
        Rank.Ten,
        Rank.Jack,
        Rank.Queen,
        Rank.King,
        Rank.Ace,
      ]),
    );
  });

  it('has exactly 8 cards per suit', () => {
    for (const suit of ALL_SUITS) {
      const count = DECK_32.filter((c) => c.suit === suit).length;
      expect(count).toBe(8);
    }
  });

  it('has exactly 4 cards per rank', () => {
    for (const rank of ALL_RANKS) {
      const count = DECK_32.filter((c) => c.rank === rank).length;
      expect(count).toBe(4);
    }
  });

  it('has no duplicate cards', () => {
    const ids = DECK_32.map((c) => cardId(c));
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(32);
  });
});

describe('cardId', () => {
  it('produces the correct string format', () => {
    expect(cardId({ suit: Suit.Hearts, rank: Rank.Jack })).toBe('hearts-J');
    expect(cardId({ suit: Suit.Spades, rank: Rank.Ace })).toBe('spades-A');
    expect(cardId({ suit: Suit.Diamonds, rank: Rank.Seven })).toBe('diamonds-7');
    expect(cardId({ suit: Suit.Clubs, rank: Rank.Ten })).toBe('clubs-10');
  });
});

describe('parseCardId', () => {
  it('parses a valid card ID', () => {
    const card = parseCardId('hearts-J' as CardId);
    expect(card.suit).toBe(Suit.Hearts);
    expect(card.rank).toBe(Rank.Jack);
  });

  it('roundtrips with cardId for every card in the deck', () => {
    for (const card of DECK_32) {
      const id = cardId(card);
      const parsed = parseCardId(id);
      expect(parsed.suit).toBe(card.suit);
      expect(parsed.rank).toBe(card.rank);
    }
  });
});

describe('cardEquals', () => {
  it('returns true for identical cards', () => {
    const a: Card = { suit: Suit.Hearts, rank: Rank.Jack };
    const b: Card = { suit: Suit.Hearts, rank: Rank.Jack };
    expect(cardEquals(a, b)).toBe(true);
  });

  it('returns false when suits differ', () => {
    const a: Card = { suit: Suit.Hearts, rank: Rank.Jack };
    const b: Card = { suit: Suit.Spades, rank: Rank.Jack };
    expect(cardEquals(a, b)).toBe(false);
  });

  it('returns false when ranks differ', () => {
    const a: Card = { suit: Suit.Hearts, rank: Rank.Jack };
    const b: Card = { suit: Suit.Hearts, rank: Rank.Queen };
    expect(cardEquals(a, b)).toBe(false);
  });

  it('returns false when both suit and rank differ', () => {
    const a: Card = { suit: Suit.Hearts, rank: Rank.Jack };
    const b: Card = { suit: Suit.Clubs, rank: Rank.Ace };
    expect(cardEquals(a, b)).toBe(false);
  });
});
