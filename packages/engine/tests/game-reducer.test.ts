import { describe, it, expect } from 'vitest';
import { reduce, type ReducerResult } from '../src/state/game-reducer.js';
import { createInitialState, type GameState } from '../src/state/game-state.js';
import type { GameAction } from '../src/state/game-actions.js';
import { Seat } from '../src/utils/seat.js';
import { TeamId } from '../src/domain/team.js';
import { Suit, Rank, cardId, type Card } from '../src/domain/card.js';

// ---- Helpers ----

function apply(state: GameState, ...actions: GameAction[]): ReducerResult {
  let result: ReducerResult = { state };
  for (const action of actions) {
    result = reduce(result.state, action);
    if (result.error) return result;
  }
  return result;
}

function lobbyWith4Players(): GameState {
  let state = createInitialState('game1', 'ROOM');
  state = reduce(state, { type: 'JOIN', playerId: 'p1', playerName: 'Alice' }).state;
  state = reduce(state, { type: 'JOIN', playerId: 'p2', playerName: 'Bob' }).state;
  state = reduce(state, { type: 'JOIN', playerId: 'p3', playerName: 'Charlie' }).state;
  state = reduce(state, { type: 'JOIN', playerId: 'p4', playerName: 'Diana' }).state;
  return state;
}

function teamSelectionState(): GameState {
  return lobbyWith4Players();
}

function teamsSetState(): GameState {
  const state = teamSelectionState();
  const result = reduce(state, {
    type: 'SET_TEAMS',
    assignments: {
      p1: { seat: Seat.North, team: TeamId.Team1 },
      p2: { seat: Seat.East, team: TeamId.Team2 },
      p3: { seat: Seat.South, team: TeamId.Team1 },
      p4: { seat: Seat.West, team: TeamId.Team2 },
    },
  });
  return result.state;
}

function configState(): GameState {
  return teamsSetState(); // SET_TEAMS moves to 'config'
}

function dealingState(): GameState {
  const state = configState();
  return reduce(state, { type: 'START_GAME' }).state;
}

function biddingState(): GameState {
  const state = dealingState();
  return reduce(state, { type: 'DEAL' }).state;
}

/** Find the player ID who sits at a given seat */
function playerAtSeat(state: GameState, seat: Seat): string {
  const entry = Object.entries(state.players).find(([, p]) => p.seat === seat);
  return entry![0];
}

/** Get a card from a player's hand */
function firstCardOfSuit(state: GameState, seat: Seat, suit: Suit): Card | undefined {
  return state.hands[seat]?.find((c) => c.suit === suit);
}

// ---- Tests ----

describe('JOIN action', () => {
  it('adds a player in lobby phase', () => {
    const state = createInitialState('g1', 'R1');
    const result = reduce(state, { type: 'JOIN', playerId: 'p1', playerName: 'Alice' });
    expect(result.error).toBeUndefined();
    expect(result.state.players['p1']).toBeDefined();
    expect(result.state.players['p1'].name).toBe('Alice');
    expect(result.state.phase).toBe('lobby');
  });

  it('auto-advances to team_selection when 4 players join', () => {
    const state = lobbyWith4Players();
    expect(state.phase).toBe('team_selection');
    expect(Object.keys(state.players)).toHaveLength(4);
  });

  it('assigns seats in order N, E, S, W', () => {
    const state = lobbyWith4Players();
    expect(state.players['p1'].seat).toBe(Seat.North);
    expect(state.players['p2'].seat).toBe(Seat.East);
    expect(state.players['p3'].seat).toBe(Seat.South);
    expect(state.players['p4'].seat).toBe(Seat.West);
  });

  it('rejects a 5th player', () => {
    const state = lobbyWith4Players();
    const result = reduce(state, { type: 'JOIN', playerId: 'p5', playerName: 'Eve' });
    expect(result.error).toBeDefined();
  });

  it('rejects duplicate player ID', () => {
    const state = createInitialState('g1', 'R1');
    const s1 = reduce(state, { type: 'JOIN', playerId: 'p1', playerName: 'Alice' }).state;
    const result = reduce(s1, { type: 'JOIN', playerId: 'p1', playerName: 'Alice2' });
    expect(result.error).toBeDefined();
  });

  it('rejects join in non-lobby phase', () => {
    const state = teamsSetState(); // config phase
    const result = reduce(state, { type: 'JOIN', playerId: 'p5', playerName: 'Eve' });
    expect(result.error).toBeDefined();
  });
});

describe('LEAVE action', () => {
  it('removes a player and goes back to lobby', () => {
    const state = lobbyWith4Players();
    const result = reduce(state, { type: 'LEAVE', playerId: 'p2' });
    expect(result.error).toBeUndefined();
    expect(result.state.players['p2']).toBeUndefined();
    expect(result.state.phase).toBe('lobby');
    expect(result.state.teams).toBeNull();
  });

  it('errors when removing a non-existent player', () => {
    const state = createInitialState('g1', 'R1');
    const result = reduce(state, { type: 'LEAVE', playerId: 'nobody' });
    expect(result.error).toBeDefined();
  });
});

describe('SET_TEAMS action', () => {
  it('assigns teams and moves to config phase', () => {
    const state = teamSelectionState();
    const result = reduce(state, {
      type: 'SET_TEAMS',
      assignments: {
        p1: { seat: Seat.North, team: TeamId.Team1 },
        p2: { seat: Seat.East, team: TeamId.Team2 },
        p3: { seat: Seat.South, team: TeamId.Team1 },
        p4: { seat: Seat.West, team: TeamId.Team2 },
      },
    });
    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('config');
    expect(result.state.teams).not.toBeNull();
    expect(result.state.teams!.team1.playerIds).toContain('p1');
    expect(result.state.teams!.team1.playerIds).toContain('p3');
    expect(result.state.teams!.team2.playerIds).toContain('p2');
    expect(result.state.teams!.team2.playerIds).toContain('p4');
  });

  it('rejects unbalanced teams', () => {
    const state = teamSelectionState();
    const result = reduce(state, {
      type: 'SET_TEAMS',
      assignments: {
        p1: { seat: Seat.North, team: TeamId.Team1 },
        p2: { seat: Seat.East, team: TeamId.Team1 },
        p3: { seat: Seat.South, team: TeamId.Team1 },
        p4: { seat: Seat.West, team: TeamId.Team2 },
      },
    });
    expect(result.error).toBeDefined();
  });

  it('rejects in wrong phase', () => {
    const state = createInitialState('g1', 'R1');
    const result = reduce(state, {
      type: 'SET_TEAMS',
      assignments: {
        p1: { seat: Seat.North, team: TeamId.Team1 },
        p2: { seat: Seat.East, team: TeamId.Team2 },
        p3: { seat: Seat.South, team: TeamId.Team1 },
        p4: { seat: Seat.West, team: TeamId.Team2 },
      },
    });
    expect(result.error).toBeDefined();
  });
});

describe('RANDOMIZE_TEAMS action', () => {
  it('assigns teams randomly and moves to config', () => {
    const state = teamSelectionState();
    const result = reduce(state, { type: 'RANDOMIZE_TEAMS' });
    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('config');
    expect(result.state.teams).not.toBeNull();
    expect(result.state.teams!.team1.playerIds).toHaveLength(2);
    expect(result.state.teams!.team2.playerIds).toHaveLength(2);
  });
});

describe('SET_TARGET_SCORE action', () => {
  it('sets target score in config phase', () => {
    const state = configState();
    const result = reduce(state, { type: 'SET_TARGET_SCORE', score: 1000 });
    expect(result.error).toBeUndefined();
    expect(result.state.targetScore).toBe(1000);
  });

  it('rejects invalid scores', () => {
    const state = configState();
    expect(reduce(state, { type: 'SET_TARGET_SCORE', score: 100 }).error).toBeDefined();
    expect(reduce(state, { type: 'SET_TARGET_SCORE', score: 10000 }).error).toBeDefined();
  });
});

describe('START_GAME action', () => {
  it('moves to dealing phase and sets dealer', () => {
    const state = configState();
    const result = reduce(state, { type: 'START_GAME' });
    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('dealing');
    expect(result.state.dealer).toBe(Seat.North);
    expect(result.state.roundNumber).toBe(1);
  });

  it('rejects in wrong phase', () => {
    const state = teamSelectionState();
    const result = reduce(state, { type: 'START_GAME' });
    expect(result.error).toBeDefined();
  });
});

describe('DEAL action', () => {
  it('distributes 8 cards to each player and moves to bidding', () => {
    const state = dealingState();
    const result = reduce(state, { type: 'DEAL' });
    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('bidding');
    for (const seat of [Seat.North, Seat.East, Seat.South, Seat.West]) {
      expect(result.state.hands[seat]).toHaveLength(8);
    }
  });

  it('sets first bidder to left of dealer', () => {
    const state = dealingState(); // dealer = North
    const result = reduce(state, { type: 'DEAL' });
    expect(result.state.currentBidder).toBe(Seat.East); // left of North
  });

  it('rejects in wrong phase', () => {
    const state = configState();
    const result = reduce(state, { type: 'DEAL' });
    expect(result.error).toBeDefined();
  });
});

describe('Bidding flow', () => {
  it('allows a player to place a bid', () => {
    const state = biddingState();
    const bidderId = playerAtSeat(state, state.currentBidder!);
    const result = reduce(state, {
      type: 'BID',
      playerId: bidderId,
      points: 80,
      suit: Suit.Hearts,
    });
    expect(result.error).toBeUndefined();
    expect(result.state.highestBid).toBeDefined();
    expect(result.state.highestBid!.points).toBe(80);
    expect(result.state.highestBid!.suit).toBe(Suit.Hearts);
  });

  it('rejects bid from wrong player', () => {
    const state = biddingState();
    // Find a player NOT at the current bidder seat
    const wrongPlayer = Object.values(state.players).find(
      (p) => p.seat !== state.currentBidder,
    )!;
    const result = reduce(state, {
      type: 'BID',
      playerId: wrongPlayer.id,
      points: 80,
      suit: Suit.Hearts,
    });
    expect(result.error).toBeDefined();
  });

  it('rejects bid not higher than current highest', () => {
    const state = biddingState();
    const bidder1 = playerAtSeat(state, state.currentBidder!);
    const s1 = reduce(state, {
      type: 'BID',
      playerId: bidder1,
      points: 90,
      suit: Suit.Hearts,
    }).state;
    const bidder2 = playerAtSeat(s1, s1.currentBidder!);
    const result = reduce(s1, {
      type: 'BID',
      playerId: bidder2,
      points: 80,
      suit: Suit.Spades,
    });
    expect(result.error).toBeDefined();
  });

  it('4 passes with no bid redeals', () => {
    let state = biddingState();
    for (let i = 0; i < 4; i++) {
      const passer = playerAtSeat(state, state.currentBidder!);
      state = reduce(state, { type: 'PASS', playerId: passer }).state;
    }
    expect(state.phase).toBe('dealing'); // redeal
  });

  it('3 passes after a bid sets contract and moves to playing', () => {
    let state = biddingState();
    // First player bids
    const bidder = playerAtSeat(state, state.currentBidder!);
    state = reduce(state, {
      type: 'BID',
      playerId: bidder,
      points: 80,
      suit: Suit.Hearts,
    }).state;
    // Next 3 players pass
    for (let i = 0; i < 3; i++) {
      const passer = playerAtSeat(state, state.currentBidder!);
      state = reduce(state, { type: 'PASS', playerId: passer }).state;
    }
    expect(state.phase).toBe('playing');
    expect(state.contract).not.toBeNull();
    expect(state.contract!.bid.points).toBe(80);
    expect(state.contract!.bid.suit).toBe(Suit.Hearts);
    expect(state.currentTrick).not.toBeNull();
  });

  it('CONTRER sets a contred contract and moves to playing', () => {
    let state = biddingState();
    // First bidder (East, left of North dealer) bids -> they sit at East -> team2
    const bidder = playerAtSeat(state, state.currentBidder!);
    state = reduce(state, {
      type: 'BID',
      playerId: bidder,
      points: 80,
      suit: Suit.Hearts,
    }).state;

    // Find a player on the opposing team to contrer
    const bidderSeat = state.players[bidder].seat;
    const bidderTeam = bidderSeat === Seat.North || bidderSeat === Seat.South ? TeamId.Team1 : TeamId.Team2;
    const opposingPlayer = Object.values(state.players).find((p) => {
      const pTeam = p.seat === Seat.North || p.seat === Seat.South ? TeamId.Team1 : TeamId.Team2;
      return pTeam !== bidderTeam;
    })!;

    const result = reduce(state, { type: 'CONTRER', playerId: opposingPlayer.id });
    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('playing');
    expect(result.state.contract!.contred).toBe(true);
  });

  it('CONTRER from same team is rejected', () => {
    let state = biddingState();
    const bidder = playerAtSeat(state, state.currentBidder!);
    state = reduce(state, {
      type: 'BID',
      playerId: bidder,
      points: 80,
      suit: Suit.Hearts,
    }).state;

    // Find a player on the SAME team
    const bidderSeat = state.players[bidder].seat;
    const bidderTeam = bidderSeat === Seat.North || bidderSeat === Seat.South ? TeamId.Team1 : TeamId.Team2;
    const sameTeamPlayer = Object.values(state.players).find((p) => {
      const pTeam = p.seat === Seat.North || p.seat === Seat.South ? TeamId.Team1 : TeamId.Team2;
      return pTeam === bidderTeam && p.id !== bidder;
    })!;

    const result = reduce(state, { type: 'CONTRER', playerId: sameTeamPlayer.id });
    expect(result.error).toBeDefined();
  });
});

describe('PLAY_CARD action', () => {
  function playingState(): GameState {
    let state = biddingState();
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
    expect(state.phase).toBe('playing');
    return state;
  }

  it('allows playing a valid card', () => {
    const state = playingState();
    const currentSeat = state.currentPlayer!;
    const currentPlayerId = playerAtSeat(state, currentSeat);
    const hand = state.hands[currentSeat];
    const card = hand[0]; // first card should always be playable when leading

    const result = reduce(state, {
      type: 'PLAY_CARD',
      playerId: currentPlayerId,
      cardId: cardId(card),
    });
    expect(result.error).toBeUndefined();
    expect(result.state.hands[currentSeat]).toHaveLength(7);
    expect(result.state.currentTrick!.cards).toHaveLength(1);
  });

  it('rejects play from wrong player', () => {
    const state = playingState();
    const wrongPlayer = Object.values(state.players).find(
      (p) => p.seat !== state.currentPlayer,
    )!;
    const hand = state.hands[state.currentPlayer!];
    const result = reduce(state, {
      type: 'PLAY_CARD',
      playerId: wrongPlayer.id,
      cardId: cardId(hand[0]),
    });
    expect(result.error).toBeDefined();
  });

  it('completes a trick after 4 cards and sets winner as next leader', () => {
    let state = playingState();

    // Play 4 cards (one full trick)
    for (let i = 0; i < 4; i++) {
      const seat = state.currentPlayer!;
      const pid = playerAtSeat(state, seat);
      const hand = state.hands[seat];
      // Try each card until one is accepted (play-validation may reject some)
      let played = false;
      for (const c of hand) {
        const result = reduce(state, {
          type: 'PLAY_CARD',
          playerId: pid,
          cardId: cardId(c),
        });
        if (!result.error) {
          state = result.state;
          played = true;
          break;
        }
      }
      expect(played).toBe(true);
    }

    // After 4 cards, trick should be completed and stored
    expect(state.tricks).toHaveLength(1);
    expect(state.tricks[0].winner).toBeDefined();
    // Next trick should start
    expect(state.currentTrick).not.toBeNull();
    expect(state.currentTrick!.cards).toHaveLength(0);
    // Current player should be the trick winner
    expect(state.currentPlayer).toBe(state.tricks[0].winner);
  });

  it('rejects play in non-playing phase', () => {
    const state = biddingState();
    const result = reduce(state, {
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardId: 'spades-A',
    });
    expect(result.error).toBeDefined();
  });
});

describe('Full round flow', () => {
  it('plays all 8 tricks and moves to scoring', () => {
    let state = biddingState();
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
    expect(state.phase).toBe('playing');

    // Play all 8 tricks (32 cards total)
    for (let trick = 0; trick < 8; trick++) {
      for (let card = 0; card < 4; card++) {
        const seat = state.currentPlayer!;
        const pid = playerAtSeat(state, seat);
        const hand = state.hands[seat];

        // We need to pick a playable card. Import getPlayableCards logic:
        // Since the game-reducer already validates, let's just try cards until one works.
        let played = false;
        for (const c of hand) {
          const result = reduce(state, {
            type: 'PLAY_CARD',
            playerId: pid,
            cardId: cardId(c),
          });
          if (!result.error) {
            state = result.state;
            played = true;
            break;
          }
        }
        expect(played).toBe(true);
      }
    }

    expect(state.phase).toBe('scoring');
    expect(state.tricks).toHaveLength(8);
    expect(state.roundScore).not.toBeNull();
    // All hands should be empty
    for (const seat of [Seat.North, Seat.East, Seat.South, Seat.West]) {
      expect(state.hands[seat]).toHaveLength(0);
    }
  });
});

describe('NEXT_ROUND action', () => {
  it('rejects in non-scoring phase', () => {
    const state = biddingState();
    const result = reduce(state, { type: 'NEXT_ROUND' });
    expect(result.error).toBeDefined();
  });

  it('advances dealer and increments round number', () => {
    // We need a state in scoring phase. Build a mock by manipulating state.
    const state = dealingState();
    // Manually set to scoring phase to test NEXT_ROUND
    const scoringState: GameState = {
      ...state,
      phase: 'scoring',
      dealer: Seat.North,
      roundNumber: 1,
    };
    const result = reduce(scoringState, { type: 'NEXT_ROUND' });
    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('dealing');
    expect(result.state.dealer).toBe(Seat.East); // next clockwise
    expect(result.state.roundNumber).toBe(2);
    // State should be reset for new round
    expect(result.state.bids).toEqual([]);
    expect(result.state.contract).toBeNull();
    expect(result.state.tricks).toEqual([]);
    expect(result.state.roundScore).toBeNull();
  });
});

describe('REMATCH action', () => {
  it('rejects when game is not over', () => {
    const state = biddingState();
    const result = reduce(state, { type: 'REMATCH', sameTeams: true });
    expect(result.error).toBeDefined();
  });

  it('same teams: resets scores, keeps teams, goes to dealing', () => {
    const state = configState();
    const gameOverState: GameState = {
      ...state,
      phase: 'game_over',
      winner: TeamId.Team1,
      teams: {
        team1: { ...state.teams!.team1, score: 2500 },
        team2: { ...state.teams!.team2, score: 1800 },
      },
    };
    const result = reduce(gameOverState, { type: 'REMATCH', sameTeams: true });
    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('dealing');
    expect(result.state.teams!.team1.score).toBe(0);
    expect(result.state.teams!.team2.score).toBe(0);
    expect(result.state.teams!.team1.playerIds).toEqual(
      gameOverState.teams!.team1.playerIds,
    );
    expect(result.state.winner).toBeNull();
    expect(result.state.roundNumber).toBe(1);
  });

  it('different teams: goes to team_selection, clears teams', () => {
    const state = configState();
    const gameOverState: GameState = {
      ...state,
      phase: 'game_over',
      winner: TeamId.Team1,
    };
    const result = reduce(gameOverState, { type: 'REMATCH', sameTeams: false });
    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('team_selection');
    expect(result.state.teams).toBeNull();
    expect(result.state.winner).toBeNull();
  });
});

describe('DECLARE_BELOTE action', () => {
  it('allows belote holder to declare', () => {
    const state = dealingState();
    const playingState: GameState = {
      ...state,
      phase: 'playing',
      beloteHolder: Seat.North,
      beloteDeclared: false,
    };
    const result = reduce(playingState, {
      type: 'DECLARE_BELOTE',
      playerId: playerAtSeat(playingState, Seat.North),
    });
    expect(result.error).toBeUndefined();
    expect(result.state.beloteDeclared).toBe(true);
  });

  it('rejects declaration from non-holder', () => {
    const state = dealingState();
    const playingState: GameState = {
      ...state,
      phase: 'playing',
      beloteHolder: Seat.North,
      beloteDeclared: false,
    };
    const result = reduce(playingState, {
      type: 'DECLARE_BELOTE',
      playerId: playerAtSeat(playingState, Seat.East),
    });
    expect(result.error).toBeDefined();
  });
});
