'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LobbyPage() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();

  useEffect(() => {
    const name = localStorage.getItem('playerName');
    if (!name) {
      router.push('/');
      return;
    }
    setPlayerName(name);
  }, [router]);

  const handleCreateGame = () => {
    // TODO: Call Supabase Edge Function to create game
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    router.push(`/game/${code}`);
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim().length !== 4) return;
    router.push(`/game/${roomCode.toUpperCase()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-gold">Salon</h1>
          <p className="mt-1 text-text-dim">
            Salut <span className="text-text font-medium">{playerName}</span> !
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCreateGame}
            className="w-full rounded-lg bg-gold px-6 py-4 text-lg font-semibold text-bg transition hover:bg-gold-dim"
          >
            Creer une partie
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
              disabled={roomCode.trim().length !== 4}
              className="rounded-lg bg-surface-raised px-6 py-3 font-semibold text-text transition hover:bg-border disabled:cursor-not-allowed disabled:opacity-40"
            >
              Rejoindre
            </button>
          </form>
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
