'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { DbGame, DbGamePlayer } from '@/lib/supabase/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface GameStateHook {
  game: DbGame | null;
  players: DbGamePlayer[];
  isLoading: boolean;
  error: string | null;
  sendAction: (action: Record<string, unknown>) => Promise<void>;
}

export function useGameState(gameId: string | null): GameStateHook {
  const [game, setGame] = useState<DbGame | null>(null);
  const [players, setPlayers] = useState<DbGamePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const supabase = getSupabase();

    const loadGame = async () => {
      const { data, error: err } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (err) setError(err.message);
      else setGame(data as unknown as DbGame);
    };

    const loadPlayers = async () => {
      const { data } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId);

      if (data) setPlayers(data as unknown as DbGamePlayer[]);
      setIsLoading(false);
    };

    loadGame();
    loadPlayers();

    const gameChannel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            setGame(payload.new as unknown as DbGame);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${gameId}`,
        },
        async () => {
          const { data } = await supabase
            .from('game_players')
            .select('*')
            .eq('game_id', gameId);
          if (data) setPlayers(data as unknown as DbGamePlayer[]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [gameId]);

  const sendAction = useCallback(
    async (action: Record<string, unknown>) => {
      if (!gameId) return;

      const supabase = getSupabase();
      const response = await supabase.functions.invoke('game-action', {
        body: { gameId, action },
      });

      if (response.error) {
        setError(response.error.message);
      }
    },
    [gameId],
  );

  return { game, players, isLoading, error, sendAction };
}
