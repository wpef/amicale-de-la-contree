'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    localStorage.setItem('playerName', name.trim());
    router.push('/lobby');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="font-display text-5xl font-bold text-gold">Contree</h1>
          <p className="mt-2 text-text-dim">Jouez a la Contree en ligne avec vos copains</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ton prenom..."
              maxLength={20}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-center text-lg text-text placeholder-text-dim outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="w-full rounded-lg bg-gold px-6 py-3 text-lg font-semibold text-bg transition hover:bg-gold-dim disabled:cursor-not-allowed disabled:opacity-40"
          >
            Jouer
          </button>
        </form>
      </div>
    </main>
  );
}
