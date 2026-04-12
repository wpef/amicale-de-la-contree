'use client';

import { useParams } from 'next/navigation';

export default function GamePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="game-table flex h-[80vh] w-full max-w-4xl flex-col items-center justify-center rounded-2xl">
        <h2 className="font-display text-2xl font-bold text-gold">Partie {id}</h2>
        <p className="mt-2 text-text-dim">En attente des joueurs...</p>
        {/* TODO: Game components will go here */}
      </div>
    </main>
  );
}
