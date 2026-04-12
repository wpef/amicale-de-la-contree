import { describe, it, expect } from 'vitest';
import { Suit, Rank, type Card, cardId } from '../src/domain/card.js';
import { Seat } from '../src/utils/seat.js';
import type { Trick, TrickCard } from '../src/domain/trick.js';
import { getPlayableCards, isCardPlayable } from '../src/rules/play-validation.js';

const trumpSuit = Suit.Hearts;

function c(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

function emptyTrick(leader: Seat = Seat.North): Trick {
  return { number: 1, cards: [], leader };
}

function trickWith(cards: TrickCard[], leader?: Seat): Trick {
  return { number: 1, cards, leader: leader ?? cards[0].seat };
}

describe('getPlayableCards', () => {
  describe('leading (first to play)', () => {
    it('any card is valid when leading', () => {
      const hand = [
        c(Suit.Spades, Rank.Ace),
        c(Suit.Hearts, Rank.Jack),
        c(Suit.Diamonds, Rank.Seven),
        c(Suit.Clubs, Rank.Ten),
      ];
      const trick = emptyTrick(Seat.North);
      const playable = getPlayableCards(hand, trick, trumpSuit, Seat.North);
      expect(playable).toHaveLength(hand.length);
      expect(playable.map(cardId).sort()).toEqual(hand.map(cardId).sort());
    });
  });

  describe('must follow suit', () => {
    it('must play led suit when having it (non-trump led)', () => {
      const hand = [
        c(Suit.Spades, Rank.Ace),
        c(Suit.Spades, Rank.King),
        c(Suit.Hearts, Rank.Jack), // trump
        c(Suit.Diamonds, Rank.Seven),
      ];
      const trick = trickWith([
        { seat: Seat.North, card: c(Suit.Spades, Rank.Ten) },
      ]);
      const playable = getPlayableCards(hand, trick, trumpSuit, Seat.East);
      // Must follow spades
      expect(playable).toHaveLength(2);
      expect(playable.every((p) => p.suit === Suit.Spades)).toBe(true);
    });

    it('can play any card of the led suit (no obligation to go higher in non-trump)', () => {
      const hand = [
        c(Suit.Spades, Rank.Seven), // lower than led 10
        c(Suit.Spades, Rank.Ace),
        c(Suit.Hearts, Rank.Nine),
      ];
      const trick = trickWith([
        { seat: Seat.North, card: c(Suit.Spades, Rank.Ten) },
      ]);
      const playable = getPlayableCards(hand, trick, trumpSuit, Seat.East);
      expect(playable).toHaveLength(2);
      expect(playable.some((p) => p.rank === Rank.Seven)).toBe(true);
      expect(playable.some((p) => p.rank === Rank.Ace)).toBe(true);
    });
  });

  describe('led suit is trump: must go higher if possible', () => {
    it('must play trump and go higher when trump is led and higher trump available', () => {
      const hand = [
        c(trumpSuit, Rank.Jack), // strength 7 (highest)
        c(trumpSuit, Rank.Seven), // strength 0
        c(Suit.Spades, Rank.Ace),
      ];
      const trick = trickWith([
        { seat: Seat.North, card: c(trumpSuit, Rank.Nine) }, // strength 6
      ]);
      const playable = getPlayableCards(hand, trick, trumpSuit, Seat.East);
      // Must go higher than Nine: only Jack qualifies
      expect(playable).toHaveLength(1);
      expect(playable[0].rank).toBe(Rank.Jack);
    });

    it('can play any trump when cannot go higher in trump lead', () => {
      const hand = [
        c(trumpSuit, Rank.Seven), // strength 0
        c(trumpSuit, Rank.Eight), // strength 1
        c(Suit.Spades, Rank.Ace),
      ];
      const trick = trickWith([
        { seat: Seat.North, card: c(trumpSuit, Rank.Jack) }, // strength 7, highest
      ]);
      const playable = getPlayableCards(hand, trick, trumpSuit, Seat.East);
      // Cannot go higher than Jack, so any trump is fine
      expect(playable).toHaveLength(2);
      expect(playable.every((p) => p.suit === trumpSuit)).toBe(true);
    });
  });

  describe('cannot follow suit, partner winning', () => {
    it('can play anything when partner is winning', () => {
      // North leads spades, East plays trump, South (partner of North) plays
      // South has no spades. North is not winning (East trumped), but partner = North.
      // Actually let's make partner winning:
      // East leads diamonds, North plays higher diamond (partner winning for South who is North's partner)
      const hand = [
        c(Suit.Hearts, Rank.Seven), // trump
        c(Suit.Clubs, Rank.Ace),
        c(Suit.Clubs, Rank.King),
      ];
      // East leads diamond. North (South's partner) plays Ace of diamond, winning.
      const trick = trickWith([
        { seat: Seat.East, card: c(Suit.Diamonds, Rank.Seven) },
        { seat: Seat.North, card: c(Suit.Diamonds, Rank.Ace) }, // partner of South, winning
      ], Seat.East);
      // South has no diamonds, but partner (North) is winning
      const playable = getPlayableCards(hand, trick, trumpSuit, Seat.South);
      expect(playable).toHaveLength(3); // can play anything
    });
  });

  describe('cannot follow suit, partner NOT winning: must cut', () => {
    it('must play trump when partner is not winning and has trump', () => {
      const hand = [
        c(trumpSuit, Rank.Seven),
        c(trumpSuit, Rank.Ace),
        c(Suit.Clubs, Rank.King),
      ];
      // North leads spades, East plays higher spade. South (partner of North) can't follow.
      // North is not winning (East has higher spade), so South must cut.
      const trick = trickWith([
        { seat: Seat.North, card: c(Suit.Spades, Rank.Seven) },
        { seat: Seat.East, card: c(Suit.Spades, Rank.Ace) },
      ]);
      const playable = getPlayableCards(hand, trick, trumpSuit, Seat.South);
      // Must play trump
      expect(playable.every((p) => p.suit === trumpSuit)).toBe(true);
      expect(playable.length).toBeGreaterThanOrEqual(1);
    });

    it('must go higher in trump when cutting and higher trump available', () => {
      const hand = [
        c(trumpSuit, Rank.Ace), // strength 5
        c(trumpSuit, Rank.Seven), // strength 0
        c(Suit.Clubs, Rank.King),
      ];
      // North leads spades, East cuts with trump Eight (strength 1)
      const trick = trickWith([
        { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) },
        { seat: Seat.East, card: c(trumpSuit, Rank.Eight) }, // trump, strength 1
      ]);
      // South (partner of North, North not winning since East trumped) must play trump higher than 8
      const playable = getPlayableCards(hand, trick, trumpSuit, Seat.South);
      // Only Ace of trump (strength 5 > 1) qualifies
      expect(playable).toHaveLength(1);
      expect(playable[0].rank).toBe(Rank.Ace);
    });

    it('can play any trump when cannot go higher in cutting', () => {
      const hand = [
        c(trumpSuit, Rank.Seven), // strength 0
        c(trumpSuit, Rank.Eight), // strength 1
        c(Suit.Clubs, Rank.King),
      ];
      // North leads spades, East cuts with trump Jack (highest)
      const trick = trickWith([
        { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) },
        { seat: Seat.East, card: c(trumpSuit, Rank.Jack) },
      ]);
      const playable = getPlayableCards(hand, trick, trumpSuit, Seat.South);
      // Cannot go higher than Jack; can play any trump
      expect(playable).toHaveLength(2);
      expect(playable.every((p) => p.suit === trumpSuit)).toBe(true);
    });
  });

  describe('cannot follow suit, no trump: defausse', () => {
    it('can play anything when no led suit and no trump', () => {
      const hand = [
        c(Suit.Clubs, Rank.Ace),
        c(Suit.Clubs, Rank.King),
        c(Suit.Diamonds, Rank.Seven),
      ];
      // Led suit is spades, player has no spades and no trump
      const trick = trickWith([
        { seat: Seat.North, card: c(Suit.Spades, Rank.Ten) },
      ]);
      const playable = getPlayableCards(hand, trick, trumpSuit, Seat.East);
      expect(playable).toHaveLength(3); // can play anything
    });
  });

  describe('fourth player scenarios', () => {
    it('fourth player must still follow suit if possible', () => {
      const hand = [
        c(Suit.Spades, Rank.Seven),
        c(Suit.Hearts, Rank.Ace), // trump
        c(Suit.Clubs, Rank.King),
      ];
      const trick = trickWith([
        { seat: Seat.North, card: c(Suit.Spades, Rank.Ten) },
        { seat: Seat.East, card: c(Suit.Spades, Rank.King) },
        { seat: Seat.South, card: c(Suit.Spades, Rank.Ace) },
      ]);
      const playable = getPlayableCards(hand, trick, trumpSuit, Seat.West);
      expect(playable).toHaveLength(1);
      expect(playable[0]).toEqual(c(Suit.Spades, Rank.Seven));
    });

    it('fourth player can play anything when partner winning and no led suit', () => {
      const hand = [
        c(trumpSuit, Rank.Seven),
        c(Suit.Clubs, Rank.King),
        c(Suit.Diamonds, Rank.Ace),
      ];
      // East leads diamonds, South plays Ace (winning). West's partner is East.
      // Actually, West's partner is East. East led Seven of diamonds.
      // South played Ace of diamonds. South is winning. West's partner is East, not South.
      // So partner is NOT winning. Let's fix:
      // South leads diamonds, West is fourth. West's partner is East.
      // East played Ace of diamonds (winning).
      const trick = trickWith([
        { seat: Seat.South, card: c(Suit.Diamonds, Rank.Seven) },
        { seat: Seat.West, card: c(Suit.Diamonds, Rank.Eight) },
        { seat: Seat.North, card: c(Suit.Diamonds, Rank.Nine) },
      ], Seat.South);
      // East is fourth, partner is West. West played 8, North played 9.
      // 9 > 8 > 7 in plain, so North is winning. West (partner) not winning.
      // East has no diamonds, partner not winning, must cut if has trump.
      // Let's re-do to test "partner winning":
      const trick2 = trickWith([
        { seat: Seat.North, card: c(Suit.Diamonds, Rank.Seven) },
        { seat: Seat.East, card: c(Suit.Diamonds, Rank.Ace) }, // winning
        { seat: Seat.South, card: c(Suit.Diamonds, Rank.Eight) },
      ]);
      // West plays fourth. Partner is East, who is winning with Ace.
      const hand2 = [
        c(trumpSuit, Rank.Seven),
        c(Suit.Clubs, Rank.King),
        c(Suit.Clubs, Rank.Ace),
      ];
      const playable = getPlayableCards(hand2, trick2, trumpSuit, Seat.West);
      // Partner winning, no diamonds => can play anything
      expect(playable).toHaveLength(3);
    });
  });
});

describe('isCardPlayable', () => {
  it('returns true for a valid card', () => {
    const hand = [c(Suit.Spades, Rank.Ace), c(Suit.Hearts, Rank.Jack)];
    const trick = emptyTrick(Seat.North);
    expect(isCardPlayable(c(Suit.Spades, Rank.Ace), hand, trick, trumpSuit, Seat.North)).toBe(
      true,
    );
  });

  it('returns false for a card not in the playable set', () => {
    const hand = [
      c(Suit.Spades, Rank.Ace),
      c(Suit.Spades, Rank.King),
      c(Suit.Hearts, Rank.Jack),
    ];
    // Must follow spades
    const trick = trickWith([
      { seat: Seat.North, card: c(Suit.Spades, Rank.Ten) },
    ]);
    // Hearts Jack is not playable (must follow spades)
    expect(
      isCardPlayable(c(Suit.Hearts, Rank.Jack), hand, trick, trumpSuit, Seat.East),
    ).toBe(false);
  });
});
