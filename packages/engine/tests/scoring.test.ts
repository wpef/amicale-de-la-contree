import { describe, it, expect } from 'vitest';
import { Suit, Rank, type Card, DECK_32 } from '../src/domain/card.js';
import { Seat } from '../src/utils/seat.js';
import { TeamId } from '../src/domain/team.js';
import type { Trick } from '../src/domain/trick.js';
import type { Contract } from '../src/domain/contract.js';
import {
  calculateTrickPoints,
  hasBelote,
  calculateRoundScore,
  isCapot,
} from '../src/rules/scoring.js';
import { TRUMP_POINTS, PLAIN_POINTS } from '../src/rules/trump.js';

const trumpSuit = Suit.Hearts;

function c(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

function completedTrick(
  cards: { seat: Seat; card: Card }[],
  winner: Seat,
): Trick {
  return { number: 1, cards, leader: cards[0].seat, winner };
}

describe('total card points', () => {
  it('all cards in the deck sum to 152 points', () => {
    let total = 0;
    for (const card of DECK_32) {
      if (card.suit === trumpSuit) {
        total += TRUMP_POINTS[card.rank];
      } else {
        total += PLAIN_POINTS[card.rank];
      }
    }
    expect(total).toBe(152);
  });

  it('trump suit cards sum to 62 points', () => {
    const trumpCards = DECK_32.filter((c) => c.suit === trumpSuit);
    const total = trumpCards.reduce((sum, card) => sum + TRUMP_POINTS[card.rank], 0);
    expect(total).toBe(62);
  });

  it('each non-trump suit sums to 30 points', () => {
    for (const suit of [Suit.Spades, Suit.Diamonds, Suit.Clubs]) {
      const suitCards = DECK_32.filter((c) => c.suit === suit);
      const total = suitCards.reduce((sum, card) => sum + PLAIN_POINTS[card.rank], 0);
      expect(total).toBe(30);
    }
  });
});

describe('calculateTrickPoints', () => {
  it('correctly sums points won by each team', () => {
    const tricks: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Spades, Rank.Ten) }, // 10
          { seat: Seat.South, card: c(Suit.Spades, Rank.King) }, // 4
          { seat: Seat.West, card: c(Suit.Spades, Rank.Seven) }, // 0
        ],
        Seat.North, // North wins -> team1
      ),
    ];
    const result = calculateTrickPoints(tricks, trumpSuit);
    expect(result.team1).toBe(25); // 11+10+4+0
    expect(result.team2).toBe(0);
  });

  it('splits points across teams correctly', () => {
    const tricks: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) },
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) },
          { seat: Seat.South, card: c(Suit.Spades, Rank.Eight) },
          { seat: Seat.West, card: c(Suit.Spades, Rank.Nine) },
        ],
        Seat.North, // team1 wins: 11+0+0+0 = 11
      ),
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Diamonds, Rank.Ace) },
          { seat: Seat.South, card: c(Suit.Diamonds, Rank.Seven) },
          { seat: Seat.West, card: c(Suit.Diamonds, Rank.Ten) },
          { seat: Seat.North, card: c(Suit.Diamonds, Rank.Eight) },
        ],
        Seat.East, // team2 wins (East): 11+0+10+0 = 21
      ),
    ];
    const result = calculateTrickPoints(tricks, trumpSuit);
    expect(result.team1).toBe(11);
    expect(result.team2).toBe(21);
  });
});

describe('hasBelote', () => {
  it('returns true when hand contains King and Queen of trump', () => {
    const hand = [
      c(trumpSuit, Rank.King),
      c(trumpSuit, Rank.Queen),
      c(Suit.Spades, Rank.Ace),
    ];
    expect(hasBelote(hand, trumpSuit)).toBe(true);
  });

  it('returns false when missing Queen of trump', () => {
    const hand = [
      c(trumpSuit, Rank.King),
      c(trumpSuit, Rank.Jack),
      c(Suit.Spades, Rank.Queen),
    ];
    expect(hasBelote(hand, trumpSuit)).toBe(false);
  });

  it('returns false when missing King of trump', () => {
    const hand = [
      c(trumpSuit, Rank.Queen),
      c(trumpSuit, Rank.Jack),
      c(Suit.Spades, Rank.King),
    ];
    expect(hasBelote(hand, trumpSuit)).toBe(false);
  });

  it('returns false when King and Queen are of different (non-trump) suit', () => {
    const hand = [
      c(Suit.Spades, Rank.King),
      c(Suit.Spades, Rank.Queen),
    ];
    expect(hasBelote(hand, trumpSuit)).toBe(false);
  });
});

describe('isCapot', () => {
  it('returns true when a team wins all tricks', () => {
    const tricks: Trick[] = Array.from({ length: 8 }, (_, i) =>
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) },
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) },
          { seat: Seat.South, card: c(Suit.Spades, Rank.Eight) },
          { seat: Seat.West, card: c(Suit.Spades, Rank.Nine) },
        ],
        Seat.North, // all won by North = team1
      ),
    );
    expect(isCapot(tricks, TeamId.Team1)).toBe(true);
    expect(isCapot(tricks, TeamId.Team2)).toBe(false);
  });

  it('returns false when other team wins at least one trick', () => {
    const tricks: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) },
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) },
          { seat: Seat.South, card: c(Suit.Spades, Rank.Eight) },
          { seat: Seat.West, card: c(Suit.Spades, Rank.Nine) },
        ],
        Seat.North,
      ),
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Diamonds, Rank.Ace) },
          { seat: Seat.South, card: c(Suit.Diamonds, Rank.Seven) },
          { seat: Seat.West, card: c(Suit.Diamonds, Rank.Eight) },
          { seat: Seat.North, card: c(Suit.Diamonds, Rank.Nine) },
        ],
        Seat.East, // team2 wins this one
      ),
    ];
    expect(isCapot(tricks, TeamId.Team1)).toBe(false);
  });
});

describe('calculateRoundScore', () => {
  function makeContract(
    team: TeamId,
    points: number,
    suit: Suit = trumpSuit,
    contred = false,
    surcontred = false,
  ): Contract {
    return {
      bid: { playerId: 'p1', points: points as any, suit },
      team,
      contred,
      surcontred,
    };
  }

  // Helper: create a set of 8 tricks where team1 wins all with known points
  function makeAllTricksForTeam1(): Trick[] {
    // Build 8 tricks all won by North (team1).
    // We need card points to sum to 152 total.
    // Just use simple tricks where team1 wins everything.
    return Array.from({ length: 8 }, (_, i) =>
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Seven) },
          { seat: Seat.East, card: c(Suit.Clubs, Rank.Seven) },
          { seat: Seat.South, card: c(Suit.Diamonds, Rank.Seven) },
          { seat: Seat.West, card: c(Suit.Clubs, Rank.Eight) },
        ],
        Seat.North,
      ),
    );
  }

  it('last trick bonus of 10 goes to team winning the last trick', () => {
    const tricks: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) },
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) },
          { seat: Seat.South, card: c(Suit.Spades, Rank.Eight) },
          { seat: Seat.West, card: c(Suit.Spades, Rank.Nine) },
        ],
        Seat.East, // team2 wins last trick
      ),
    ];
    const contract = makeContract(TeamId.Team1, 80);
    const score = calculateRoundScore(tricks, contract, null);
    expect(score.lastTrickBonus.team2).toBe(10);
    expect(score.lastTrickBonus.team1).toBe(0);
  });

  it('contract met: each team keeps their points', () => {
    // Team1 attacks at 80. Team1 wins 2 tricks, team2 wins 1 trick (not capot).
    const tricks: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Spades, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Spades, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21 pts
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Jack) }, // 20
          { seat: Seat.East, card: c(trumpSuit, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Nine) }, // 14
          { seat: Seat.West, card: c(trumpSuit, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 34 pts
      ),
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Diamonds, Rank.Ace) }, // 11
          { seat: Seat.South, card: c(Suit.Diamonds, Rank.Seven) }, // 0
          { seat: Seat.West, card: c(Suit.Diamonds, Rank.Ten) }, // 10
          { seat: Seat.North, card: c(Suit.Diamonds, Rank.Eight) }, // 0
        ],
        Seat.East, // team2: 21 pts (last trick, so team2 gets +10 bonus)
      ),
    ];
    // Team1 trick pts: 21+34 = 55, last bonus: 0 -> raw: 55
    // Team2 trick pts: 21, last bonus: 10 -> raw: 31
    // But wait, contract is 80 and team1 raw is 55 < 80, contract fails.
    // Let me increase team1 points:
    const tricks2: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Spades, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Spades, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21 pts
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Jack) }, // 20
          { seat: Seat.East, card: c(trumpSuit, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Nine) }, // 14
          { seat: Seat.West, card: c(trumpSuit, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 34 pts
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Clubs, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Clubs, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21 pts
      ),
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Diamonds, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Diamonds, Rank.Eight) }, // 0
          { seat: Seat.West, card: c(Suit.Diamonds, Rank.Nine) }, // 0
          { seat: Seat.North, card: c(Suit.Diamonds, Rank.Ace) }, // 11 (not trump)
        ],
        Seat.East, // team2 led but North wins with Ace (plain: Ace>9>8>7)
      ),
    ];
    // Wait, the winner should be determined by determineTrickWinner, but we pass it explicitly.
    // North wins trick 4 with Ace. Actually our completedTrick takes the winner explicitly.
    // Let's keep it simple: team1 wins tricks 1-3, team2 wins trick 4 (last).
    const tricks3: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Spades, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Spades, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21 pts
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Jack) }, // 20
          { seat: Seat.East, card: c(trumpSuit, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Nine) }, // 14
          { seat: Seat.West, card: c(trumpSuit, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 34 pts
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Clubs, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Clubs, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21 pts
      ),
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Diamonds, Rank.Ace) }, // 11
          { seat: Seat.South, card: c(Suit.Diamonds, Rank.Seven) }, // 0
          { seat: Seat.West, card: c(Suit.Diamonds, Rank.Ten) }, // 10
          { seat: Seat.North, card: c(Suit.Diamonds, Rank.Eight) }, // 0
        ],
        Seat.East, // team2: 21 pts (last trick)
      ),
    ];
    // Team1 trick pts: 21+34+21 = 76, last bonus: 0, raw: 76
    // Team2 trick pts: 21, last bonus: 10, raw: 31
    // 76 >= 80? No -> fails. Need more.
    // Let me just add one more big trick for team1:
    const tricks4: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Spades, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Spades, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21 pts
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Jack) }, // 20
          { seat: Seat.East, card: c(trumpSuit, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Nine) }, // 14
          { seat: Seat.West, card: c(trumpSuit, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 34 pts
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Clubs, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Clubs, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21 pts
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Diamonds, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Diamonds, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Diamonds, Rank.King) }, // 4
          { seat: Seat.West, card: c(Suit.Diamonds, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 15 pts
      ),
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Clubs, Rank.Ace) }, // 11
          { seat: Seat.South, card: c(Suit.Clubs, Rank.Nine) }, // 0
          { seat: Seat.West, card: c(Suit.Clubs, Rank.Ten) }, // 10
          { seat: Seat.North, card: c(Suit.Clubs, Rank.King) }, // 4
        ],
        Seat.East, // team2: 25 pts (last trick)
      ),
    ];
    // Team1 trick pts: 21+34+21+15+4 = 95, team2 trick pts: 21, hmm wait:
    // Trick 5: East wins, cards are Ace(11)+Nine(0)+Ten(10)+King(4) = 25.
    // But North played King in trick 5 -> goes to team2? No, team for North = team1.
    // The sum per trick goes to the winner's team. East(team2) wins trick 5.
    // So all card points in trick 5 (25) go to team2.
    // Team1 trick pts: 21+34+21+15 = 91
    // Team2 trick pts: 25
    // Team1 last bonus: 0 (East won last trick), team2 last bonus: 10
    // Team1 raw: 91, team2 raw: 35
    // 91 >= 80 -> contract met
    const contract4 = makeContract(TeamId.Team1, 80);
    const score4 = calculateRoundScore(tricks4, contract4, null);
    expect(score4.contractMet).toBe(true);
    expect(score4.trickPoints.team1).toBe(91);
    expect(score4.trickPoints.team2).toBe(25);
    expect(score4.finalScore.team1).toBe(91); // 91*1 + 0 last bonus
    expect(score4.finalScore.team2).toBe(35); // 25*1 + 10 last bonus
  });

  it('contract failed: defender gets 162, attacker gets 0', () => {
    // Team1 attacks at 100 but only gets 80 points
    const tricks: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Spades, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Spades, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21 pts
      ),
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Diamonds, Rank.Ace) }, // 11
          { seat: Seat.South, card: c(Suit.Diamonds, Rank.Seven) }, // 0
          { seat: Seat.West, card: c(Suit.Diamonds, Rank.Ten) }, // 10
          { seat: Seat.North, card: c(Suit.Diamonds, Rank.Eight) }, // 0
        ],
        Seat.East, // team2: 21 pts (last trick)
      ),
    ];
    // Team1 trick pts: 21, last trick bonus: 0 (East won last trick)
    // Team1 raw: 21, which is < 100 -> contract failed
    const contract = makeContract(TeamId.Team1, 100);
    const score = calculateRoundScore(tricks, contract, null);
    expect(score.contractMet).toBe(false);
    expect(score.finalScore.team1).toBe(0); // attacker gets nothing
    expect(score.finalScore.team2).toBe(162); // defender gets 162
  });

  it('belote bonus (20 points) always counts, even on failed contract', () => {
    const tricks: Trick[] = [
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Spades, Rank.Ace) },
          { seat: Seat.South, card: c(Suit.Spades, Rank.Seven) },
          { seat: Seat.West, card: c(Suit.Spades, Rank.Ten) },
          { seat: Seat.North, card: c(Suit.Spades, Rank.Eight) },
        ],
        Seat.East, // team2 wins everything
      ),
    ];
    // Team1 attacks, fails (0 trick points < 80)
    const contract = makeContract(TeamId.Team1, 80);
    const score = calculateRoundScore(tricks, contract, TeamId.Team1);
    expect(score.contractMet).toBe(false);
    expect(score.belote.team1).toBe(20);
    // Attacker keeps belote even on failure
    expect(score.finalScore.team1).toBe(20);
    // Defender gets 162 + their own belote (0)
    expect(score.finalScore.team2).toBe(162);
  });

  it('belote bonus goes to defending team when they hold it', () => {
    const tricks: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) },
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) },
          { seat: Seat.South, card: c(Suit.Spades, Rank.King) },
          { seat: Seat.West, card: c(Suit.Spades, Rank.Eight) },
        ],
        Seat.North,
      ),
    ];
    // Team1 attacks at 80, gets 25 trick pts + 10 last = 35 (fails)
    // Team2 has belote
    const contract = makeContract(TeamId.Team1, 80);
    const score = calculateRoundScore(tricks, contract, TeamId.Team2);
    expect(score.belote.team2).toBe(20);
    expect(score.finalScore.team2).toBe(162 + 20); // 162 from failed contract + 20 belote
  });

  it('contrer doubles the scores', () => {
    // Team1 attacks at 80 contred. Team1 wins 3 tricks, team2 wins 1 (not capot).
    const tricks: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Spades, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Spades, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Jack) }, // 20
          { seat: Seat.East, card: c(trumpSuit, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Nine) }, // 14
          { seat: Seat.West, card: c(trumpSuit, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 34
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Clubs, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Clubs, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21
      ),
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Diamonds, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Diamonds, Rank.Eight) }, // 0
          { seat: Seat.West, card: c(Suit.Diamonds, Rank.Nine) }, // 0
          { seat: Seat.North, card: c(Suit.Diamonds, Rank.Jack) }, // 2
        ],
        Seat.East, // team2: 2 (last trick)
      ),
    ];
    // team1 trick pts: 21+34+21 = 76, team2 trick pts: 2
    // team1 last bonus: 0, team2 last bonus: 10
    // team1 raw: 76, team2 raw: 12
    // 76 >= 80? No -> fails with contrer
    // Need to use lower contract or add more points to team1
    // Let me just test with tricks where team1 gets 86 raw:
    const tricks2: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Spades, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Spades, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Jack) }, // 20
          { seat: Seat.East, card: c(trumpSuit, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Nine) }, // 14
          { seat: Seat.West, card: c(trumpSuit, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 34
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Clubs, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Clubs, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Diamonds, Rank.King) }, // 4
          { seat: Seat.East, card: c(Suit.Diamonds, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Diamonds, Rank.Queen) }, // 3
          { seat: Seat.West, card: c(Suit.Diamonds, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 7 (last trick -> +10 bonus)
      ),
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Clubs, Rank.Nine) }, // 0
          { seat: Seat.South, card: c(Suit.Clubs, Rank.Jack) }, // 2
          { seat: Seat.West, card: c(Suit.Clubs, Rank.Queen) }, // 3
          { seat: Seat.North, card: c(Suit.Clubs, Rank.King) }, // 4
        ],
        Seat.West, // team2: 9 (last trick -> team2 gets +10 bonus)
      ),
    ];
    // team1 trick pts: 21+34+21+7 = 83, team2 trick pts: 9
    // team2 won last trick -> team2 last bonus: 10
    // team1 raw: 83, team2 raw: 19
    // 83 >= 80 -> contract met (not capot since team2 won trick 5)
    const contract = makeContract(TeamId.Team1, 80, trumpSuit, true, false);
    const score = calculateRoundScore(tricks2, contract, null);
    expect(score.contractMet).toBe(true);
    expect(score.contreMultiplier).toBe(2);
    expect(score.finalScore.team1).toBe(83 * 2); // 166
    expect(score.finalScore.team2).toBe(19 * 2); // 38
  });

  it('surcontrer quadruples the scores', () => {
    // Same setup as contrer test but with surcontrer
    const tricks: Trick[] = [
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Spades, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Spades, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Spades, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Spades, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Jack) }, // 20
          { seat: Seat.East, card: c(trumpSuit, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Nine) }, // 14
          { seat: Seat.West, card: c(trumpSuit, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 34
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(trumpSuit, Rank.Ace) }, // 11
          { seat: Seat.East, card: c(Suit.Clubs, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(trumpSuit, Rank.Ten) }, // 10
          { seat: Seat.West, card: c(Suit.Clubs, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 21
      ),
      completedTrick(
        [
          { seat: Seat.North, card: c(Suit.Diamonds, Rank.King) }, // 4
          { seat: Seat.East, card: c(Suit.Diamonds, Rank.Seven) }, // 0
          { seat: Seat.South, card: c(Suit.Diamonds, Rank.Queen) }, // 3
          { seat: Seat.West, card: c(Suit.Diamonds, Rank.Eight) }, // 0
        ],
        Seat.North, // team1: 7
      ),
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Clubs, Rank.Nine) }, // 0
          { seat: Seat.South, card: c(Suit.Clubs, Rank.Jack) }, // 2
          { seat: Seat.West, card: c(Suit.Clubs, Rank.Queen) }, // 3
          { seat: Seat.North, card: c(Suit.Clubs, Rank.King) }, // 4
        ],
        Seat.West, // team2: 9 (last trick -> +10 bonus)
      ),
    ];
    // team1 trick pts: 83, team2 trick pts: 9
    // team1 raw: 83, team2 raw: 19
    const contract = makeContract(TeamId.Team1, 80, trumpSuit, true, true);
    const score = calculateRoundScore(tricks, contract, null);
    expect(score.contractMet).toBe(true);
    expect(score.contreMultiplier).toBe(4);
    expect(score.finalScore.team1).toBe(83 * 4); // 332
    expect(score.finalScore.team2).toBe(19 * 4); // 76
  });

  it('failed contract with contrer gives defender 162 * 2', () => {
    const tricks: Trick[] = [
      completedTrick(
        [
          { seat: Seat.East, card: c(Suit.Spades, Rank.Ace) },
          { seat: Seat.South, card: c(Suit.Spades, Rank.Seven) },
          { seat: Seat.West, card: c(Suit.Spades, Rank.Ten) },
          { seat: Seat.North, card: c(Suit.Spades, Rank.Eight) },
        ],
        Seat.East,
      ),
    ];
    // Team1 attacks at 80 contred, gets 0 trick pts -> fails
    const contract = makeContract(TeamId.Team1, 80, trumpSuit, true, false);
    const score = calculateRoundScore(tricks, contract, null);
    expect(score.contractMet).toBe(false);
    expect(score.finalScore.team1).toBe(0);
    expect(score.finalScore.team2).toBe(162 * 2); // 324
  });
});
