export enum Seat {
  North = 'north',
  East = 'east',
  South = 'south',
  West = 'west',
}

const SEAT_ORDER: readonly Seat[] = [Seat.North, Seat.East, Seat.South, Seat.West];

/** Get the next seat clockwise */
export function nextSeat(seat: Seat): Seat {
  const idx = SEAT_ORDER.indexOf(seat);
  return SEAT_ORDER[(idx + 1) % 4];
}

/** Get the partner's seat (across the table) */
export function partnerSeat(seat: Seat): Seat {
  const idx = SEAT_ORDER.indexOf(seat);
  return SEAT_ORDER[(idx + 2) % 4];
}

/** Get all seats starting from a given seat, clockwise */
export function seatsFrom(start: Seat): readonly Seat[] {
  const idx = SEAT_ORDER.indexOf(start);
  return [
    SEAT_ORDER[idx],
    SEAT_ORDER[(idx + 1) % 4],
    SEAT_ORDER[(idx + 2) % 4],
    SEAT_ORDER[(idx + 3) % 4],
  ];
}

/** Check if two seats are on the same team (N/S or E/W) */
export function arePartners(a: Seat, b: Seat): boolean {
  return partnerSeat(a) === b;
}

export { SEAT_ORDER };
