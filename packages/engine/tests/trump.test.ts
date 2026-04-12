import { describe, it, expect } from 'vitest';
import { Suit, Rank, type Card } from '../src/domain/card.js';
import {
  TRUMP_POINTS,
  PLAIN_POINTS,
  cardStrength,
  cardPoints,
  compareCards,
  isTrump,
} from '../src/rules/trump.js';

const trumpSuit = Suit.Hearts;

function card(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

describe('TRUMP_POINTS', () => {
  it('Jack of trump is worth 20 points', () => {
    expect(TRUMP_POINTS[Rank.Jack]).toBe(20);
  });

  it('Nine of trump is worth 14 points', () => {
    expect(TRUMP_POINTS[Rank.Nine]).toBe(14);
  });

  it('Ace of trump is worth 11 points', () => {
    expect(TRUMP_POINTS[Rank.Ace]).toBe(11);
  });

  it('Ten of trump is worth 10 points', () => {
    expect(TRUMP_POINTS[Rank.Ten]).toBe(10);
  });

  it('King of trump is worth 4 points', () => {
    expect(TRUMP_POINTS[Rank.King]).toBe(4);
  });

  it('Queen of trump is worth 3 points', () => {
    expect(TRUMP_POINTS[Rank.Queen]).toBe(3);
  });

  it('Seven and Eight of trump are worth 0 points', () => {
    expect(TRUMP_POINTS[Rank.Seven]).toBe(0);
    expect(TRUMP_POINTS[Rank.Eight]).toBe(0);
  });
});

describe('PLAIN_POINTS', () => {
  it('Ace is worth 11 points', () => {
    expect(PLAIN_POINTS[Rank.Ace]).toBe(11);
  });

  it('Ten is worth 10 points', () => {
    expect(PLAIN_POINTS[Rank.Ten]).toBe(10);
  });

  it('King is worth 4 points', () => {
    expect(PLAIN_POINTS[Rank.King]).toBe(4);
  });

  it('Queen is worth 3 points', () => {
    expect(PLAIN_POINTS[Rank.Queen]).toBe(3);
  });

  it('Jack is worth 2 points', () => {
    expect(PLAIN_POINTS[Rank.Jack]).toBe(2);
  });

  it('Nine is worth 0 points', () => {
    expect(PLAIN_POINTS[Rank.Nine]).toBe(0);
  });

  it('Seven and Eight are worth 0 points', () => {
    expect(PLAIN_POINTS[Rank.Seven]).toBe(0);
    expect(PLAIN_POINTS[Rank.Eight]).toBe(0);
  });
});

describe('cardStrength - trump ordering', () => {
  // Jack > 9 > Ace > 10 > King > Queen > 8 > 7
  const trumpRanks = [
    Rank.Jack,
    Rank.Nine,
    Rank.Ace,
    Rank.Ten,
    Rank.King,
    Rank.Queen,
    Rank.Eight,
    Rank.Seven,
  ];

  it('trump cards are ordered: Jack > 9 > Ace > 10 > King > Queen > 8 > 7', () => {
    for (let i = 0; i < trumpRanks.length - 1; i++) {
      const stronger = cardStrength(card(trumpSuit, trumpRanks[i]), trumpSuit);
      const weaker = cardStrength(card(trumpSuit, trumpRanks[i + 1]), trumpSuit);
      expect(stronger).toBeGreaterThan(weaker);
    }
  });

  it('Jack of trump has highest strength', () => {
    const jackStrength = cardStrength(card(trumpSuit, Rank.Jack), trumpSuit);
    for (const rank of [Rank.Nine, Rank.Ace, Rank.Ten, Rank.King, Rank.Queen, Rank.Eight, Rank.Seven]) {
      expect(jackStrength).toBeGreaterThan(cardStrength(card(trumpSuit, rank), trumpSuit));
    }
  });

  it('Nine of trump is second strongest', () => {
    const nineStrength = cardStrength(card(trumpSuit, Rank.Nine), trumpSuit);
    const jackStrength = cardStrength(card(trumpSuit, Rank.Jack), trumpSuit);
    const aceStrength = cardStrength(card(trumpSuit, Rank.Ace), trumpSuit);
    expect(nineStrength).toBeLessThan(jackStrength);
    expect(nineStrength).toBeGreaterThan(aceStrength);
  });
});

describe('cardStrength - plain ordering', () => {
  // Ace > King > 10 > Queen > Jack > 9 > 8 > 7
  const plainSuit = Suit.Spades; // not trump
  const plainRanks = [
    Rank.Ace,
    Rank.King,
    Rank.Ten,
    Rank.Queen,
    Rank.Jack,
    Rank.Nine,
    Rank.Eight,
    Rank.Seven,
  ];

  it('plain cards are ordered: Ace > King > 10 > Queen > Jack > 9 > 8 > 7', () => {
    for (let i = 0; i < plainRanks.length - 1; i++) {
      const stronger = cardStrength(card(plainSuit, plainRanks[i]), trumpSuit);
      const weaker = cardStrength(card(plainSuit, plainRanks[i + 1]), trumpSuit);
      expect(stronger).toBeGreaterThan(weaker);
    }
  });

  it('Ace is the strongest plain card', () => {
    const aceStrength = cardStrength(card(plainSuit, Rank.Ace), trumpSuit);
    for (const rank of [Rank.King, Rank.Ten, Rank.Queen, Rank.Jack, Rank.Nine, Rank.Eight, Rank.Seven]) {
      expect(aceStrength).toBeGreaterThan(cardStrength(card(plainSuit, rank), trumpSuit));
    }
  });
});

describe('cardPoints', () => {
  it('returns trump points for trump cards', () => {
    expect(cardPoints(card(trumpSuit, Rank.Jack), trumpSuit)).toBe(20);
    expect(cardPoints(card(trumpSuit, Rank.Nine), trumpSuit)).toBe(14);
  });

  it('returns plain points for non-trump cards', () => {
    expect(cardPoints(card(Suit.Spades, Rank.Jack), trumpSuit)).toBe(2);
    expect(cardPoints(card(Suit.Spades, Rank.Nine), trumpSuit)).toBe(0);
  });
});

describe('compareCards', () => {
  it('returns positive when first card is stronger', () => {
    const result = compareCards(
      card(trumpSuit, Rank.Jack),
      card(trumpSuit, Rank.Nine),
      trumpSuit,
    );
    expect(result).toBeGreaterThan(0);
  });

  it('returns negative when first card is weaker', () => {
    const result = compareCards(
      card(trumpSuit, Rank.Seven),
      card(trumpSuit, Rank.Jack),
      trumpSuit,
    );
    expect(result).toBeLessThan(0);
  });

  it('returns 0 for equal cards', () => {
    const result = compareCards(
      card(trumpSuit, Rank.Ace),
      card(trumpSuit, Rank.Ace),
      trumpSuit,
    );
    expect(result).toBe(0);
  });
});

describe('isTrump', () => {
  it('returns true for trump suit cards', () => {
    expect(isTrump(card(trumpSuit, Rank.Ace), trumpSuit)).toBe(true);
  });

  it('returns false for non-trump suit cards', () => {
    expect(isTrump(card(Suit.Spades, Rank.Ace), trumpSuit)).toBe(false);
  });
});
