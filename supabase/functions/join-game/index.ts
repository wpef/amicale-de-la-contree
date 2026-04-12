import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient, getUserId } from '../_shared/supabase.ts';

const SEATS = ['north', 'east', 'south', 'west'] as const;

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

    const { roomCode } = await req.json();
    if (!roomCode || typeof roomCode !== 'string') {
      return new Response(JSON.stringify({ error: 'Room code required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createServiceClient();

    // Find the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .single();

    if (gameError || !game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (game.status !== 'lobby') {
      return new Response(JSON.stringify({ error: 'Game already started' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check current players
    const { data: currentPlayers } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', game.id);

    if (!currentPlayers) {
      return new Response(JSON.stringify({ error: 'Failed to fetch players' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already joined
    if (currentPlayers.some((p) => p.player_id === userId)) {
      return new Response(
        JSON.stringify({ gameId: game.id, roomCode: game.room_code }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (currentPlayers.length >= 4) {
      return new Response(JSON.stringify({ error: 'Game is full' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find first available seat
    const takenSeats = new Set(currentPlayers.map((p) => p.seat));
    const freeSeat = SEATS.find((s) => !takenSeats.has(s));
    if (!freeSeat) {
      return new Response(JSON.stringify({ error: 'No seats available' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Assign team based on seat (N/S = team1, E/W = team2)
    const team = freeSeat === 'north' || freeSeat === 'south' ? 'team1' : 'team2';

    // Join the game
    const { error: joinError } = await supabase.from('game_players').insert({
      game_id: game.id,
      player_id: userId,
      seat: freeSeat,
      team,
    });

    if (joinError) throw joinError;

    // If 4 players, update game status
    if (currentPlayers.length + 1 === 4) {
      await supabase
        .from('games')
        .update({ status: 'team_selection' })
        .eq('id', game.id);
    }

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
