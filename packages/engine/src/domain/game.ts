import type { Player } from './player.js';
import type { Team, TeamId } from './team.js';
import type { Round } from './round.js';

export interface Game {
  readonly id: string;
  readonly roomCode: string;
  readonly players: Record<string, Player>;
  readonly teams: { team1: Team; team2: Team };
  readonly targetScore: number;
  readonly rounds: Round[];
  readonly currentRound: Round | null;
  readonly winner: TeamId | null;
}
