'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/hooks/usePlayer';
import { createOnlineGame, joinOnlineGame } from '@/lib/online';
import { Spinner } from '@/components/ui/Spinner';

export default function LobbyPage() {
  const router = useRouter();
  const { userId, playerName, isLoading, signIn } = usePlayer();
  const [roomCode, setRoomCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [localName, setLocalName] = useState<string | null>(null);

  // Ensure the player has an anonymous session tied to their pseudo.
  useEffect(() => {
    if (isLoading) return;
    const stored = localStorage.getItem('playerName');
    if (!stored) {
      router.push('/');
      return;
    }
    setLocalName(stored);
    if (!userId) {
      signIn(stored).catch((e) => setError(e.message));
    }
  }, [isLoading, userId, signIn, router]);

  const ready = !!userId;
  const displayName = playerName ?? localName;

  const handleCreateGame = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError('');
    try {
      const { gameId } = await createOnlineGame();
      router.push(`/online?g=${gameId}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy || roomCode.trim().length !== 4) return;
    setBusy(true);
    setError('');
    try {
      const { gameId } = await joinOnlineGame(roomCode.trim());
      router.push(`/online?g=${gameId}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-gold">Salon</h1>
          <p className="mt-1 text-text-dim">
            Salut <span className="text-text font-medium">{displayName}</span> !
          </p>
          {!ready && (
            <p className="mt-1 text-xs text-text-dim">Connexion en cours...</p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCreateGame}
            disabled={!ready || busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-6 py-4 text-lg font-semibold text-bg transition hover:bg-gold-dim disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? <Spinner label="Création..." /> : 'Creer une partie'}
          </button>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-text-dim text-sm">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleJoinGame} className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              maxLength={4}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-center font-mono text-lg uppercase tracking-widest text-text placeholder-text-dim outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            />
            <button
              type="submit"
              disabled={!ready || busy || roomCode.trim().length !== 4}
              className="rounded-lg bg-surface-raised px-6 py-3 font-semibold text-text transition hover:bg-border disabled:cursor-not-allowed disabled:opacity-40"
            >
              Rejoindre
            </button>
          </form>

          {error && <p className="text-center text-sm text-accent-red">{error}</p>}
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-text-dim text-sm">mode local</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={() => router.push('/local')}
          className="w-full rounded-lg border border-border bg-surface px-6 py-4 text-lg font-semibold text-text transition hover:border-gold hover:bg-surface-raised"
        >
          Partie locale (sans connexion)
        </button>

        <button
          onClick={() => {
            localStorage.removeItem('playerName');
            router.push('/');
          }}
          className="w-full text-center text-sm text-text-dim transition hover:text-text"
        >
          Changer de pseudo
        </button>
      </div>
    </main>
  );
}
