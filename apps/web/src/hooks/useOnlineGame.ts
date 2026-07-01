'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { DbGame, DbGamePlayer } from '@/lib/supabase/types';
import {
  projectPublicState,
  parseCardId,
  type ProjectedGameState,
  type PublicGameState,
  type CardId,
  type GameAction,
} from '@contree/engine';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface OnlineGameHook {
  /** Raw game row (public state lives in `round_state`). */
  game: DbGame | null;
  /** Lobby membership rows (used before the engine state exists). */
  gamePlayers: DbGamePlayer[];
  /** Display names keyed by player id (for the waiting room). */
  playerNames: Record<string, string>;
  /** This player's private hand (CardId strings). */
  myHand: CardId[];
  /** The authenticated player id. */
  userId: string | null;
  /** Projected view for this player once the game has started. */
  projected: ProjectedGameState | null;
  isLoading: boolean;
  error: string | null;
  /** Send a game action to the server (Edge Function). */
  sendAction: (action: Partial<GameAction> & { type: string }) => Promise<string | undefined>;
}

function isEngineState(rs: unknown): rs is PublicGameState {
  return !!rs && typeof rs === 'object' && 'phase' in (rs as Record<string, unknown>);
}

export function useOnlineGame(gameId: string | null): OnlineGameHook {
  const [game, setGame] = useState<DbGame | null>(null);
  const [gamePlayers, setGamePlayers] = useState<DbGamePlayer[]>([]);
  const [myHand, setMyHand] = useState<CardId[]>([]);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    const supabase = getSupabase();
    let cancelled = false;

    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);

      const [{ data: gameData }, { data: playerData }] = await Promise.all([
        supabase.from('games').select('*').eq('id', gameId).single(),
        supabase.from('game_players').select('*').eq('game_id', gameId),
      ]);
      if (cancelled) return;
      if (gameData) setGame(gameData as unknown as DbGame);
      if (playerData) setGamePlayers(playerData as unknown as DbGamePlayer[]);

      if (uid) {
        const { data: handData } = await supabase
          .from('hands')
          .select('cards')
          .eq('game_id', gameId)
          .eq('player_id', uid)
          .maybeSingle();
        if (!cancelled && handData) setMyHand(handData.cards as CardId[]);
      }
      if (!cancelled) setIsLoading(false);
    };

    load();

    const channel = supabase
      .channel(`online:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.new && 'id' in payload.new) setGame(payload.new as unknown as DbGame);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq.${gameId}` },
        async () => {
          const { data } = await supabase
            .from('game_players')
            .select('*')
            .eq('game_id', gameId);
          if (data) setGamePlayers(data as unknown as DbGamePlayer[]);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hands', filter: `game_id=eq.${gameId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new;
          if (row && 'cards' in row) setMyHand((row as { cards: CardId[] }).cards);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  // Resolve display names for everyone currently in the lobby.
  const playerIdsKey = gamePlayers.map((p) => p.player_id).sort().join(',');
  useEffect(() => {
    if (!playerIdsKey) return;
    const ids = playerIdsKey.split(',');
    const supabase = getSupabase();
    let cancelled = false;
    supabase
      .from('players')
      .select('id, name')
      .in('id', ids)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const map: Record<string, string> = {};
        for (const p of data as { id: string; name: string }[]) map[p.id] = p.name;
        setPlayerNames(map);
      });
    return () => {
      cancelled = true;
    };
  }, [playerIdsKey]);

  const projected = useMemo((): ProjectedGameState | null => {
    if (!game || !userId) return null;
    const rs = game.round_state;
    if (!isEngineState(rs)) return null;
    if (!rs.players[userId]) return null;
    try {
      return projectPublicState(rs, userId, myHand.map(parseCardId));
    } catch {
      return null;
    }
  }, [game, userId, myHand]);

  const sendAction = useCallback(
    async (action: Partial<GameAction> & { type: string }): Promise<string | undefined> => {
      if (!gameId) return 'No game';
      const supabase = getSupabase();
      const { data, error: fnError } = await supabase.functions.invoke('game-action', {
        body: { gameId, action },
      });
      const msg = fnError?.message ?? (data as { error?: string } | null)?.error;
      if (msg) {
        setError(msg);
        return msg;
      }
      setError(null);
      return undefined;
    },
    [gameId],
  );

  return { game, gamePlayers, playerNames, myHand, userId, projected, isLoading, error, sendAction };
}
