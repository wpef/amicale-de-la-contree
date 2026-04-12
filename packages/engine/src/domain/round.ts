import type { Card } from './card.js';
import type { Contract } from './contract.js';
import type { BidAction } from './bid.js';
import type { Trick } from './trick.js';
import type { Seat } from '../utils/seat.js';

export interface RoundScore {
  readonly trickPoints: { team1: number; team2: number };
  readonly lastTrickBonus: { team1: number; team2: number };
  readonly belote: { team1: number; team2: number };
  readonly contractMet: boolean;
  readonly contreMultiplier: 1 | 2 | 4;
  readonly finalScore: { team1: number; team2: number };
}

export interface Round {
  readonly number: number;
  readonly dealer: Seat;
  readonly hands: Record<Seat, Card[]>;
  readonly bids: BidAction[];
  readonly contract: Contract | null;
  readonly tricks: Trick[];
  readonly currentTrick: Trick | null;
  readonly score: RoundScore | null;
  readonly beloteHolder: Seat | null;
}
