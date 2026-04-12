import type { Card } from './card.js';
import type { Seat } from '../utils/seat.js';

export interface TrickCard {
  readonly seat: Seat;
  readonly card: Card;
}

export interface Trick {
  readonly number: number;
  readonly cards: readonly TrickCard[];
  readonly leader: Seat;
  winner?: Seat;
}

export function createTrick(number: number, leader: Seat): Trick {
  return { number, cards: [], leader };
}

export function isTrickComplete(trick: Trick): boolean {
  return trick.cards.length === 4;
}

export function trickLeadSuit(trick: Trick): Card['suit'] | undefined {
  return trick.cards.length > 0 ? trick.cards[0].card.suit : undefined;
}
