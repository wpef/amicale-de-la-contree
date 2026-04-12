import type { GameState, GamePhase } from './game-state.js';
import type { Card, CardId, Suit } from '../domain/card.js';
import { cardId } from '../domain/card.js';
import type { Player } from '../domain/player.js';
import type { BidAction, Bid } from '../domain/bid.js';
import type { Contract } from '../domain/contract.js';
import type { TrickCard, Trick } from '../domain/trick.js';
import type { RoundScore } from '../domain/round.js';
import type { TeamId, Team } from '../domain/team.js';
import type { Seat } from '../utils/seat.js';
import { getPlayableCards } from '../rules/play-validation.js';

/**
 * Projected game state visible to a specific player.
 * Hides other players' hands but shows card counts.
 */
export interface ProjectedGameState {
  readonly id: string;
  readonly roomCode: string;
  readonly phase: GamePhase;

  // Players (public info)
  readonly players: ProjectedPlayer[];
  readonly mySeat: Seat;

  // Teams
  readonly teams: { team1: ProjectedTeam; team2: ProjectedTeam } | null;
  readonly targetScore: number;

  // My hand
  readonly myHand: Card[];
  readonly playableCards: CardId[];

  // Round info
  readonly roundNumber: number;
  readonly dealer: Seat | null;

  // Bidding
  readonly bids: BidAction[];
  readonly highestBid: Bid | null;
  readonly currentBidder: Seat | null;
  readonly contract: Contract | null;

  // Playing
  readonly currentTrick: ProjectedTrick | null;
  readonly lastTrick: ProjectedTrick | null;
  readonly currentPlayer: Seat | null;
  readonly tricksWon: { team1: number; team2: number };

  // Scoring
  readonly beloteDeclared: boolean;
  readonly roundScore: RoundScore | null;
  readonly roundHistory: RoundScore[];

  // Game result
  readonly winner: TeamId | null;
}

export interface ProjectedPlayer {
  readonly id: string;
  readonly name: string;
  readonly seat: Seat;
  readonly cardCount: number;
  readonly isConnected: boolean;
}

export interface ProjectedTeam {
  readonly id: TeamId;
  readonly playerIds: [string, string];
  readonly score: number;
}

export interface ProjectedTrick {
  readonly number: number;
  readonly cards: TrickCard[];
  readonly leader: Seat;
  readonly winner: Seat | null;
}

/**
 * Project the full game state for a specific player.
 * Only reveals the player's own hand; other hands are hidden.
 */
export function projectState(state: GameState, playerId: string): ProjectedGameState {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(`Player ${playerId} not found in game`);
  }

  const mySeat = player.seat;
  const myHand = state.hands[mySeat] ?? [];

  // Calculate playable cards
  let playableCards: CardId[] = [];
  if (
    state.phase === 'playing' &&
    state.currentPlayer === mySeat &&
    state.currentTrick &&
    state.contract
  ) {
    const playable = getPlayableCards(
      myHand,
      state.currentTrick,
      state.contract.bid.suit,
      mySeat,
    );
    playableCards = playable.map(cardId);
  }

  // Project players (hide hands, show card counts)
  const players: ProjectedPlayer[] = Object.values(state.players).map((p) => ({
    id: p.id,
    name: p.name,
    seat: p.seat,
    cardCount: state.hands[p.seat]?.length ?? 0,
    isConnected: true, // TODO: track connection state
  }));

  // Project teams
  const teams = state.teams
    ? {
        team1: { id: state.teams.team1.id, playerIds: state.teams.team1.playerIds, score: state.teams.team1.score },
        team2: { id: state.teams.team2.id, playerIds: state.teams.team2.playerIds, score: state.teams.team2.score },
      }
    : null;

  // Project tricks
  const currentTrick = state.currentTrick
    ? {
        number: state.currentTrick.number,
        cards: [...state.currentTrick.cards],
        leader: state.currentTrick.leader,
        winner: state.currentTrick.winner ?? null,
      }
    : null;

  const lastTrick =
    state.tricks.length > 0
      ? {
          number: state.tricks[state.tricks.length - 1].number,
          cards: [...state.tricks[state.tricks.length - 1].cards],
          leader: state.tricks[state.tricks.length - 1].leader,
          winner: state.tricks[state.tricks.length - 1].winner ?? null,
        }
      : null;

  // Count tricks won per team
  const tricksWon = { team1: 0, team2: 0 };
  for (const trick of state.tricks) {
    if (trick.winner) {
      const team =
        trick.winner === 'north' || trick.winner === 'south' ? 'team1' : 'team2';
      tricksWon[team]++;
    }
  }

  return {
    id: state.id,
    roomCode: state.roomCode,
    phase: state.phase,
    players,
    mySeat,
    teams,
    targetScore: state.targetScore,
    myHand,
    playableCards,
    roundNumber: state.roundNumber,
    dealer: state.dealer,
    bids: state.bids,
    highestBid: state.highestBid,
    currentBidder: state.currentBidder,
    contract: state.contract,
    currentTrick,
    lastTrick,
    currentPlayer: state.currentPlayer,
    tricksWon,
    beloteDeclared: state.beloteDeclared,
    roundScore: state.roundScore,
    roundHistory: state.roundHistory,
    winner: state.winner,
  };
}
