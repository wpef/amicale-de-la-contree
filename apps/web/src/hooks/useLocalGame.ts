'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  createInitialState,
  type GameState,
  type GamePhase,
} from '@contree/engine';
import { reduce, type ReducerResult } from '@contree/engine';
import type { GameAction } from '@contree/engine';
import { projectState, type ProjectedGameState } from '@contree/engine';
import { Seat, SEAT_ORDER } from '@contree/engine';
import { TeamId } from '@contree/engine';

interface LocalPlayer {
  id: string;
  name: string;
}

interface LocalGameHook {
  /** The full game state (only for debugging - use projectedState in UI) */
  state: GameState;

  /** Projected state for the active player (hides other hands) */
  projectedState: ProjectedGameState | null;

  /** Which player is currently looking at the screen */
  activePlayer: LocalPlayer | null;

  /** All players in the game */
  players: LocalPlayer[];

  /** Whether a hand reveal is pending (hot-seat: confirm before showing cards) */
  pendingReveal: boolean;

  /** Confirm you're the right player and reveal your hand */
  revealHand: () => void;

  /** Dispatch a game action */
  dispatch: (action: GameAction) => string | undefined;

  /** Last error from dispatch */
  lastError: string | null;

  /** Create a new local game with given players */
  createGame: (playerNames: string[]) => void;

  /** Auto-advance to next step when applicable (deal, etc.) */
  autoAdvance: () => void;
}

const GUEST_SEATS = [Seat.North, Seat.East, Seat.South, Seat.West];

function makePlayerId(index: number): string {
  return `local-player-${index}`;
}

export function useLocalGame(): LocalGameHook {
  const [state, setState] = useState<GameState>(() =>
    createInitialState('local-game', 'LOCAL'),
  );
  const [players, setPlayers] = useState<LocalPlayer[]>([]);
  const [pendingReveal, setPendingReveal] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Determine who should be looking at the screen right now
  const activePlayer = useMemo((): LocalPlayer | null => {
    if (players.length === 0) return null;

    // During bidding: the current bidder
    if (state.phase === 'bidding' && state.currentBidder) {
      const seatIdx = SEAT_ORDER.indexOf(state.currentBidder);
      return players[seatIdx] ?? null;
    }

    // During playing: the current player
    if (state.phase === 'playing' && state.currentPlayer) {
      const seatIdx = SEAT_ORDER.indexOf(state.currentPlayer);
      return players[seatIdx] ?? null;
    }

    // During scoring, game_over, config, team_selection: player 0 (host)
    return players[0] ?? null;
  }, [state.phase, state.currentBidder, state.currentPlayer, players]);

  // Project state for the active player
  const projectedState = useMemo((): ProjectedGameState | null => {
    if (!activePlayer || !state.players[activePlayer.id]) return null;
    if (pendingReveal) {
      // Show projected state but with empty hand (waiting for reveal)
      const proj = projectState(state, activePlayer.id);
      return { ...proj, myHand: [], playableCards: [] };
    }
    return projectState(state, activePlayer.id);
  }, [state, activePlayer, pendingReveal]);

  const dispatch = useCallback(
    (action: GameAction): string | undefined => {
      const result: ReducerResult = reduce(state, action);
      if (result.error) {
        setLastError(result.error);
        return result.error;
      }
      setLastError(null);
      setState(result.state);

      // In hot-seat mode, if the active player changes, require a reveal
      const newState = result.state;
      if (
        (newState.phase === 'bidding' || newState.phase === 'playing') &&
        (newState.currentBidder !== state.currentBidder ||
          newState.currentPlayer !== state.currentPlayer)
      ) {
        setPendingReveal(true);
      }

      return undefined;
    },
    [state],
  );

  const revealHand = useCallback(() => {
    setPendingReveal(false);
  }, []);

  const createGame = useCallback((playerNames: string[]) => {
    if (playerNames.length !== 4) {
      setLastError('Need exactly 4 player names');
      return;
    }

    let s = createInitialState('local-game', 'LOCAL');

    // Join all 4 players
    const localPlayers: LocalPlayer[] = [];
    for (let i = 0; i < 4; i++) {
      const id = makePlayerId(i);
      localPlayers.push({ id, name: playerNames[i] });
      const result = reduce(s, { type: 'JOIN', playerId: id, playerName: playerNames[i] });
      if (result.error) {
        setLastError(result.error);
        return;
      }
      s = result.state;
    }

    // Auto-assign teams (N/S = team1, E/W = team2) and randomize
    const assignments: Record<string, { seat: Seat; team: TeamId }> = {};
    for (let i = 0; i < 4; i++) {
      const seat = GUEST_SEATS[i];
      assignments[localPlayers[i].id] = {
        seat,
        team: seat === Seat.North || seat === Seat.South ? TeamId.Team1 : TeamId.Team2,
      };
    }

    const teamResult = reduce(s, { type: 'SET_TEAMS', assignments });
    if (teamResult.error) {
      setLastError(teamResult.error);
      return;
    }
    s = teamResult.state;

    setPlayers(localPlayers);
    setState(s);
    setLastError(null);
    setPendingReveal(false);
  }, []);

  const autoAdvance = useCallback(() => {
    // Auto-deal when in dealing phase
    if (state.phase === 'dealing') {
      const result = reduce(state, { type: 'DEAL' });
      if (!result.error) {
        setState(result.state);
        setPendingReveal(true);
      }
    }
  }, [state]);

  return {
    state,
    projectedState,
    activePlayer,
    players,
    pendingReveal,
    revealHand,
    dispatch,
    lastError,
    createGame,
    autoAdvance,
  };
}
