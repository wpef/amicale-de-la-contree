import { cardId } from '../domain/card.js';
import { getPlayableCards } from '../rules/play-validation.js';
/**
 * Project the full game state for a specific player.
 * Only reveals the player's own hand; other hands are hidden.
 */
export function projectState(state, playerId) {
    const player = state.players[playerId];
    if (!player) {
        throw new Error(`Player ${playerId} not found in game`);
    }
    const mySeat = player.seat;
    const myHand = state.hands[mySeat] ?? [];
    // Calculate playable cards
    let playableCards = [];
    if (state.phase === 'playing' &&
        state.currentPlayer === mySeat &&
        state.currentTrick &&
        state.contract) {
        const playable = getPlayableCards(myHand, state.currentTrick, state.contract.bid.suit, mySeat);
        playableCards = playable.map(cardId);
    }
    // Project players (hide hands, show card counts)
    const players = Object.values(state.players).map((p) => ({
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
    const lastTrick = state.tricks.length > 0
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
            const team = trick.winner === 'north' || trick.winner === 'south' ? 'team1' : 'team2';
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
//# sourceMappingURL=state-projection.js.map