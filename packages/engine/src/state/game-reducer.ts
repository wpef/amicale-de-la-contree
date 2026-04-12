import type { GameState } from './game-state.js';
import { createInitialState } from './game-state.js';
import type { GameAction } from './game-actions.js';
import type { Player } from '../domain/player.js';
import type { Card } from '../domain/card.js';
import { parseCardId, cardEquals, Rank } from '../domain/card.js';
import { TeamId, teamForSeat, oppositeTeam } from '../domain/team.js';
import type { Team } from '../domain/team.js';
import { Seat, nextSeat, seatsFrom, SEAT_ORDER } from '../utils/seat.js';
import { createShuffledDeck } from '../domain/deck.js';
import { deal } from '../domain/deck.js';
import { createTrick, isTrickComplete } from '../domain/trick.js';
import type { TrickCard, Trick } from '../domain/trick.js';
import { isCardPlayable, getPlayableCards } from '../rules/play-validation.js';
import { determineTrickWinner } from '../rules/trick-winner.js';
import { calculateRoundScore, hasBelote } from '../rules/scoring.js';
import { isBidHigher } from '../domain/bid.js';

export interface ReducerResult {
  state: GameState;
  error?: string;
}

function ok(state: GameState): ReducerResult {
  return { state };
}

function err(state: GameState, error: string): ReducerResult {
  return { state, error };
}

export function reduce(state: GameState, action: GameAction): ReducerResult {
  switch (action.type) {
    case 'JOIN':
      return handleJoin(state, action);
    case 'LEAVE':
      return handleLeave(state, action);
    case 'SET_TEAMS':
      return handleSetTeams(state, action);
    case 'RANDOMIZE_TEAMS':
      return handleRandomizeTeams(state);
    case 'SET_TARGET_SCORE':
      return handleSetTargetScore(state, action);
    case 'START_GAME':
      return handleStartGame(state);
    case 'DEAL':
      return handleDeal(state);
    case 'BID':
      return handleBid(state, action);
    case 'PASS':
      return handlePass(state, action);
    case 'CONTRER':
      return handleContrer(state, action);
    case 'SURCONTRER':
      return handleSurcontrer(state, action);
    case 'PLAY_CARD':
      return handlePlayCard(state, action);
    case 'DECLARE_BELOTE':
      return handleDeclareBelote(state, action);
    case 'NEXT_ROUND':
      return handleNextRound(state);
    case 'REMATCH':
      return handleRematch(state, action);
    default:
      return err(state, 'Unknown action');
  }
}

function handleJoin(
  state: GameState,
  action: { type: 'JOIN'; playerId: string; playerName: string },
): ReducerResult {
  if (state.phase !== 'lobby') return err(state, 'Can only join in lobby phase');
  if (Object.keys(state.players).length >= 4) return err(state, 'Game is full');
  if (state.players[action.playerId]) return err(state, 'Player already joined');

  // Assign first available seat
  const takenSeats = new Set(Object.values(state.players).map((p) => p.seat));
  const freeSeat = SEAT_ORDER.find((s) => !takenSeats.has(s));
  if (!freeSeat) return err(state, 'No seats available');

  const player: Player = {
    id: action.playerId,
    name: action.playerName,
    seat: freeSeat,
  };

  const newPlayers = { ...state.players, [action.playerId]: player };
  const newOrder = [...state.playerOrder, action.playerId];

  // Auto-advance to team selection when 4 players
  const newPhase = Object.keys(newPlayers).length === 4 ? 'team_selection' : 'lobby';

  return ok({ ...state, players: newPlayers, playerOrder: newOrder, phase: newPhase });
}

function handleLeave(
  state: GameState,
  action: { type: 'LEAVE'; playerId: string },
): ReducerResult {
  if (!state.players[action.playerId]) return err(state, 'Player not found');

  const { [action.playerId]: _, ...remainingPlayers } = state.players;
  const newOrder = state.playerOrder.filter((id) => id !== action.playerId);

  return ok({
    ...state,
    players: remainingPlayers,
    playerOrder: newOrder,
    phase: 'lobby',
    teams: null,
  });
}

function handleSetTeams(
  state: GameState,
  action: { type: 'SET_TEAMS'; assignments: Record<string, { seat: Seat; team: TeamId }> },
): ReducerResult {
  if (state.phase !== 'team_selection') return err(state, 'Not in team selection phase');

  const playerIds = Object.keys(state.players);
  if (playerIds.length !== 4) return err(state, 'Need 4 players');

  // Apply seat/team assignments
  const newPlayers: Record<string, Player> = {};
  const team1Ids: string[] = [];
  const team2Ids: string[] = [];

  for (const [playerId, assignment] of Object.entries(action.assignments)) {
    if (!state.players[playerId]) return err(state, `Player ${playerId} not found`);
    newPlayers[playerId] = { ...state.players[playerId], seat: assignment.seat };
    if (assignment.team === TeamId.Team1) team1Ids.push(playerId);
    else team2Ids.push(playerId);
  }

  if (team1Ids.length !== 2 || team2Ids.length !== 2) {
    return err(state, 'Each team must have exactly 2 players');
  }

  const teams = {
    team1: { id: TeamId.Team1, playerIds: team1Ids as [string, string], score: 0 },
    team2: { id: TeamId.Team2, playerIds: team2Ids as [string, string], score: 0 },
  };

  return ok({ ...state, players: newPlayers, teams, phase: 'config' });
}

function handleRandomizeTeams(state: GameState): ReducerResult {
  if (state.phase !== 'team_selection') return err(state, 'Not in team selection phase');

  const playerIds = Object.keys(state.players);
  if (playerIds.length !== 4) return err(state, 'Need 4 players');

  // Shuffle player IDs
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);

  // Assign seats and teams
  const assignments: Record<string, { seat: Seat; team: TeamId }> = {};
  assignments[shuffled[0]] = { seat: Seat.North, team: TeamId.Team1 };
  assignments[shuffled[1]] = { seat: Seat.East, team: TeamId.Team2 };
  assignments[shuffled[2]] = { seat: Seat.South, team: TeamId.Team1 };
  assignments[shuffled[3]] = { seat: Seat.West, team: TeamId.Team2 };

  return handleSetTeams(state, { type: 'SET_TEAMS', assignments });
}

function handleSetTargetScore(
  state: GameState,
  action: { type: 'SET_TARGET_SCORE'; score: number },
): ReducerResult {
  if (state.phase !== 'config') return err(state, 'Not in config phase');
  if (action.score < 500 || action.score > 5000) return err(state, 'Invalid target score');

  return ok({ ...state, targetScore: action.score });
}

function handleStartGame(state: GameState): ReducerResult {
  if (state.phase !== 'config') return err(state, 'Not in config phase');
  if (!state.teams) return err(state, 'Teams not set');

  return ok({ ...state, phase: 'dealing', dealer: Seat.North, roundNumber: 1 });
}

function handleDeal(state: GameState): ReducerResult {
  if (state.phase !== 'dealing') return err(state, 'Not in dealing phase');
  if (!state.dealer) return err(state, 'No dealer set');

  const deck = createShuffledDeck();
  const [north, east, south, west] = deal(deck);

  const hands: Record<Seat, Card[]> = {
    [Seat.North]: north,
    [Seat.East]: east,
    [Seat.South]: south,
    [Seat.West]: west,
  };

  // Bidding starts from dealer's left (next seat clockwise)
  const firstBidder = nextSeat(state.dealer);

  return ok({
    ...state,
    phase: 'bidding',
    hands,
    bids: [],
    highestBid: null,
    currentBidder: firstBidder,
    consecutivePasses: 0,
    contract: null,
    tricks: [],
    currentTrick: null,
    roundScore: null,
    beloteHolder: null,
    beloteDeclared: false,
  });
}

function handleBid(
  state: GameState,
  action: { type: 'BID'; playerId: string; points: number; suit: string },
): ReducerResult {
  if (state.phase !== 'bidding') return err(state, 'Not in bidding phase');
  if (!state.currentBidder) return err(state, 'No current bidder');

  const player = state.players[action.playerId];
  if (!player) return err(state, 'Player not found');
  if (player.seat !== state.currentBidder) return err(state, 'Not your turn to bid');

  if (state.highestBid && !isBidHigher(action.points as any, state.highestBid.points)) {
    return err(state, 'Bid must be higher than current highest');
  }

  const bid = {
    playerId: action.playerId,
    points: action.points as any,
    suit: action.suit as any,
  };

  const bidAction = { type: 'bid' as const, bid };
  const newBids = [...state.bids, bidAction];

  return ok({
    ...state,
    bids: newBids,
    highestBid: bid,
    consecutivePasses: 0,
    currentBidder: nextSeat(state.currentBidder),
  });
}

function handlePass(
  state: GameState,
  action: { type: 'PASS'; playerId: string },
): ReducerResult {
  if (state.phase !== 'bidding') return err(state, 'Not in bidding phase');
  if (!state.currentBidder) return err(state, 'No current bidder');

  const player = state.players[action.playerId];
  if (!player) return err(state, 'Player not found');
  if (player.seat !== state.currentBidder) return err(state, 'Not your turn to bid');

  const passAction = { type: 'pass' as const, playerId: action.playerId };
  const newBids = [...state.bids, passAction];
  const newPasses = state.consecutivePasses + 1;

  // Check if bidding is over
  // 4 passes with no bid = redeal
  if (!state.highestBid && newPasses >= 4) {
    const newDealer = nextSeat(state.dealer!);
    return ok({
      ...state,
      bids: newBids,
      consecutivePasses: newPasses,
      phase: 'dealing',
      dealer: newDealer,
    });
  }

  // 3 passes after a bid = contract set
  if (state.highestBid && newPasses >= 3) {
    const bidder = state.players[state.highestBid.playerId];
    const contract = {
      bid: state.highestBid,
      team: teamForSeat(bidder.seat),
      contred: false,
      surcontred: false,
    };

    // Check for belote in all hands
    let beloteHolder: Seat | null = null;
    for (const seat of SEAT_ORDER) {
      if (state.hands[seat] && hasBelote(state.hands[seat], state.highestBid.suit)) {
        beloteHolder = seat;
        break;
      }
    }

    const firstPlayer = nextSeat(state.dealer!);
    return ok({
      ...state,
      bids: newBids,
      consecutivePasses: newPasses,
      contract,
      phase: 'playing',
      currentPlayer: firstPlayer,
      currentTrick: createTrick(1, firstPlayer),
      beloteHolder,
    });
  }

  return ok({
    ...state,
    bids: newBids,
    consecutivePasses: newPasses,
    currentBidder: nextSeat(state.currentBidder),
  });
}

function handleContrer(
  state: GameState,
  action: { type: 'CONTRER'; playerId: string },
): ReducerResult {
  if (state.phase !== 'bidding') return err(state, 'Not in bidding phase');
  if (!state.highestBid) return err(state, 'No bid to contrer');

  const player = state.players[action.playerId];
  if (!player) return err(state, 'Player not found');

  const bidderTeam = teamForSeat(state.players[state.highestBid.playerId].seat);
  const playerTeam = teamForSeat(player.seat);
  if (playerTeam === bidderTeam) return err(state, 'Cannot contrer your own team');

  const bidder = state.players[state.highestBid.playerId];
  const contract = {
    bid: state.highestBid,
    team: teamForSeat(bidder.seat),
    contred: true,
    surcontred: false,
  };

  let beloteHolder: Seat | null = null;
  for (const seat of SEAT_ORDER) {
    if (state.hands[seat] && hasBelote(state.hands[seat], state.highestBid.suit)) {
      beloteHolder = seat;
      break;
    }
  }

  const firstPlayer = nextSeat(state.dealer!);
  const contrerAction = { type: 'contrer' as const, playerId: action.playerId };

  return ok({
    ...state,
    bids: [...state.bids, contrerAction],
    contract,
    phase: 'playing',
    currentPlayer: firstPlayer,
    currentTrick: createTrick(1, firstPlayer),
    beloteHolder,
  });
}

function handleSurcontrer(
  state: GameState,
  action: { type: 'SURCONTRER'; playerId: string },
): ReducerResult {
  if (state.phase !== 'bidding') return err(state, 'Not in bidding phase');
  if (!state.contract?.contred) return err(state, 'Must be contred first');

  const player = state.players[action.playerId];
  if (!player) return err(state, 'Player not found');

  const playerTeam = teamForSeat(player.seat);
  if (playerTeam !== state.contract.team) return err(state, 'Only bidding team can surcontrer');

  const surcontrerAction = { type: 'surcontrer' as const, playerId: action.playerId };
  const newContract = { ...state.contract, surcontred: true };

  return ok({
    ...state,
    bids: [...state.bids, surcontrerAction],
    contract: newContract,
  });
}

function handlePlayCard(
  state: GameState,
  action: { type: 'PLAY_CARD'; playerId: string; cardId: string },
): ReducerResult {
  if (state.phase !== 'playing') return err(state, 'Not in playing phase');
  if (!state.currentPlayer || !state.currentTrick || !state.contract) {
    return err(state, 'Invalid game state');
  }

  const player = state.players[action.playerId];
  if (!player) return err(state, 'Player not found');
  if (player.seat !== state.currentPlayer) return err(state, 'Not your turn');

  const card = parseCardId(action.cardId as any);
  const hand = state.hands[player.seat];
  const trumpSuit = state.contract.bid.suit;

  if (!isCardPlayable(card, hand, state.currentTrick, trumpSuit, player.seat)) {
    return err(state, 'This card cannot be played');
  }

  // Remove card from hand
  const newHand = hand.filter((c) => !cardEquals(c, card));
  const newHands = { ...state.hands, [player.seat]: newHand };

  // Add card to trick
  const trickCard: TrickCard = { seat: player.seat, card };
  const updatedTrick: Trick = {
    ...state.currentTrick,
    cards: [...state.currentTrick.cards, trickCard],
  };

  // Check if trick is complete
  if (isTrickComplete(updatedTrick)) {
    const winner = determineTrickWinner(updatedTrick, trumpSuit);
    const completedTrick: Trick = { ...updatedTrick, winner };
    const newTricks = [...state.tricks, completedTrick];

    // Check if all 8 tricks are done
    if (newTricks.length === 8) {
      // Calculate round score
      const beloteTeam =
        state.beloteHolder && state.beloteDeclared
          ? teamForSeat(state.beloteHolder)
          : null;
      const roundScore = calculateRoundScore(newTricks, state.contract, beloteTeam);

      // Update team scores
      const newTeams = state.teams
        ? {
            team1: {
              ...state.teams.team1,
              score: state.teams.team1.score + roundScore.finalScore.team1,
            },
            team2: {
              ...state.teams.team2,
              score: state.teams.team2.score + roundScore.finalScore.team2,
            },
          }
        : null;

      // Check for winner
      let winner: TeamId | null = null;
      if (newTeams) {
        if (newTeams.team1.score >= state.targetScore) winner = TeamId.Team1;
        else if (newTeams.team2.score >= state.targetScore) winner = TeamId.Team2;
        // If both reach target, highest wins
        if (
          newTeams.team1.score >= state.targetScore &&
          newTeams.team2.score >= state.targetScore
        ) {
          winner =
            newTeams.team1.score >= newTeams.team2.score ? TeamId.Team1 : TeamId.Team2;
        }
      }

      return ok({
        ...state,
        hands: newHands,
        tricks: newTricks,
        currentTrick: null,
        currentPlayer: null,
        roundScore,
        roundHistory: [...state.roundHistory, roundScore],
        teams: newTeams ?? state.teams,
        phase: winner ? 'game_over' : 'scoring',
        winner,
      });
    }

    // Start next trick, winner leads
    return ok({
      ...state,
      hands: newHands,
      tricks: newTricks,
      currentTrick: createTrick(newTricks.length + 1, winner),
      currentPlayer: winner,
    });
  }

  // Trick not complete, next player
  return ok({
    ...state,
    hands: newHands,
    currentTrick: updatedTrick,
    currentPlayer: nextSeat(state.currentPlayer),
  });
}

function handleDeclareBelote(
  state: GameState,
  action: { type: 'DECLARE_BELOTE'; playerId: string },
): ReducerResult {
  const player = state.players[action.playerId];
  if (!player) return err(state, 'Player not found');
  if (state.beloteHolder !== player.seat) return err(state, 'You do not hold belote');

  return ok({ ...state, beloteDeclared: true });
}

function handleNextRound(state: GameState): ReducerResult {
  if (state.phase !== 'scoring') return err(state, 'Not in scoring phase');

  const newDealer = nextSeat(state.dealer!);

  return ok({
    ...state,
    phase: 'dealing',
    dealer: newDealer,
    roundNumber: state.roundNumber + 1,
    bids: [],
    highestBid: null,
    currentBidder: null,
    consecutivePasses: 0,
    contract: null,
    tricks: [],
    currentTrick: null,
    currentPlayer: null,
    roundScore: null,
    beloteHolder: null,
    beloteDeclared: false,
  });
}

function handleRematch(
  state: GameState,
  action: { type: 'REMATCH'; sameTeams: boolean },
): ReducerResult {
  if (state.phase !== 'game_over') return err(state, 'Game is not over');

  if (action.sameTeams && state.teams) {
    // Reset scores, keep teams
    const resetTeams = {
      team1: { ...state.teams.team1, score: 0 },
      team2: { ...state.teams.team2, score: 0 },
    };
    return ok({
      ...state,
      teams: resetTeams,
      phase: 'dealing',
      dealer: Seat.North,
      roundNumber: 1,
      roundHistory: [],
      winner: null,
      bids: [],
      highestBid: null,
      currentBidder: null,
      consecutivePasses: 0,
      contract: null,
      tricks: [],
      currentTrick: null,
      currentPlayer: null,
      roundScore: null,
      beloteHolder: null,
      beloteDeclared: false,
    });
  }

  // Different teams: go back to team selection
  return ok({
    ...state,
    phase: 'team_selection',
    teams: null,
    roundNumber: 0,
    roundHistory: [],
    winner: null,
  });
}
