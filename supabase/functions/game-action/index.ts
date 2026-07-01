import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient, getUserId } from '../_shared/supabase.ts';
import {
  isEngineInitialized,
  buildLobbyState,
  stateFromDb,
  toDbWrites,
  applyAction,
  type GameRow,
  type GamePlayerRow,
  type HandRow,
} from '../_shared/engine-db.ts';

const SEATS = ['north', 'east', 'south', 'west'] as const;

/**
 * Generic game action handler — the authoritative server for the online game.
 *
 * 1. Authenticates the player.
 * 2. Reads the full game state from the DB (games.round_state + hands).
 * 3. Reconstructs the GameState and applies the action via the engine reducer.
 * 4. Writes the new public state to `games` and the private hands to `hands`.
 * 5. Supabase Realtime pushes the changes to every connected client.
 */
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const userId = await getUserId(authHeader);
    if (!userId) return json({ error: 'Invalid user' }, 401);

    const { gameId, action } = await req.json();
    if (!gameId || !action || !action.type) {
      return json({ error: 'gameId and action required' }, 400);
    }

    const supabase = createServiceClient();

    // Verify the caller is a participant.
    const { data: membership } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_id', userId)
      .single();
    if (!membership) return json({ error: 'Not a participant' }, 403);

    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    if (!game) return json({ error: 'Game not found' }, 404);

    const { data: gamePlayers } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId);

    // Never trust a client-supplied playerId for player-attributed actions.
    const secureAction = { ...action, playerId: userId };

    // Pre-game: team selection and configuration operate on the lobby rows.
    if (!isEngineInitialized(game as GameRow)) {
      return await handleLobbyAction(supabase, game as GameRow, gamePlayers ?? [], action, userId);
    }

    // In-game: run the action through the engine reducer.
    const { data: handRows } = await supabase
      .from('hands')
      .select('*')
      .eq('game_id', gameId);

    const state = stateFromDb(game as GameRow, (handRows ?? []) as HandRow[]);
    const result = applyAction(state, secureAction);
    if (result.error) return json({ error: result.error }, 200);

    await persistState(supabase, gameId, result.state);
    return json({ ok: true });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function persistState(supabase: any, gameId: string, state: any): Promise<void> {
  const { gameUpdate, hands } = toDbWrites(state);
  await supabase.from('games').update(gameUpdate).eq('id', gameId);
  if (hands.length > 0) {
    await supabase
      .from('hands')
      .upsert(hands.map((h) => ({ game_id: gameId, ...h })), { onConflict: 'game_id,player_id' });
  }
}

async function handleLobbyAction(
  supabase: any,
  game: GameRow,
  gamePlayers: GamePlayerRow[],
  action: any,
  userId: string,
): Promise<Response> {
  switch (action.type) {
    case 'SET_TARGET_SCORE': {
      const score = Number(action.score);
      if (!(score >= 500 && score <= 5000)) return json({ error: 'Invalid target score' }, 200);
      await supabase.from('games').update({ target_score: score }).eq('id', game.id);
      return json({ ok: true });
    }

    case 'SET_TEAMS': {
      // assignments: { [playerId]: { seat, team } }
      const assignments = action.assignments ?? {};
      for (const [playerId, a] of Object.entries<any>(assignments)) {
        await supabase
          .from('game_players')
          .update({ seat: a.seat, team: a.team })
          .eq('game_id', game.id)
          .eq('player_id', playerId);
      }
      return json({ ok: true });
    }

    case 'RANDOMIZE_TEAMS': {
      const ids = gamePlayers.map((p) => p.player_id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      for (let i = 0; i < ids.length; i++) {
        const seat = SEATS[i];
        const team = seat === 'north' || seat === 'south' ? 'team1' : 'team2';
        await supabase
          .from('game_players')
          .update({ seat, team })
          .eq('game_id', game.id)
          .eq('player_id', ids[i]);
      }
      return json({ ok: true });
    }

    case 'START_GAME': {
      if (gamePlayers.length !== 4) return json({ error: 'Il faut 4 joueurs' }, 200);

      // Resolve display names for the engine state.
      const { data: playerRows } = await supabase
        .from('players')
        .select('id, name')
        .in('id', gamePlayers.map((p) => p.player_id));
      const nameById: Record<string, string> = {};
      for (const p of playerRows ?? []) nameById[p.id] = p.name;

      const lobbyState = buildLobbyState(game, gamePlayers, nameById);
      const result = applyAction(lobbyState, { type: 'START_GAME' });
      if (result.error) return json({ error: result.error }, 200);

      await persistState(supabase, game.id, result.state);
      return json({ ok: true });
    }

    default:
      return json({ error: 'La partie n\'a pas encore commence' }, 200);
  }
}
