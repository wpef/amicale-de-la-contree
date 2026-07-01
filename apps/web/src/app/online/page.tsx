'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlayer } from '@/hooks/usePlayer';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { WaitingRoom } from '@/components/lobby/WaitingRoom';
import { OnlineGameView } from '@/components/game/OnlineGameView';
import { getSupabase } from '@/lib/supabase/client';

function OnlineGame() {
  const router = useRouter();
  const params = useSearchParams();
  const gameId = params.get('g');
  const { userId, isLoading: authLoading, signIn } = usePlayer();
  const [busy, setBusy] = useState(false);

  // Restore the anonymous session on reconnection (e.g. page refresh).
  useEffect(() => {
    if (authLoading || userId) return;
    const name = localStorage.getItem('playerName');
    if (name) signIn(name).catch(() => router.push('/'));
    else router.push('/');
  }, [authLoading, userId, signIn, router]);

  const hook = useOnlineGame(gameId);
  const { game, gamePlayers, playerNames, isLoading, sendAction } = hook;

  if (!gameId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-text-dim">Partie introuvable.</p>
      </main>
    );
  }

  if (isLoading || !game) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-text-dim">Chargement...</p>
      </main>
    );
  }

  const inLobby =
    game.status === 'lobby' || game.status === 'team_selection' || game.status === 'config';

  if (inLobby) {
    const isHost = game.created_by === userId;
    const handleLeave = async () => {
      if (userId) {
        await getSupabase()
          .from('game_players')
          .delete()
          .eq('game_id', gameId)
          .eq('player_id', userId);
      }
      router.push('/lobby');
    };
    return (
      <WaitingRoom
        roomCode={game.room_code}
        players={gamePlayers}
        playerNames={playerNames}
        isHost={isHost}
        busy={busy}
        onRandomize={async () => {
          setBusy(true);
          await sendAction({ type: 'RANDOMIZE_TEAMS' });
          setBusy(false);
        }}
        onStart={async () => {
          setBusy(true);
          const err = await sendAction({ type: 'START_GAME' });
          if (err) setBusy(false);
        }}
        onLeave={handleLeave}
      />
    );
  }

  return <OnlineGameView hook={hook} />;
}

export default function OnlinePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-text-dim">Chargement...</p>
        </main>
      }
    >
      <OnlineGame />
    </Suspense>
  );
}
