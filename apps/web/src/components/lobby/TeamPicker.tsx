'use client';

import { Button } from '../ui/Button';

interface Player {
  id: string;
  name: string;
  seat: string;
  team: string;
}

interface TeamPickerProps {
  players: Player[];
  isHost: boolean;
  onRandomize: () => void;
  onStart: () => void;
}

export function TeamPicker({ players, isHost, onRandomize, onStart }: TeamPickerProps) {
  const team1 = players.filter((p) => p.team === 'team1');
  const team2 = players.filter((p) => p.team === 'team2');

  return (
    <div className="w-full max-w-md space-y-6">
      <h2 className="text-center font-display text-2xl font-bold text-gold">Equipes</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Team 1 */}
        <div className="rounded-lg border-2 border-team1 bg-team1/10 p-4">
          <h3 className="mb-2 text-center font-semibold text-team1">Equipe 1</h3>
          <div className="space-y-2">
            {team1.map((p) => (
              <div key={p.id} className="rounded bg-surface px-3 py-1.5 text-center text-text">
                {p.name}
                <span className="ml-1 text-xs text-text-dim">({p.seat})</span>
              </div>
            ))}
            {team1.length < 2 && (
              <div className="rounded border border-dashed border-border px-3 py-1.5 text-center text-text-dim">
                En attente...
              </div>
            )}
          </div>
        </div>

        {/* Team 2 */}
        <div className="rounded-lg border-2 border-team2 bg-team2/10 p-4">
          <h3 className="mb-2 text-center font-semibold text-team2">Equipe 2</h3>
          <div className="space-y-2">
            {team2.map((p) => (
              <div key={p.id} className="rounded bg-surface px-3 py-1.5 text-center text-text">
                {p.name}
                <span className="ml-1 text-xs text-text-dim">({p.seat})</span>
              </div>
            ))}
            {team2.length < 2 && (
              <div className="rounded border border-dashed border-border px-3 py-1.5 text-center text-text-dim">
                En attente...
              </div>
            )}
          </div>
        </div>
      </div>

      {isHost && (
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onRandomize}>
            Tirer les rois
          </Button>
          <Button className="flex-1" onClick={onStart} disabled={players.length !== 4}>
            Lancer la partie
          </Button>
        </div>
      )}
    </div>
  );
}
