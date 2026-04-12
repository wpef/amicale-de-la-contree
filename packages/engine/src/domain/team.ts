export enum TeamId {
  Team1 = 'team1',
  Team2 = 'team2',
}

export interface Team {
  readonly id: TeamId;
  readonly playerIds: [string, string];
  score: number;
}

import { Seat } from '../utils/seat.js';

/** Team1 = North/South, Team2 = East/West */
export function teamForSeat(seat: Seat): TeamId {
  return seat === Seat.North || seat === Seat.South ? TeamId.Team1 : TeamId.Team2;
}

export function oppositeTeam(team: TeamId): TeamId {
  return team === TeamId.Team1 ? TeamId.Team2 : TeamId.Team1;
}
