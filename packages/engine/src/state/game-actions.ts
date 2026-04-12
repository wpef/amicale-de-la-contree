import type { Suit } from '../domain/card.js';
import type { CardId } from '../domain/card.js';
import type { BidPoints } from '../domain/bid.js';
import type { TeamId } from '../domain/team.js';
import type { Seat } from '../utils/seat.js';

export type GameAction =
  | { type: 'JOIN'; playerId: string; playerName: string }
  | { type: 'LEAVE'; playerId: string }
  | { type: 'SET_TEAMS'; assignments: Record<string, { seat: Seat; team: TeamId }> }
  | { type: 'RANDOMIZE_TEAMS' }
  | { type: 'SET_TARGET_SCORE'; score: number }
  | { type: 'START_GAME' }
  | { type: 'DEAL' }
  | { type: 'BID'; playerId: string; points: BidPoints; suit: Suit }
  | { type: 'PASS'; playerId: string }
  | { type: 'CONTRER'; playerId: string }
  | { type: 'SURCONTRER'; playerId: string }
  | { type: 'PLAY_CARD'; playerId: string; cardId: CardId }
  | { type: 'DECLARE_BELOTE'; playerId: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'REMATCH'; sameTeams: boolean };
