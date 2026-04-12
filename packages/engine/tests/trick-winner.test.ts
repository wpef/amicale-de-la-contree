import { describe, it, expect } from 'vitest';
import { Suit, Rank, type Card } from '../src/domain/card.js';
import { Seat } from '../src/utils/seat.js';
import type { Trick, TrickCard } from '../src/domain/trick.js';
import { determineTrickWinner } from '../src/rules/trick-winner.js';

function card(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

function makeTrick(cards: TrickCard[], leader: Seat = cards[0].seat): Trick {
  return { number: 1, cards, leader };
}

const trumpSuit = Suit.Hearts;

describe('determineTrickWinner', () => {
  it('highest card of led suit wins when no trump played', () => {
    const trick = makeTrick([
      { seat: Seat.North, card: card(Suit.Spades, Rank.Ten) },
      { seat: Seat.East, card: card(Suit.Spades, Rank.King) },
      { seat: Seat.South, card: card(Suit.Spades, Rank.Ace) },
      { seat: Seat.West, card: card(Suit.Spades, Rank.Seven) },
    ]);
    expect(determineTrickWinner(trick, trumpSuit)).toBe(Seat.South);
  });

  it('cards of a non-led, non-trump suit do not win', () => {
    const trick = makeTrick([
      { seat: Seat.North, card: card(Suit.Spades, Rank.Seven) },
      { seat: Seat.East, card: card(Suit.Diamonds, Rank.Ace) }, // off-suit, not trump
      { seat: Seat.South, card: card(Suit.Spades, Rank.Eight) },
      { seat: Seat.West, card: card(Suit.Clubs, Rank.Ace) }, // off-suit, not trump
    ]);
    // Only spades count; Eight > Seven in plain
    expect(determineTrickWinner(trick, trumpSuit)).toBe(Seat.South);
  });

  it('trump beats any non-trump card', () => {
    const trick = makeTrick([
      { seat: Seat.North, card: card(Suit.Spades, Rank.Ace) },
      { seat: Seat.East, card: card(trumpSuit, Rank.Seven) }, // lowest trump
      { seat: Seat.South, card: card(Suit.Spades, Rank.King) },
      { seat: Seat.West, card: card(Suit.Spades, Rank.Ten) },
    ]);
    expect(determineTrickWinner(trick, trumpSuit)).toBe(Seat.East);
  });

  it('highest trump wins when multiple trumps are played', () => {
    const trick = makeTrick([
      { seat: Seat.North, card: card(trumpSuit, Rank.Seven) },
      { seat: Seat.East, card: card(trumpSuit, Rank.Ace) },
      { seat: Seat.South, card: card(trumpSuit, Rank.Eight) },
      { seat: Seat.West, card: card(trumpSuit, Rank.Ten) },
    ]);
    // Trump strength: Jack(7) > 9(6) > Ace(5) > 10(4) > King(3) > Queen(2) > 8(1) > 7(0)
    expect(determineTrickWinner(trick, trumpSuit)).toBe(Seat.East);
  });

  it('Jack of trump beats everything', () => {
    const trick = makeTrick([
      { seat: Seat.North, card: card(trumpSuit, Rank.Nine) },
      { seat: Seat.East, card: card(trumpSuit, Rank.Ace) },
      { seat: Seat.South, card: card(trumpSuit, Rank.Jack) },
      { seat: Seat.West, card: card(trumpSuit, Rank.Ten) },
    ]);
    expect(determineTrickWinner(trick, trumpSuit)).toBe(Seat.South);
  });

  it('Nine of trump beats Ace of trump', () => {
    const trick = makeTrick([
      { seat: Seat.North, card: card(trumpSuit, Rank.Nine) },
      { seat: Seat.East, card: card(trumpSuit, Rank.Ace) },
      { seat: Seat.South, card: card(trumpSuit, Rank.Eight) },
      { seat: Seat.West, card: card(trumpSuit, Rank.Ten) },
    ]);
    expect(determineTrickWinner(trick, trumpSuit)).toBe(Seat.North);
  });

  it('leader wins when all play equal-weight off-suits (only leader suit counts)', () => {
    // North leads clubs, others play off-suit diamonds (not trump)
    const trick = makeTrick([
      { seat: Seat.North, card: card(Suit.Clubs, Rank.Seven) },
      { seat: Seat.East, card: card(Suit.Diamonds, Rank.Ace) },
      { seat: Seat.South, card: card(Suit.Diamonds, Rank.King) },
      { seat: Seat.West, card: card(Suit.Diamonds, Rank.Ten) },
    ]);
    // Only clubs count; North is the only one with clubs
    expect(determineTrickWinner(trick, trumpSuit)).toBe(Seat.North);
  });

  it('trump played by last player still wins', () => {
    const trick = makeTrick([
      { seat: Seat.North, card: card(Suit.Spades, Rank.Ace) },
      { seat: Seat.East, card: card(Suit.Spades, Rank.King) },
      { seat: Seat.South, card: card(Suit.Spades, Rank.Ten) },
      { seat: Seat.West, card: card(trumpSuit, Rank.Seven) },
    ]);
    expect(determineTrickWinner(trick, trumpSuit)).toBe(Seat.West);
  });

  it('throws if trick has fewer than 4 cards', () => {
    const trick = makeTrick(
      [
        { seat: Seat.North, card: card(Suit.Spades, Rank.Ace) },
        { seat: Seat.East, card: card(Suit.Spades, Rank.King) },
      ],
    );
    expect(() => determineTrickWinner(trick, trumpSuit)).toThrow('Trick must have 4 cards');
  });
});
