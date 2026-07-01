export var Seat;
(function (Seat) {
    Seat["North"] = "north";
    Seat["East"] = "east";
    Seat["South"] = "south";
    Seat["West"] = "west";
})(Seat || (Seat = {}));
const SEAT_ORDER = [Seat.North, Seat.East, Seat.South, Seat.West];
/** Get the next seat clockwise */
export function nextSeat(seat) {
    const idx = SEAT_ORDER.indexOf(seat);
    return SEAT_ORDER[(idx + 1) % 4];
}
/** Get the partner's seat (across the table) */
export function partnerSeat(seat) {
    const idx = SEAT_ORDER.indexOf(seat);
    return SEAT_ORDER[(idx + 2) % 4];
}
/** Get all seats starting from a given seat, clockwise */
export function seatsFrom(start) {
    const idx = SEAT_ORDER.indexOf(start);
    return [
        SEAT_ORDER[idx],
        SEAT_ORDER[(idx + 1) % 4],
        SEAT_ORDER[(idx + 2) % 4],
        SEAT_ORDER[(idx + 3) % 4],
    ];
}
/** Check if two seats are on the same team (N/S or E/W) */
export function arePartners(a, b) {
    return partnerSeat(a) === b;
}
export { SEAT_ORDER };
//# sourceMappingURL=seat.js.map