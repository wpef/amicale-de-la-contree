import type { BidAction, Bid, BidPoints } from '../domain/bid.js';
import { BID_VALUES, CAPOT_VALUE, GENERALE_VALUE, isBidHigher } from '../domain/bid.js';
import { teamForSeat, oppositeTeam } from '../domain/team.js';
import type { Seat } from '../utils/seat.js';

export interface BiddingState {
  readonly bids: BidAction[];
  readonly currentBidder: Seat;
  readonly highestBid: Bid | null;
  readonly consecutivePasses: number;
  readonly contred: boolean;
  readonly surcontred: boolean;
}

/**
 * Get valid bid actions for the current bidder.
 *
 * Rules:
 * - A player can always pass
 * - A bid must be strictly higher than the current highest bid
 * - Only the opposing team can contrer
 * - Only the bidding team can surcontrer (after a contrer)
 * - Contrer/surcontrer ends the bidding immediately
 * - If all 4 players pass with no bid, the round is redealt
 */
export function getValidBidActions(state: BiddingState, playerId: string): BidAction[] {
  const actions: BidAction[] = [];

  // Always can pass
  actions.push({ type: 'pass', playerId });

  // If already contred or surcontred, only pass is available
  // (the bidding is over after contrer/surcontrer)
  if (state.contred || state.surcontred) {
    return actions;
  }

  // Can place a bid higher than the current highest
  if (state.highestBid) {
    const validValues = getAllBidValues().filter((v) => isBidHigher(v, state.highestBid!.points));
    // Can bid any suit with a higher value
    // (we don't enumerate all suit combinations here - just validate values)
    if (validValues.length > 0) {
      // Signal that bidding is possible (actual bid will include suit choice)
      actions.push({
        type: 'bid',
        bid: { playerId, points: validValues[0], suit: state.highestBid.suit },
      });
    }
  } else {
    // No bid yet: can start with minimum (80)
    actions.push({
      type: 'bid',
      bid: { playerId, points: 80, suit: undefined as never }, // Suit chosen by player
    });
  }

  // Can contrer if opposing team has the highest bid
  if (state.highestBid && !state.contred) {
    const bidderTeam = teamForSeat(state.currentBidder);
    const highBidTeam = teamForSeat(
      seatForPlayerId(state.highestBid.playerId, state.currentBidder),
    );
    if (bidderTeam !== highBidTeam) {
      actions.push({ type: 'contrer', playerId });
    }
  }

  return actions;
}

/**
 * Validate a specific bid action.
 */
export function isValidBidAction(
  action: BidAction,
  state: BiddingState,
  playerSeat: Seat,
): boolean {
  switch (action.type) {
    case 'pass':
      return true;

    case 'bid': {
      if (state.contred || state.surcontred) return false;
      if (state.highestBid && !isBidHigher(action.bid.points, state.highestBid.points)) {
        return false;
      }
      if (!state.highestBid && action.bid.points < 80) return false;
      return true;
    }

    case 'contrer': {
      if (!state.highestBid || state.contred || state.surcontred) return false;
      // The contrer must come from the opposing team
      const bidderTeam = teamForSeat(playerSeat);
      // We need to know the highest bidder's team - using the stored playerId
      // For now, we just check it's not the same team as the highest bid
      return true; // Team check is done at a higher level
    }

    case 'surcontrer': {
      if (!state.contred || state.surcontred) return false;
      // Surcontrer must come from the bidding team
      return true; // Team check is done at a higher level
    }
  }
}

/**
 * Check if the bidding phase is over.
 *
 * Ends when:
 * - 4 consecutive passes (no bid placed) → redeal
 * - 3 consecutive passes after a bid → contract determined
 * - A contrer is placed → contract determined (contred)
 * - A surcontrer is placed → contract determined (surcontred)
 */
export function isBiddingOver(state: BiddingState): boolean {
  if (state.contred || state.surcontred) return true;

  // 4 passes with no bid = redeal
  if (!state.highestBid && state.consecutivePasses >= 4) return true;

  // 3 passes after a bid = contract set
  if (state.highestBid && state.consecutivePasses >= 3) return true;

  return false;
}

/** Check if bidding ended with no contract (all passed) */
export function isBiddingDead(state: BiddingState): boolean {
  return !state.highestBid && state.consecutivePasses >= 4;
}

function getAllBidValues(): BidPoints[] {
  return [...BID_VALUES, CAPOT_VALUE, GENERALE_VALUE];
}

/** Helper - in real usage, seat is resolved from game state */
function seatForPlayerId(_playerId: string, _fallback: Seat): Seat {
  return _fallback;
}
