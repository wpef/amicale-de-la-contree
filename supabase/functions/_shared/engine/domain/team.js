export var TeamId;
(function (TeamId) {
    TeamId["Team1"] = "team1";
    TeamId["Team2"] = "team2";
})(TeamId || (TeamId = {}));
import { Seat } from '../utils/seat.js';
/** Team1 = North/South, Team2 = East/West */
export function teamForSeat(seat) {
    return seat === Seat.North || seat === Seat.South ? TeamId.Team1 : TeamId.Team2;
}
export function oppositeTeam(team) {
    return team === TeamId.Team1 ? TeamId.Team2 : TeamId.Team1;
}
//# sourceMappingURL=team.js.map