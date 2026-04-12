/** Database types matching the Supabase schema */

export interface DbPlayer {
  id: string;
  name: string;
  created_at: string;
}

export interface DbGame {
  id: string;
  room_code: string;
  status: 'lobby' | 'team_selection' | 'config' | 'playing' | 'scoring' | 'finished';
  target_score: number;
  created_by: string;
  round_state: Record<string, unknown>;
  team1_score: number;
  team2_score: number;
  winner_team: 'team1' | 'team2' | null;
  round_number: number;
  round_history: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface DbGamePlayer {
  game_id: string;
  player_id: string;
  seat: 'north' | 'east' | 'south' | 'west';
  team: 'team1' | 'team2';
  joined_at: string;
}

export interface DbHand {
  game_id: string;
  player_id: string;
  cards: string[];
  updated_at: string;
}
