'use client';

interface ScoreboardProps {
  team1Score: number;
  team2Score: number;
  targetScore: number;
  team1Names: string[];
  team2Names: string[];
  roundNumber: number;
  roundTeam1Points?: number;
  roundTeam2Points?: number;
  tricksWon?: { team1: number; team2: number };
}

export function Scoreboard({
  team1Score,
  team2Score,
  targetScore,
  team1Names,
  team2Names,
  roundNumber,
  roundTeam1Points,
  roundTeam2Points,
  tricksWon,
}: ScoreboardProps) {
  const showRoundPoints = roundTeam1Points !== undefined || roundTeam2Points !== undefined;

  return (
    <div className="rounded-lg border border-border bg-surface/80 px-4 py-2 backdrop-blur">
      <div className="mb-1 text-center text-xs text-text-dim">
        Manche {roundNumber} &middot; Objectif {targetScore}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-xs text-team1">{team1Names.join(' & ')}</div>
          <div className="font-mono text-xl font-bold text-team1">{team1Score}</div>
          {showRoundPoints && (
            <div className="font-mono text-xs text-team1/70">
              +{roundTeam1Points ?? 0} ({tricksWon?.team1 ?? 0} plis)
            </div>
          )}
        </div>
        <div className="text-text-dim">-</div>
        <div className="text-center">
          <div className="text-xs text-team2">{team2Names.join(' & ')}</div>
          <div className="font-mono text-xl font-bold text-team2">{team2Score}</div>
          {showRoundPoints && (
            <div className="font-mono text-xs text-team2/70">
              +{roundTeam2Points ?? 0} ({tricksWon?.team2 ?? 0} plis)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
