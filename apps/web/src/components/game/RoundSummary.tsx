'use client';

import type { RoundScore } from '@contree/engine';
import { Button } from '../ui/Button';

interface RoundSummaryProps {
  score: RoundScore;
  team1Names: string[];
  team2Names: string[];
  onNextRound: () => void;
}

export function RoundSummary({ score, team1Names, team2Names, onNextRound }: RoundSummaryProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h2 className="font-display text-3xl font-bold text-gold">Fin de manche</h2>

      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-left text-text-dim"></th>
              <th className="py-2 text-center text-team1">{team1Names.join(' & ')}</th>
              <th className="py-2 text-center text-team2">{team2Names.join(' & ')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 text-text-dim">Points des plis</td>
              <td className="py-1 text-center font-mono">{score.trickPoints.team1}</td>
              <td className="py-1 text-center font-mono">{score.trickPoints.team2}</td>
            </tr>
            <tr>
              <td className="py-1 text-text-dim">Dix de der</td>
              <td className="py-1 text-center font-mono">{score.lastTrickBonus.team1}</td>
              <td className="py-1 text-center font-mono">{score.lastTrickBonus.team2}</td>
            </tr>
            <tr>
              <td className="py-1 text-text-dim">Belote</td>
              <td className="py-1 text-center font-mono">{score.belote.team1}</td>
              <td className="py-1 text-center font-mono">{score.belote.team2}</td>
            </tr>
            {score.contreMultiplier > 1 && (
              <tr>
                <td className="py-1 text-text-dim">Multiplicateur</td>
                <td colSpan={2} className="py-1 text-center font-mono text-gold">
                  x{score.contreMultiplier}
                </td>
              </tr>
            )}
            <tr className="border-t border-border font-bold">
              <td className="py-2">
                {score.contractMet ? (
                  <span className="text-accent-green">Contrat tenu</span>
                ) : (
                  <span className="text-accent-red">Contrat chute</span>
                )}
              </td>
              <td className="py-2 text-center font-mono text-lg">{score.finalScore.team1}</td>
              <td className="py-2 text-center font-mono text-lg">{score.finalScore.team2}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Button onClick={onNextRound} className="px-8 py-3">
        Manche suivante
      </Button>
    </div>
  );
}
