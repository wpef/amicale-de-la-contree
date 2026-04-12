'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function LocalSetupPage() {
  const router = useRouter();
  const [names, setNames] = useState(['', '', '', '']);

  useEffect(() => {
    const myName = localStorage.getItem('playerName') ?? '';
    if (myName) {
      setNames((prev) => [myName, prev[1], prev[2], prev[3]]);
    }
  }, []);

  const updateName = (index: number, value: string) => {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const allFilled = names.every((n) => n.trim().length >= 2);
  const allUnique = new Set(names.map((n) => n.trim().toLowerCase())).size === 4;

  const handleStart = () => {
    if (!allFilled || !allUnique) return;
    // Store player names for the local game
    localStorage.setItem('localGamePlayers', JSON.stringify(names.map((n) => n.trim())));
    router.push('/local/play');
  };

  const seatLabels = ['Nord', 'Est', 'Sud', 'Ouest'];
  const teamLabels = ['Equipe 1', 'Equipe 2', 'Equipe 1', 'Equipe 2'];
  const teamColors = ['text-team1', 'text-team2', 'text-team1', 'text-team2'];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-gold">Partie locale</h1>
          <p className="mt-1 text-text-dim">4 joueurs, 1 ecran, on se passe le telephone</p>
        </div>

        <div className="space-y-3">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-20 text-right">
                <div className="text-sm font-medium text-text">{seatLabels[i]}</div>
                <div className={`text-xs ${teamColors[i]}`}>{teamLabels[i]}</div>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={`Joueur ${i + 1}`}
                maxLength={20}
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-text placeholder-text-dim outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>
          ))}
        </div>

        {!allUnique && allFilled && (
          <p className="text-center text-sm text-accent-red">Les noms doivent etre differents</p>
        )}

        <div className="space-y-3">
          <Button onClick={handleStart} disabled={!allFilled || !allUnique} className="w-full py-3">
            Lancer la partie
          </Button>
          <Button onClick={() => router.push('/lobby')} variant="ghost" className="w-full">
            Retour
          </Button>
        </div>
      </div>
    </main>
  );
}
