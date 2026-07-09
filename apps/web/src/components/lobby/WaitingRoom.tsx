'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import type { DbGamePlayer } from '@/lib/supabase/types';

interface WaitingRoomProps {
  roomCode: string;
  players: DbGamePlayer[];
  playerNames: Record<string, string>;
  isHost: boolean;
  busy: boolean;
  onRandomize: () => void;
  onStart: () => void;
  onLeave: () => void;
}

const SEAT_LABELS: Record<string, string> = {
  north: 'Nord',
  east: 'Est',
  south: 'Sud',
  west: 'Ouest',
};

export function WaitingRoom({
  roomCode,
  players,
  playerNames,
  isHost,
  busy,
  onRandomize,
  onStart,
  onLeave,
}: WaitingRoomProps) {
  const team1 = players.filter((p) => p.team === 'team1');
  const team2 = players.filter((p) => p.team === 'team2');
  const full = players.length === 4;
  const [copied, setCopied] = useState(false);

  const copyInvite = async () => {
    const url = `${window.location.origin}${window.location.pathname}?join=${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copie ce lien pour inviter :', url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderPlayer = (p: DbGamePlayer) => (
    <div
      key={p.player_id}
      className="flex items-center justify-between rounded bg-surface px-3 py-1.5 text-text"
    >
      <span>{playerNames[p.player_id] ?? 'Joueur'}</span>
      <span className="text-xs text-text-dim">{SEAT_LABELS[p.seat] ?? p.seat}</span>
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <p className="text-text-dim text-sm">Code de la partie</p>
        <p className="font-mono text-5xl font-bold tracking-[0.3em] text-gold">{roomCode}</p>
        <p className="mt-2 text-text-dim text-sm">
          {full ? 'Tout le monde est la !' : `En attente de joueurs (${players.length}/4)`}
        </p>
        <button
          onClick={copyInvite}
          className="mt-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20"
        >
          {copied ? '✓ Lien copié !' : '🔗 Copier le lien d’invitation'}
        </button>
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-4">
        <div className="rounded-lg border-2 border-team1 bg-team1/10 p-4">
          <h3 className="mb-2 text-center font-semibold text-team1">Equipe 1</h3>
          <div className="space-y-2">
            {team1.map(renderPlayer)}
            {team1.length < 2 && (
              <div className="rounded border border-dashed border-border px-3 py-1.5 text-center text-text-dim">
                En attente...
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border-2 border-team2 bg-team2/10 p-4">
          <h3 className="mb-2 text-center font-semibold text-team2">Equipe 2</h3>
          <div className="space-y-2">
            {team2.map(renderPlayer)}
            {team2.length < 2 && (
              <div className="rounded border border-dashed border-border px-3 py-1.5 text-center text-text-dim">
                En attente...
              </div>
            )}
          </div>
        </div>
      </div>

      {isHost ? (
        <div className="flex w-full max-w-md gap-2">
          <Button variant="secondary" className="flex-1" onClick={onRandomize} disabled={busy || !full}>
            Tirer les rois
          </Button>
          <Button className="flex flex-1 items-center justify-center gap-2" onClick={onStart} disabled={busy || !full}>
            {busy ? <Spinner label="Lancement..." /> : 'Lancer la partie'}
          </Button>
        </div>
      ) : (
        <p className="text-text-dim text-sm">L&apos;hote lancera la partie.</p>
      )}

      <button onClick={onLeave} className="text-sm text-text-dim transition hover:text-text">
        Quitter
      </button>
    </main>
  );
}
