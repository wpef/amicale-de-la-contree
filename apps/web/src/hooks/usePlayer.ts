'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';

interface PlayerState {
  userId: string | null;
  playerName: string | null;
  isLoading: boolean;
  signIn: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function usePlayer(): PlayerState {
  const [userId, setUserId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then((result) => {
      const user = result.data.session?.user ?? null;
      setUserId(user?.id ?? null);
      if (user) {
        setPlayerName(localStorage.getItem('playerName'));
      }
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (name: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user) throw new Error('Failed to sign in');

    await supabase.from('players').upsert({ id: data.user.id, name });

    localStorage.setItem('playerName', name);
    setUserId(data.user.id);
    setPlayerName(name);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    localStorage.removeItem('playerName');
    setUserId(null);
    setPlayerName(null);
  }, []);

  return { userId, playerName, isLoading, signIn, signOut };
}
