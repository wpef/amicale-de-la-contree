import { describe, it, expect } from 'vitest';
import { shuffle, deal, createShuffledDeck } from '../src/domain/deck.js';
import { DECK_32, cardId } from '../src/domain/card.js';

describe('shuffle', () => {
  it('returns exactly 32 cards', () => {
    const shuffled = shuffle(DECK_32);
    expect(shuffled).toHaveLength(32);
  });

  it('contains all the same cards as the input', () => {
    const shuffled = shuffle(DECK_32);
    const originalIds = new Set(DECK_32.map(cardId));
    const shuffledIds = new Set(shuffled.map(cardId));
    expect(shuffledIds).toEqual(originalIds);
  });

  it('does not mutate the original array', () => {
    const original = [...DECK_32];
    shuffle(DECK_32);
    expect(DECK_32).toEqual(original);
  });

  it('produces a different order from the input (with high probability)', () => {
    // Run multiple shuffles and check at least one differs
    let foundDifferent = false;
    for (let i = 0; i < 5; i++) {
      const shuffled = shuffle(DECK_32);
      const sameOrder = DECK_32.every((c, idx) => cardId(c) === cardId(shuffled[idx]));
      if (!sameOrder) {
        foundDifferent = true;
        break;
      }
    }
    expect(foundDifferent).toBe(true);
  });
});

describe('deal', () => {
  it('produces 4 hands of 8 cards each', () => {
    const shuffled = shuffle(DECK_32);
    const hands = deal(shuffled);
    expect(hands).toHaveLength(4);
    for (const hand of hands) {
      expect(hand).toHaveLength(8);
    }
  });

  it('distributes all 32 cards with no duplicates', () => {
    const shuffled = shuffle(DECK_32);
    const hands = deal(shuffled);
    const allDealt = hands.flat();
    expect(allDealt).toHaveLength(32);

    const ids = new Set(allDealt.map(cardId));
    expect(ids.size).toBe(32);
  });

  it('follows 3-2-3 pattern', () => {
    // Create a deck with known order so we can verify the pattern
    const ordered = [...DECK_32]; // indices 0-31

    const hands = deal(ordered);
    // Round 1 (3 each): P0 gets 0,1,2 - P1 gets 3,4,5 - P2 gets 6,7,8 - P3 gets 9,10,11
    // Round 2 (2 each): P0 gets 12,13 - P1 gets 14,15 - P2 gets 16,17 - P3 gets 18,19
    // Round 3 (3 each): P0 gets 20,21,22 - P1 gets 23,24,25 - P2 gets 26,27,28 - P3 gets 29,30,31

    // Player 0 should have cards at indices: 0,1,2,12,13,20,21,22
    const p0Ids = hands[0].map(cardId);
    expect(p0Ids).toEqual([
      cardId(ordered[0]),
      cardId(ordered[1]),
      cardId(ordered[2]),
      cardId(ordered[12]),
      cardId(ordered[13]),
      cardId(ordered[20]),
      cardId(ordered[21]),
      cardId(ordered[22]),
    ]);

    // Player 1 should have cards at indices: 3,4,5,14,15,23,24,25
    const p1Ids = hands[1].map(cardId);
    expect(p1Ids).toEqual([
      cardId(ordered[3]),
      cardId(ordered[4]),
      cardId(ordered[5]),
      cardId(ordered[14]),
      cardId(ordered[15]),
      cardId(ordered[23]),
      cardId(ordered[24]),
      cardId(ordered[25]),
    ]);
  });

  it('throws if deck does not have 32 cards', () => {
    expect(() => deal(DECK_32.slice(0, 20))).toThrow('Expected 32 cards');
    expect(() => deal([])).toThrow('Expected 32 cards');
  });
});

describe('createShuffledDeck', () => {
  it('returns 32 cards', () => {
    const deck = createShuffledDeck();
    expect(deck).toHaveLength(32);
  });

  it('contains all cards from DECK_32', () => {
    const deck = createShuffledDeck();
    const originalIds = new Set(DECK_32.map(cardId));
    const deckIds = new Set(deck.map(cardId));
    expect(deckIds).toEqual(originalIds);
  });
});
