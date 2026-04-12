import type { Seat } from '../utils/seat.js';

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly seat: Seat;
}
