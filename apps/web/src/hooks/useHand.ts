'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { CardId } from '@contree/engine';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface HandHook {
  cards: CardId[];
  isLoading: boolean;
}

export function useHand(gameId: string | null): HandHook {
  const [cards, setCards] = useState<CardId[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    const supabase = getSupabase();

    const loadHand = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from('hands')
        .select('cards')
        .eq('game_id', gameId)
        .eq('player_id', userData.user.id)
        .single();

      if (data) setCards(data.cards as CardId[]);
      setIsLoading(false);
    };

    loadHand();

    const handChannel = supabase
      .channel(`hand:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hands',
          filter: `game_id=eq.${gameId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new;
          if (row && typeof row === 'object' && 'cards' in row) {
            setCards((row as { cards: CardId[] }).cards);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(handChannel);
    };
  }, [gameId]);

  return { cards, isLoading };
}
