import type { Suit } from './card.js';

export const BID_VALUES = [80, 90, 100, 110, 120, 130, 140, 150, 160] as const;
export const CAPOT_VALUE = 250;
export const GENERALE_VALUE = 500;

export type BidPoints = (typeof BID_VALUES)[number] | typeof CAPOT_VALUE | typeof GENERALE_VALUE;

export interface Bid {
  readonly playerId: string;
  readonly points: BidPoints;
  readonly suit: Suit;
}

export type BidAction =
  | { readonly type: 'bid'; readonly bid: Bid }
  | { readonly type: 'pass'; readonly playerId: string }
  | { readonly type: 'contrer'; readonly playerId: string }
  | { readonly type: 'surcontrer'; readonly playerId: string };

export function isBidHigher(newBid: BidPoints, currentBid: BidPoints): boolean {
  return newBid > currentBid;
}
