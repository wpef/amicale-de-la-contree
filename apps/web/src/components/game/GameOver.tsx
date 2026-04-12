'use client';

import { Button } from '../ui/Button';

interface GameOverProps {
  winnerTeamNames: string[];
  loserTeamNames: string[];
  winnerScore: number;
  loserScore: number;
  isWinner: boolean;
  onRematchSameTeams: () => void;
  onRematchNewTeams: () => void;
  onBackToLobby: () => void;
}

export function GameOver({
  winnerTeamNames,
  loserTeamNames,
  winnerScore,
  loserScore,
  isWinner,
  onRematchSameTeams,
  onRematchNewTeams,
  onBackToLobby,
}: GameOverProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold text-gold">
          {isWinner ? 'Victoire !' : 'Defaite...'}
        </h1>
        <p className="mt-2 text-xl text-text-dim">
          {winnerTeamNames.join(' & ')} gagnent {winnerScore} a {loserScore}
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button onClick={onRematchSameTeams} className="w-full py-3">
          Revanche (memes equipes)
        </Button>
        <Button onClick={onRematchNewTeams} variant="secondary" className="w-full py-3">
          Changer les equipes
        </Button>
        <Button onClick={onBackToLobby} variant="ghost" className="w-full py-3">
          Retour au salon
        </Button>
      </div>
    </div>
  );
}
