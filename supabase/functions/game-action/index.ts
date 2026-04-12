import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient, getUserId } from '../_shared/supabase.ts';

/**
 * Generic game action handler.
 *
 * Receives actions like: bid, pass, contrer, surcontrer, play-card, deal,
 * set-teams, set-target-score, start-game, next-round, rematch.
 *
 * The Edge Function:
 * 1. Authenticates the player
 * 2. Reads the current game state from DB
 * 3. Validates the action using the game engine
 * 4. Updates the game state in DB
 * 5. Supabase Realtime automatically pushes changes to clients
 *
 * NOTE: In production, the game engine (packages/engine) should be imported
 * here for server-side validation. For now, we do basic validation and
 * trust the client for game logic. The full engine integration will be
 * added when we set up the build pipeline.
 */
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { gameId, action } = await req.json();

    if (!gameId || !action || !action.type) {
      return new Response(JSON.stringify({ error: 'gameId and action required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createServiceClient();

    // Verify player is in the game
    const { data: membership } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_id', userId)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Not a participant' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current game state
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (!game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process action based on type
    // NOTE: Full engine validation will be integrated later.
    // For now, basic state transitions are handled here.
    const result = await processAction(supabase, game, membership, action, userId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processAction(
  supabase: any,
  game: any,
  membership: any,
  action: any,
  userId: string,
) {
  switch (action.type) {
    case 'SET_TARGET_SCORE': {
      if (game.status !== 'config' && game.status !== 'team_selection') {
        throw new Error('Cannot change score in current phase');
      }
      await supabase
        .from('games')
        .update({ target_score: action.score })
        .eq('id', game.id);
      return { success: true };
    }

    case 'START_GAME': {
      if (game.status !== 'config' && game.status !== 'team_selection') {
        throw new Error('Cannot start game in current phase');
      }
      await supabase
        .from('games')
        .update({
          status: 'playing',
          round_number: 1,
          round_state: { phase: 'dealing', dealer: 'north' },
        })
        .eq('id', game.id);
      return { success: true };
    }

    case 'DEAL': {
      // Generate shuffled deck and deal cards
      // This is where the engine would be used for proper dealing
      const roundState = game.round_state || {};
      if (roundState.phase !== 'dealing') {
        throw new Error('Not in dealing phase');
      }

      // TODO: Import and use engine for dealing
      // For now, store a placeholder that signals dealing happened
      await supabase
        .from('games')
        .update({
          round_state: {
            ...roundState,
            phase: 'bidding',
            currentBidder: 'east', // Next from dealer (north)
            bids: [],
            highestBid: null,
            consecutivePasses: 0,
          },
        })
        .eq('id', game.id);

      return { success: true };
    }

    case 'UPDATE_ROUND_STATE': {
      // Generic state update from client (with engine validation on client side)
      // In production, this should validate server-side
      await supabase
        .from('games')
        .update({
          round_state: action.roundState,
          ...(action.status ? { status: action.status } : {}),
          ...(action.team1Score !== undefined ? { team1_score: action.team1Score } : {}),
          ...(action.team2Score !== undefined ? { team2_score: action.team2Score } : {}),
          ...(action.winnerTeam !== undefined ? { winner_team: action.winnerTeam } : {}),
          ...(action.roundNumber !== undefined ? { round_number: action.roundNumber } : {}),
          ...(action.roundHistory !== undefined ? { round_history: action.roundHistory } : {}),
        })
        .eq('id', game.id);

      // Update hands if provided
      if (action.hands) {
        for (const [playerId, cards] of Object.entries(action.hands)) {
          await supabase
            .from('hands')
            .upsert({
              game_id: game.id,
              player_id: playerId,
              cards,
            });
        }
      }

      return { success: true };
    }

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}
