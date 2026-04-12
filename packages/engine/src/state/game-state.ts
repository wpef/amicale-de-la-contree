import type { Card } from '../domain/card.js';
import type { Player } from '../domain/player.js';
import type { Team, TeamId } from '../domain/team.js';
import type { BidAction, Bid } from '../domain/bid.js';
import type { Contract } from '../domain/contract.js';
import type { Trick, TrickCard } from '../domain/trick.js';
import type { RoundScore } from '../domain/round.js';
import type { Seat } from '../utils/seat.js';

export type GamePhase =
  | 'lobby'
  | 'team_selection'
  | 'config'
  | 'dealing'
  | 'bidding'
  | 'playing'
  | 'scoring'
  | 'game_over';

export interface GameState {
  readonly id: string;
  readonly roomCode: string;
  readonly phase: GamePhase;

  // Players
  readonly players: Record<string, Player>;
  readonly playerOrder: string[]; // Player IDs in seat order (N, E, S, W)

  // Teams
  readonly teams: { team1: Team; team2: Team } | null;
  readonly targetScore: number;

  // Current round
  readonly roundNumber: number;
  readonly dealer: Seat | null;
  readonly hands: Record<Seat, Card[]>;

  // Bidding
  readonly bids: BidAction[];
  readonly highestBid: Bid | null;
  readonly currentBidder: Seat | null;
  readonly consecutivePasses: number;
  readonly contract: Contract | null;

  // Playing
  readonly tricks: Trick[];
  readonly currentTrick: Trick | null;
  readonly currentPlayer: Seat | null;

  // Scoring
  readonly beloteHolder: Seat | null;
  readonly beloteDeclared: boolean;
  readonly roundScore: RoundScore | null;
  readonly roundHistory: RoundScore[];

  // Game result
  readonly winner: TeamId | null;
}

export function createInitialState(id: string, roomCode: string): GameState {
  return {
    id,
    roomCode,
    phase: 'lobby',
    players: {},
    playerOrder: [],
    teams: null,
    targetScore: 2000,
    roundNumber: 0,
    dealer: null,
    hands: {} as Record<Seat, Card[]>,
    bids: [],
    highestBid: null,
    currentBidder: null,
    consecutivePasses: 0,
    contract: null,
    tricks: [],
    currentTrick: null,
    currentPlayer: null,
    beloteHolder: null,
    beloteDeclared: false,
    roundScore: null,
    roundHistory: [],
    winner: null,
  };
}
