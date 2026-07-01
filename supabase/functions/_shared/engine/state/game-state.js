export function createInitialState(id, roomCode) {
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
        hands: {},
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
//# sourceMappingURL=game-state.js.map