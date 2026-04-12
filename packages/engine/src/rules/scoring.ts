import type { Card, Suit } from '../domain/card.js';
import { Rank } from '../domain/card.js';
import type { Trick } from '../domain/trick.js';
import type { Contract } from '../domain/contract.js';
import type { RoundScore } from '../domain/round.js';
import { TeamId, oppositeTeam, teamForSeat } from '../domain/team.js';
import { contreMultiplier } from '../domain/contract.js';
import { cardPoints } from './trump.js';
import { determineTrickWinner } from './trick-winner.js';

const LAST_TRICK_BONUS = 10;
const BELOTE_BONUS = 20;
const TOTAL_CARD_POINTS = 152;

/** Calculate points won by each team from tricks */
export function calculateTrickPoints(
  tricks: readonly Trick[],
  trumpSuit: Suit,
): { team1: number; team2: number } {
  const points = { team1: 0, team2: 0 };

  for (const trick of tricks) {
    const winner = trick.winner ?? determineTrickWinner(trick, trumpSuit);
    const team = teamForSeat(winner);
    const trickPts = trick.cards.reduce((sum, tc) => sum + cardPoints(tc.card, trumpSuit), 0);
    points[team] += trickPts;
  }

  return points;
}

/** Check if a player holds belote (King + Queen of trump) */
export function hasBelote(hand: readonly Card[], trumpSuit: Suit): boolean {
  const hasKing = hand.some((c) => c.suit === trumpSuit && c.rank === Rank.King);
  const hasQueen = hand.some((c) => c.suit === trumpSuit && c.rank === Rank.Queen);
  return hasKing && hasQueen;
}

/** Calculate the last trick bonus (dix de der) */
function lastTrickBonus(tricks: readonly Trick[]): { team1: number; team2: number } {
  const lastTrick = tricks[tricks.length - 1];
  if (!lastTrick?.winner) return { team1: 0, team2: 0 };

  const team = teamForSeat(lastTrick.winner);
  return {
    team1: team === TeamId.Team1 ? LAST_TRICK_BONUS : 0,
    team2: team === TeamId.Team2 ? LAST_TRICK_BONUS : 0,
  };
}

/** Check if a team won all 8 tricks (capot) */
export function isCapot(tricks: readonly Trick[], team: TeamId): boolean {
  return tricks.every((t) => t.winner && teamForSeat(t.winner) === team);
}

/**
 * Calculate the full round score.
 *
 * Scoring rules:
 * - Count card points per team (total 152)
 * - Add 10 for last trick (dix de der) → total 162
 * - Add 20 for belote-rebelote if applicable
 * - Check if contract is met
 * - If met: attacking team scores their points, defending team scores theirs
 * - If not met: attacking team scores 0, defending team scores 162
 * - Multiply by contre/surcontre factor
 * - Belote-rebelote always counts (even on failed contract)
 */
export function calculateRoundScore(
  tricks: readonly Trick[],
  contract: Contract,
  beloteTeam: TeamId | null,
): RoundScore {
  const trumpSuit = contract.bid.suit;
  const attackingTeam = contract.team;
  const defendingTeam = oppositeTeam(attackingTeam);
  const multiplier = contreMultiplier(contract);

  const trickPoints = calculateTrickPoints(tricks, trumpSuit);
  const lastBonus = lastTrickBonus(tricks);
  const belote = {
    team1: beloteTeam === TeamId.Team1 ? BELOTE_BONUS : 0,
    team2: beloteTeam === TeamId.Team2 ? BELOTE_BONUS : 0,
  };

  // Total points earned (tricks + last trick bonus, without belote for contract check)
  const attackerRawPoints = trickPoints[attackingTeam] + lastBonus[attackingTeam];
  const contractMet = attackerRawPoints >= contract.bid.points;

  // Check for capot
  const attackerCapot = isCapot(tricks, attackingTeam);

  let finalScore: { team1: number; team2: number };

  if (contractMet) {
    // Contract met: each team scores their own points
    const team1Raw = trickPoints.team1 + lastBonus.team1;
    const team2Raw = trickPoints.team2 + lastBonus.team2;

    finalScore = {
      team1: team1Raw * multiplier + belote.team1,
      team2: team2Raw * multiplier + belote.team2,
    };

    // Capot bonus: if attacker wins all tricks without bidding capot
    if (attackerCapot && contract.bid.points < 250) {
      finalScore[attackingTeam] += 100 * multiplier;
    }
  } else {
    // Contract failed: defender gets 162 points, attacker gets 0
    finalScore = {
      team1:
        attackingTeam === TeamId.Team1
          ? belote.team1 // Attacker only keeps belote
          : (TOTAL_CARD_POINTS + LAST_TRICK_BONUS) * multiplier + belote.team1,
      team2:
        attackingTeam === TeamId.Team2
          ? belote.team2
          : (TOTAL_CARD_POINTS + LAST_TRICK_BONUS) * multiplier + belote.team2,
    };
  }

  return {
    trickPoints,
    lastTrickBonus: lastBonus,
    belote,
    contractMet,
    contreMultiplier: multiplier,
    finalScore,
  };
}
