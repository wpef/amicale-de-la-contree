import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient, getUserId } from '../_shared/supabase.ts';

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

    const { targetScore = 2000 } = await req.json().catch(() => ({}));

    const supabase = createServiceClient();

    // Generate unique room code
    let roomCode: string;
    let attempts = 0;
    do {
      const { data } = await supabase.rpc('generate_room_code');
      roomCode = data;
      attempts++;
    } while (attempts < 10);

    // Create the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        room_code: roomCode,
        status: 'lobby',
        target_score: targetScore,
        created_by: userId,
      })
      .select()
      .single();

    if (gameError) throw gameError;

    // Add creator as first player (North seat, Team 1)
    const { error: playerError } = await supabase.from('game_players').insert({
      game_id: game.id,
      player_id: userId,
      seat: 'north',
      team: 'team1',
    });

    if (playerError) throw playerError;

    return new Response(
      JSON.stringify({ gameId: game.id, roomCode: game.room_code }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
