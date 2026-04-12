import { describe, it, expect } from 'vitest';
import { projectState, type ProjectedGameState } from '../src/state/state-projection.js';
import { createInitialState, type GameState } from '../src/state/game-state.js';
import { reduce } from '../src/state/game-reducer.js';
import type { GameAction } from '../src/state/game-actions.js';
import { Seat } from '../src/utils/seat.js';
import { TeamId } from '../src/domain/team.js';
import { Suit, Rank, cardId, type Card } from '../src/domain/card.js';
import { createTrick, type Trick } from '../src/domain/trick.js';

// ---- Helpers ----

function playerAtSeat(state: GameState, seat: Seat): string {
  const entry = Object.entries(state.players).find(([, p]) => p.seat === seat);
  return entry![0];
}

function setupPlayingState(): GameState {
  let state = createInitialState('game1', 'ROOM');
  state = reduce(state, { type: 'JOIN', playerId: 'p1', playerName: 'Alice' }).state;
  state = reduce(state, { type: 'JOIN', playerId: 'p2', playerName: 'Bob' }).state;
  state = reduce(state, { type: 'JOIN', playerId: 'p3', playerName: 'Charlie' }).state;
  state = reduce(state, { type: 'JOIN', playerId: 'p4', playerName: 'Diana' }).state;
  state = reduce(state, {
    type: 'SET_TEAMS',
    assignments: {
      p1: { seat: Seat.North, team: TeamId.Team1 },
      p2: { seat: Seat.East, team: TeamId.Team2 },
      p3: { seat: Seat.South, team: TeamId.Team1 },
      p4: { seat: Seat.West, team: TeamId.Team2 },
    },
  }).state;
  state = reduce(state, { type: 'START_GAME' }).state;
  state = reduce(state, { type: 'DEAL' }).state;

  // Bid and move to playing
  const bidder = playerAtSeat(state, state.currentBidder!);
  state = reduce(state, {
    type: 'BID',
    playerId: bidder,
    points: 80,
    suit: Suit.Hearts,
  }).state;
  for (let i = 0; i < 3; i++) {
    const passer = playerAtSeat(state, state.currentBidder!);
    state = reduce(state, { type: 'PASS', playerId: passer }).state;
  }
  return state;
}

// ---- Tests ----

describe('projectState', () => {
  it('throws for unknown player', () => {
    const state = createInitialState('g1', 'R1');
    expect(() => projectState(state, 'unknown')).toThrow('Player unknown not found');
  });

  describe('hand visibility', () => {
    it('shows the requesting player their own hand', () => {
      const state = setupPlayingState();
      const projected = projectState(state, 'p1');
      expect(projected.myHand).toEqual(state.hands[Seat.North]);
      expect(projected.myHand.length).toBe(8);
    });

    it('does not expose other players hands directly', () => {
      const state = setupPlayingState();
      const projected = projectState(state, 'p1');
      // The projected state should NOT have a hands field with all players
      expect((projected as any).hands).toBeUndefined();
    });

    it('shows card counts for all players', () => {
      const state = setupPlayingState();
      const projected = projectState(state, 'p1');
      for (const player of projected.players) {
        expect(player.cardCount).toBe(8);
      }
    });

    it('card counts decrease as cards are played', () => {
      let state = setupPlayingState();
      const seat = state.currentPlayer!;
      const pid = playerAtSeat(state, seat);
      const hand = state.hands[seat];

      // Play a valid card
      for (const c of hand) {
        const result = reduce(state, {
          type: 'PLAY_CARD',
          playerId: pid,
          cardId: cardId(c),
        });
        if (!result.error) {
          state = result.state;
          break;
        }
      }

      const projected = projectState(state, 'p1');
      const playedPlayer = projected.players.find((p) => p.seat === seat)!;
      expect(playedPlayer.cardCount).toBe(7);
    });
  });

  describe('playable cards', () => {
    it('calculates playable cards for the current player', () => {
      const state = setupPlayingState();
      const currentPid = playerAtSeat(state, state.currentPlayer!);
      const projected = projectState(state, currentPid);

      // When leading, all cards should be playable
      expect(projected.playableCards.length).toBe(8);
      // Playable cards should be CardId strings
      for (const cid of projected.playableCards) {
        expect(typeof cid).toBe('string');
        expect(cid).toContain('-');
      }
    });

    it('returns empty playable cards for non-current player', () => {
      const state = setupPlayingState();
      // Find a player who is NOT the current player
      const otherPid = Object.values(state.players).find(
        (p) => p.seat !== state.currentPlayer,
      )!.id;
      const projected = projectState(state, otherPid);
      expect(projected.playableCards).toEqual([]);
    });

    it('returns empty playable cards outside playing phase', () => {
      let state = createInitialState('g1', 'R1');
      state = reduce(state, { type: 'JOIN', playerId: 'p1', playerName: 'Alice' }).state;
      const projected = projectState(state, 'p1');
      expect(projected.playableCards).toEqual([]);
    });
  });

  describe('game information', () => {
    it('includes basic game info', () => {
      const state = setupPlayingState();
      const projected = projectState(state, 'p1');
      expect(projected.id).toBe('game1');
      expect(projected.roomCode).toBe('ROOM');
      expect(projected.phase).toBe('playing');
    });

    it('includes team information', () => {
      const state = setupPlayingState();
      const projected = projectState(state, 'p1');
      expect(projected.teams).not.toBeNull();
      expect(projected.teams!.team1.id).toBe(TeamId.Team1);
      expect(projected.teams!.team2.id).toBe(TeamId.Team2);
      expect(projected.teams!.team1.score).toBe(0);
    });

    it('includes contract information', () => {
      const state = setupPlayingState();
      const projected = projectState(state, 'p1');
      expect(projected.contract).not.toBeNull();
      expect(projected.contract!.bid.suit).toBe(Suit.Hearts);
      expect(projected.contract!.bid.points).toBe(80);
    });

    it('includes correct mySeat', () => {
      const state = setupPlayingState();
      expect(projectState(state, 'p1').mySeat).toBe(Seat.North);
      expect(projectState(state, 'p2').mySeat).toBe(Seat.East);
      expect(projectState(state, 'p3').mySeat).toBe(Seat.South);
      expect(projectState(state, 'p4').mySeat).toBe(Seat.West);
    });
  });

  describe('trick tracking', () => {
    it('shows current trick cards', () => {
      let state = setupPlayingState();
      const seat = state.currentPlayer!;
      const pid = playerAtSeat(state, seat);
      const hand = state.hands[seat];

      // Play one card
      for (const c of hand) {
        const result = reduce(state, {
          type: 'PLAY_CARD',
          playerId: pid,
          cardId: cardId(c),
        });
        if (!result.error) {
          state = result.state;
          break;
        }
      }

      const projected = projectState(state, 'p1');
      expect(projected.currentTrick).not.toBeNull();
      expect(projected.currentTrick!.cards).toHaveLength(1);
    });

    it('tracks tricks won per team', () => {
      let state = setupPlayingState();

      // Play one full trick
      for (let i = 0; i < 4; i++) {
        const seat = state.currentPlayer!;
        const pid = playerAtSeat(state, seat);
        const hand = state.hands[seat];
        for (const c of hand) {
          const result = reduce(state, {
            type: 'PLAY_CARD',
            playerId: pid,
            cardId: cardId(c),
          });
          if (!result.error) {
            state = result.state;
            break;
          }
        }
      }

      const projected = projectState(state, 'p1');
      // One trick has been completed, so total should be 1
      expect(projected.tricksWon.team1 + projected.tricksWon.team2).toBe(1);
    });

    it('shows last completed trick', () => {
      let state = setupPlayingState();

      // Play one full trick
      for (let i = 0; i < 4; i++) {
        const seat = state.currentPlayer!;
        const pid = playerAtSeat(state, seat);
        const hand = state.hands[seat];
        for (const c of hand) {
          const result = reduce(state, {
            type: 'PLAY_CARD',
            playerId: pid,
            cardId: cardId(c),
          });
          if (!result.error) {
            state = result.state;
            break;
          }
        }
      }

      const projected = projectState(state, 'p1');
      expect(projected.lastTrick).not.toBeNull();
      expect(projected.lastTrick!.cards).toHaveLength(4);
      expect(projected.lastTrick!.winner).not.toBeNull();
    });
  });
});
