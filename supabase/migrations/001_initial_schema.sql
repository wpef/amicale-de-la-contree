-- Amicale de la Contree - Initial Schema
-- Players, Games, Game Players, Hands
--
-- Tables are created first, then policies: several RLS policies reference
-- other tables (e.g. the games policy references game_players), so every
-- table must exist before any cross-referencing policy is declared.

-- ============================================
-- TABLES
-- ============================================
CREATE TABLE players (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL CHECK (char_length(room_code) = 4),
  status TEXT NOT NULL DEFAULT 'lobby'
    CHECK (status IN ('lobby', 'team_selection', 'config', 'playing', 'scoring', 'finished')),
  target_score INT NOT NULL DEFAULT 2000 CHECK (target_score >= 500 AND target_score <= 5000),
  created_by UUID REFERENCES players(id),

  -- Public game state (visible to all players)
  -- Contains: bids, tricks played, contract, current phase details
  round_state JSONB DEFAULT '{}'::jsonb,

  -- Cumulative scores
  team1_score INT NOT NULL DEFAULT 0,
  team2_score INT NOT NULL DEFAULT 0,
  winner_team TEXT CHECK (winner_team IN ('team1', 'team2', NULL)),

  -- Round tracking
  round_number INT NOT NULL DEFAULT 0,
  round_history JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE game_players (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  seat TEXT NOT NULL CHECK (seat IN ('north', 'east', 'south', 'west')),
  team TEXT NOT NULL CHECK (team IN ('team1', 'team2')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, player_id)
);

CREATE TABLE hands (
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, player_id)
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE hands ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: PLAYERS
-- ============================================
-- Anyone can read players (needed for lobby display)
CREATE POLICY "Players are publicly readable"
  ON players FOR SELECT
  USING (true);

-- Players can insert their own row
CREATE POLICY "Players can insert own profile"
  ON players FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Players can update their own name
CREATE POLICY "Players can update own profile"
  ON players FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- POLICIES: GAMES
-- ============================================
-- Lobby games are visible to everyone (for joining); active games only to participants
CREATE POLICY "Lobby games are publicly readable"
  ON games FOR SELECT
  USING (
    status = 'lobby'
    OR id IN (SELECT game_id FROM game_players WHERE player_id = auth.uid())
  );

-- Any authenticated user can create a game
CREATE POLICY "Authenticated users can create games"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only participants can update game state
CREATE POLICY "Participants can update games"
  ON games FOR UPDATE
  USING (id IN (SELECT game_id FROM game_players WHERE player_id = auth.uid()));

-- ============================================
-- POLICIES: GAME PLAYERS
-- ============================================
-- Game players are readable by all participants of the game (and in lobby)
CREATE POLICY "Game players are readable by participants"
  ON game_players FOR SELECT
  USING (
    game_id IN (SELECT id FROM games WHERE status = 'lobby')
    OR game_id IN (SELECT game_id FROM game_players gp WHERE gp.player_id = auth.uid())
  );

-- Players can join games
CREATE POLICY "Players can join games"
  ON game_players FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Players can update their own seat/team
CREATE POLICY "Players can update own assignment"
  ON game_players FOR UPDATE
  USING (auth.uid() = player_id);

-- Players can leave games
CREATE POLICY "Players can leave games"
  ON game_players FOR DELETE
  USING (auth.uid() = player_id);

-- ============================================
-- POLICIES: HANDS (private - RLS enforced)
-- ============================================
-- CRITICAL: Each player can ONLY see their own hand.
-- Only the system (service role) inserts/updates hands via Edge Functions.
CREATE POLICY "Players see only own hand"
  ON hands FOR SELECT
  USING (auth.uid() = player_id);

-- ============================================
-- FUNCTIONS
-- ============================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER hands_updated_at
  BEFORE UPDATE ON hands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Generate a random 4-letter room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_game_players_player ON game_players(player_id);
CREATE INDEX idx_game_players_game ON game_players(game_id);

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE hands;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
