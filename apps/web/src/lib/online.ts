import { getSupabase } from './supabase/client';

export interface CreateJoinResult {
  gameId: string;
  roomCode: string;
}

/** Create a new online game and return its id + room code. */
export async function createOnlineGame(targetScore = 2000): Promise<CreateJoinResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('create-game', {
    body: { targetScore },
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as CreateJoinResult;
}

/** Join an existing online game by room code. */
export async function joinOnlineGame(roomCode: string): Promise<CreateJoinResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('join-game', {
    body: { roomCode: roomCode.toUpperCase() },
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as CreateJoinResult;
}
