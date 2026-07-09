'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlayer } from '@/hooks/usePlayer';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { WaitingRoom } from '@/components/lobby/WaitingRoom';
import { OnlineGameView } from '@/components/game/OnlineGameView';
import { PageLoader } from '@/components/ui/Spinner';
import { joinOnlineGame } from '@/lib/online';
import { getSupabase } from '@/lib/supabase/client';

function OnlineGame() {
  const router = useRouter();
  const params = useSearchParams();
  const gameId = params.get('g');
  const joinCode = params.get('join');
  const { userId, isLoading: authLoading, signIn } = usePlayer();
  const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Restore the anonymous session on reconnection (or for an invited guest).
  useEffect(() => {
    if (authLoading || userId) return;
    const name = localStorage.getItem('playerName');
    // Carry the invite code through the name-entry screen if there's no session.
    const target = joinCode ? `/?join=${joinCode}` : '/';
    if (name) signIn(name).catch(() => router.push(target));
    else router.push(target);
  }, [authLoading, userId, signIn, router, joinCode]);

  // Invite link: resolve the room code to a game and join it, then swap the URL.
  useEffect(() => {
    if (gameId || !joinCode || !userId || joining) return;
    setJoining(true);
    joinOnlineGame(joinCode)
      .then(({ gameId: id }) => router.replace(`/online?g=${id}`))
      .catch((e) => setJoinError((e as Error).message));
  }, [gameId, joinCode, userId, joining, router]);

  const hook = useOnlineGame(gameId);
  const { game, gamePlayers, playerNames, isLoading, sendAction } = hook;

  if (!gameId && joinCode) {
    if (joinError) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <p className="text-accent-red">{joinError}</p>
          <button onClick={() => router.push('/lobby')} className="text-sm text-text-dim hover:text-text">
            Retour au salon
          </button>
        </main>
      );
    }
    return <PageLoader label="Connexion à la partie..." />;
  }

  if (!gameId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-text-dim">Partie introuvable.</p>
      </main>
    );
  }

  if (isLoading || !game) {
    return <PageLoader />;
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
    <Suspense fallback={<PageLoader />}>
      <OnlineGame />
    </Suspense>
  );
}
