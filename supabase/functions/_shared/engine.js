// packages/engine/dist/domain/card.js
var Suit;
(function(Suit2) {
  Suit2["Spades"] = "spades";
  Suit2["Hearts"] = "hearts";
  Suit2["Diamonds"] = "diamonds";
  Suit2["Clubs"] = "clubs";
})(Suit || (Suit = {}));
var Rank;
(function(Rank2) {
  Rank2["Seven"] = "7";
  Rank2["Eight"] = "8";
  Rank2["Nine"] = "9";
  Rank2["Ten"] = "10";
  Rank2["Jack"] = "J";
  Rank2["Queen"] = "Q";
  Rank2["King"] = "K";
  Rank2["Ace"] = "A";
})(Rank || (Rank = {}));
function cardId(card) {
  return `${card.suit}-${card.rank}`;
}
function parseCardId(id) {
  const [suit, rank] = id.split("-");
  return { suit, rank };
}
function cardEquals(a, b) {
  return a.suit === b.suit && a.rank === b.rank;
}
var ALL_SUITS = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
var ALL_RANKS = [
  Rank.Seven,
  Rank.Eight,
  Rank.Nine,
  Rank.Ten,
  Rank.Jack,
  Rank.Queen,
  Rank.King,
  Rank.Ace
];
var DECK_32 = ALL_SUITS.flatMap((suit) => ALL_RANKS.map((rank) => ({ suit, rank })));
var SUIT_NAMES_FR = {
  [Suit.Spades]: "Pique",
  [Suit.Hearts]: "Coeur",
  [Suit.Diamonds]: "Carreau",
  [Suit.Clubs]: "Trefle"
};
var RANK_NAMES_FR = {
  [Rank.Seven]: "7",
  [Rank.Eight]: "8",
  [Rank.Nine]: "9",
  [Rank.Ten]: "10",
  [Rank.Jack]: "Valet",
  [Rank.Queen]: "Dame",
  [Rank.King]: "Roi",
  [Rank.Ace]: "As"
};
var SUIT_SYMBOLS = {
  [Suit.Spades]: "\u2660",
  [Suit.Hearts]: "\u2665",
  [Suit.Diamonds]: "\u2666",
  [Suit.Clubs]: "\u2663"
};
var SUIT_ORDER = {
  [Suit.Spades]: 0,
  [Suit.Hearts]: 1,
  [Suit.Diamonds]: 2,
  [Suit.Clubs]: 3
};
var TRUMP_RANK_ORDER = {
  [Rank.Seven]: 0,
  [Rank.Eight]: 1,
  [Rank.Queen]: 2,
  [Rank.King]: 3,
  [Rank.Ten]: 4,
  [Rank.Ace]: 5,
  [Rank.Nine]: 6,
  [Rank.Jack]: 7
};
var PLAIN_RANK_ORDER = {
  [Rank.Seven]: 0,
  [Rank.Eight]: 1,
  [Rank.Nine]: 2,
  [Rank.Jack]: 3,
  [Rank.Queen]: 4,
  [Rank.Ten]: 5,
  [Rank.King]: 6,
  [Rank.Ace]: 7
};
function sortHand(cards, trumpSuit) {
  return [...cards].sort((a, b) => {
    const suitA = trumpSuit && a.suit === trumpSuit ? 99 : SUIT_ORDER[a.suit];
    const suitB = trumpSuit && b.suit === trumpSuit ? 99 : SUIT_ORDER[b.suit];
    if (suitA !== suitB)
      return suitA - suitB;
    const rankOrder = trumpSuit && a.suit === trumpSuit ? TRUMP_RANK_ORDER : PLAIN_RANK_ORDER;
    return rankOrder[b.rank] - rankOrder[a.rank];
  });
}

// packages/engine/dist/domain/deck.js
function shuffle(cards) {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function deal(shuffledDeck) {
  if (shuffledDeck.length !== 32) {
    throw new Error(`Expected 32 cards, got ${shuffledDeck.length}`);
  }
  const hands = [[], [], [], []];
  let idx = 0;
  for (let player = 0; player < 4; player++) {
    for (let c = 0; c < 3; c++) {
      hands[player].push(shuffledDeck[idx++]);
    }
  }
  for (let player = 0; player < 4; player++) {
    for (let c = 0; c < 2; c++) {
      hands[player].push(shuffledDeck[idx++]);
    }
  }
  for (let player = 0; player < 4; player++) {
    for (let c = 0; c < 3; c++) {
      hands[player].push(shuffledDeck[idx++]);
    }
  }
  return hands;
}
function createShuffledDeck() {
  return shuffle(DECK_32);
}

// packages/engine/dist/utils/seat.js
var Seat;
(function(Seat2) {
  Seat2["North"] = "north";
  Seat2["East"] = "east";
  Seat2["South"] = "south";
  Seat2["West"] = "west";
})(Seat || (Seat = {}));
var SEAT_ORDER = [Seat.North, Seat.East, Seat.South, Seat.West];
function nextSeat(seat) {
  const idx = SEAT_ORDER.indexOf(seat);
  return SEAT_ORDER[(idx + 1) % 4];
}
function partnerSeat(seat) {
  const idx = SEAT_ORDER.indexOf(seat);
  return SEAT_ORDER[(idx + 2) % 4];
}
function seatsFrom(start) {
  const idx = SEAT_ORDER.indexOf(start);
  return [
    SEAT_ORDER[idx],
    SEAT_ORDER[(idx + 1) % 4],
    SEAT_ORDER[(idx + 2) % 4],
    SEAT_ORDER[(idx + 3) % 4]
  ];
}
function arePartners(a, b) {
  return partnerSeat(a) === b;
}

// packages/engine/dist/domain/team.js
var TeamId;
(function(TeamId2) {
  TeamId2["Team1"] = "team1";
  TeamId2["Team2"] = "team2";
})(TeamId || (TeamId = {}));
function teamForSeat(seat) {
  return seat === Seat.North || seat === Seat.South ? TeamId.Team1 : TeamId.Team2;
}
function oppositeTeam(team) {
  return team === TeamId.Team1 ? TeamId.Team2 : TeamId.Team1;
}

// packages/engine/dist/domain/bid.js
var BID_VALUES = [80, 90, 100, 110, 120, 130, 140, 150, 160];
var CAPOT_VALUE = 250;
var GENERALE_VALUE = 500;
function isBidHigher(newBid, currentBid) {
  return newBid > currentBid;
}

// packages/engine/dist/domain/contract.js
function contreMultiplier(contract) {
  if (contract.surcontred)
    return 4;
  if (contract.contred)
    return 2;
  return 1;
}

// packages/engine/dist/domain/trick.js
function createTrick(number, leader) {
  return { number, cards: [], leader };
}
function isTrickComplete(trick) {
  return trick.cards.length === 4;
}
function trickLeadSuit(trick) {
  return trick.cards.length > 0 ? trick.cards[0].card.suit : void 0;
}

// packages/engine/dist/rules/trump.js
var TRUMP_POINTS = {
  [Rank.Seven]: 0,
  [Rank.Eight]: 0,
  [Rank.Nine]: 14,
  [Rank.Ten]: 10,
  [Rank.Jack]: 20,
  [Rank.Queen]: 3,
  [Rank.King]: 4,
  [Rank.Ace]: 11
};
var PLAIN_POINTS = {
  [Rank.Seven]: 0,
  [Rank.Eight]: 0,
  [Rank.Nine]: 0,
  [Rank.Ten]: 10,
  [Rank.Jack]: 2,
  [Rank.Queen]: 3,
  [Rank.King]: 4,
  [Rank.Ace]: 11
};
var TRUMP_STRENGTH = {
  [Rank.Seven]: 0,
  [Rank.Eight]: 1,
  [Rank.Nine]: 6,
  // 9 d'atout = 2nd strongest
  [Rank.Ten]: 4,
  [Rank.Jack]: 7,
  // Valet d'atout = strongest
  [Rank.Queen]: 2,
  [Rank.King]: 3,
  [Rank.Ace]: 5
};
var PLAIN_STRENGTH = {
  [Rank.Seven]: 0,
  [Rank.Eight]: 1,
  [Rank.Nine]: 2,
  [Rank.Ten]: 5,
  [Rank.Jack]: 3,
  [Rank.Queen]: 4,
  [Rank.King]: 6,
  [Rank.Ace]: 7
};
function cardStrength(card, trumpSuit) {
  if (card.suit === trumpSuit) {
    return TRUMP_STRENGTH[card.rank];
  }
  return PLAIN_STRENGTH[card.rank];
}
function cardPoints(card, trumpSuit) {
  if (card.suit === trumpSuit) {
    return TRUMP_POINTS[card.rank];
  }
  return PLAIN_POINTS[card.rank];
}
function compareCards(a, b, trumpSuit) {
  return cardStrength(a, trumpSuit) - cardStrength(b, trumpSuit);
}
function isTrump(card, trumpSuit) {
  return card.suit === trumpSuit;
}

// packages/engine/dist/rules/play-validation.js
function getPlayableCards(hand, trick, trumpSuit, playerSeat) {
  if (trick.cards.length === 0) {
    return [...hand];
  }
  const leadSuit = trick.cards[0].card.suit;
  const cardsOfLeadSuit = hand.filter((c) => c.suit === leadSuit);
  const trumpCards = hand.filter((c) => isTrump(c, trumpSuit));
  if (cardsOfLeadSuit.length > 0) {
    if (leadSuit === trumpSuit) {
      return mustGoHigherTrump(cardsOfLeadSuit, trick, trumpSuit);
    }
    return cardsOfLeadSuit;
  }
  const partnerWinning = isPartnerWinning(trick, trumpSuit, playerSeat);
  if (partnerWinning) {
    return [...hand];
  }
  if (trumpCards.length > 0) {
    return mustGoHigherTrump(trumpCards, trick, trumpSuit);
  }
  return [...hand];
}
function mustGoHigherTrump(availableTrumps, trick, trumpSuit) {
  const highestTrumpInTrick = getHighestTrumpStrength(trick, trumpSuit);
  if (highestTrumpInTrick === null) {
    return availableTrumps;
  }
  const higherTrumps = availableTrumps.filter((c) => cardStrength(c, trumpSuit) > highestTrumpInTrick);
  if (higherTrumps.length > 0) {
    return higherTrumps;
  }
  return availableTrumps;
}
function getHighestTrumpStrength(trick, trumpSuit) {
  let highest = null;
  for (const tc of trick.cards) {
    if (isTrump(tc.card, trumpSuit)) {
      const strength = cardStrength(tc.card, trumpSuit);
      if (highest === null || strength > highest) {
        highest = strength;
      }
    }
  }
  return highest;
}
function isPartnerWinning(trick, trumpSuit, playerSeat) {
  if (trick.cards.length === 0)
    return false;
  const partialTrick = {
    ...trick,
    cards: trick.cards
  };
  const currentWinner = determineTrickWinnerPartial(partialTrick, trumpSuit);
  return currentWinner !== null && arePartners(currentWinner, playerSeat);
}
function determineTrickWinnerPartial(trick, trumpSuit) {
  if (trick.cards.length === 0)
    return null;
  const leadSuit = trick.cards[0].card.suit;
  let bestSeat = trick.cards[0].seat;
  let bestIsTrump = isTrump(trick.cards[0].card, trumpSuit);
  let bestStrength = cardStrength(trick.cards[0].card, trumpSuit);
  for (let i = 1; i < trick.cards.length; i++) {
    const tc = trick.cards[i];
    const cardIsTrump = isTrump(tc.card, trumpSuit);
    const strength = cardStrength(tc.card, trumpSuit);
    if (cardIsTrump && !bestIsTrump) {
      bestSeat = tc.seat;
      bestIsTrump = true;
      bestStrength = strength;
    } else if (cardIsTrump && bestIsTrump) {
      if (strength > bestStrength) {
        bestSeat = tc.seat;
        bestStrength = strength;
      }
    } else if (!cardIsTrump && !bestIsTrump && tc.card.suit === leadSuit) {
      if (strength > bestStrength) {
        bestSeat = tc.seat;
        bestStrength = strength;
      }
    }
  }
  return bestSeat;
}
function isCardPlayable(card, hand, trick, trumpSuit, playerSeat) {
  const playable = getPlayableCards(hand, trick, trumpSuit, playerSeat);
  return playable.some((c) => c.suit === card.suit && c.rank === card.rank);
}

// packages/engine/dist/rules/trick-winner.js
function determineTrickWinner(trick, trumpSuit) {
  if (trick.cards.length !== 4) {
    throw new Error(`Trick must have 4 cards, got ${trick.cards.length}`);
  }
  const leadSuit = trick.cards[0].card.suit;
  const trumpCards = trick.cards.filter((tc) => isTrump(tc.card, trumpSuit));
  if (trumpCards.length > 0) {
    return highestCard(trumpCards, trumpSuit);
  }
  const leadSuitCards = trick.cards.filter((tc) => tc.card.suit === leadSuit);
  return highestCard(leadSuitCards, trumpSuit);
}
function highestCard(cards, trumpSuit) {
  let best = cards[0];
  for (let i = 1; i < cards.length; i++) {
    if (cardStrength(cards[i].card, trumpSuit) > cardStrength(best.card, trumpSuit)) {
      best = cards[i];
    }
  }
  return best.seat;
}

// packages/engine/dist/rules/scoring.js
var LAST_TRICK_BONUS = 10;
var BELOTE_BONUS = 20;
var TOTAL_CARD_POINTS = 152;
function calculateTrickPoints(tricks, trumpSuit) {
  const points = { team1: 0, team2: 0 };
  for (const trick of tricks) {
    const winner = trick.winner ?? determineTrickWinner(trick, trumpSuit);
    const team = teamForSeat(winner);
    const trickPts = trick.cards.reduce((sum, tc) => sum + cardPoints(tc.card, trumpSuit), 0);
    points[team] += trickPts;
  }
  return points;
}
function hasBelote(hand, trumpSuit) {
  const hasKing = hand.some((c) => c.suit === trumpSuit && c.rank === Rank.King);
  const hasQueen = hand.some((c) => c.suit === trumpSuit && c.rank === Rank.Queen);
  return hasKing && hasQueen;
}
function lastTrickBonus(tricks) {
  const lastTrick = tricks[tricks.length - 1];
  if (!lastTrick?.winner)
    return { team1: 0, team2: 0 };
  const team = teamForSeat(lastTrick.winner);
  return {
    team1: team === TeamId.Team1 ? LAST_TRICK_BONUS : 0,
    team2: team === TeamId.Team2 ? LAST_TRICK_BONUS : 0
  };
}
function isCapot(tricks, team) {
  return tricks.every((t) => t.winner && teamForSeat(t.winner) === team);
}
function calculateRoundScore(tricks, contract, beloteTeam) {
  const trumpSuit = contract.bid.suit;
  const attackingTeam = contract.team;
  const defendingTeam = oppositeTeam(attackingTeam);
  const multiplier = contreMultiplier(contract);
  const trickPoints = calculateTrickPoints(tricks, trumpSuit);
  const lastBonus = lastTrickBonus(tricks);
  const belote = {
    team1: beloteTeam === TeamId.Team1 ? BELOTE_BONUS : 0,
    team2: beloteTeam === TeamId.Team2 ? BELOTE_BONUS : 0
  };
  const attackerRawPoints = trickPoints[attackingTeam] + lastBonus[attackingTeam];
  const contractMet = attackerRawPoints >= contract.bid.points;
  const attackerCapot = isCapot(tricks, attackingTeam);
  let finalScore;
  if (contractMet) {
    const team1Raw = trickPoints.team1 + lastBonus.team1;
    const team2Raw = trickPoints.team2 + lastBonus.team2;
    finalScore = {
      team1: team1Raw * multiplier + belote.team1,
      team2: team2Raw * multiplier + belote.team2
    };
    if (attackerCapot && contract.bid.points < 250) {
      finalScore[attackingTeam] += 100 * multiplier;
    }
  } else {
    finalScore = {
      team1: attackingTeam === TeamId.Team1 ? belote.team1 : (TOTAL_CARD_POINTS + LAST_TRICK_BONUS) * multiplier + belote.team1,
      team2: attackingTeam === TeamId.Team2 ? belote.team2 : (TOTAL_CARD_POINTS + LAST_TRICK_BONUS) * multiplier + belote.team2
    };
  }
  return {
    trickPoints,
    lastTrickBonus: lastBonus,
    belote,
    contractMet,
    contreMultiplier: multiplier,
    finalScore
  };
}

// packages/engine/dist/rules/bid-validation.js
function getValidBidActions(state, playerId) {
  const actions = [];
  actions.push({ type: "pass", playerId });
  if (state.contred || state.surcontred) {
    return actions;
  }
  if (state.highestBid) {
    const validValues = getAllBidValues().filter((v) => isBidHigher(v, state.highestBid.points));
    if (validValues.length > 0) {
      actions.push({
        type: "bid",
        bid: { playerId, points: validValues[0], suit: state.highestBid.suit }
      });
    }
  } else {
    actions.push({
      type: "bid",
      bid: { playerId, points: 80, suit: void 0 }
      // Suit chosen by player
    });
  }
  if (state.highestBid && !state.contred) {
    const bidderTeam = teamForSeat(state.currentBidder);
    const highBidTeam = teamForSeat(seatForPlayerId(state.highestBid.playerId, state.currentBidder));
    if (bidderTeam !== highBidTeam) {
      actions.push({ type: "contrer", playerId });
    }
  }
  return actions;
}
function isValidBidAction(action, state, playerSeat) {
  switch (action.type) {
    case "pass":
      return true;
    case "bid": {
      if (state.contred || state.surcontred)
        return false;
      if (state.highestBid && !isBidHigher(action.bid.points, state.highestBid.points)) {
        return false;
      }
      if (!state.highestBid && action.bid.points < 80)
        return false;
      return true;
    }
    case "contrer": {
      if (!state.highestBid || state.contred || state.surcontred)
        return false;
      const bidderTeam = teamForSeat(playerSeat);
      return true;
    }
    case "surcontrer": {
      if (!state.contred || state.surcontred)
        return false;
      return true;
    }
  }
}
function isBiddingOver(state) {
  if (state.contred || state.surcontred)
    return true;
  if (!state.highestBid && state.consecutivePasses >= 4)
    return true;
  if (state.highestBid && state.consecutivePasses >= 3)
    return true;
  return false;
}
function isBiddingDead(state) {
  return !state.highestBid && state.consecutivePasses >= 4;
}
function getAllBidValues() {
  return [...BID_VALUES, CAPOT_VALUE, GENERALE_VALUE];
}
function seatForPlayerId(_playerId, _fallback) {
  return _fallback;
}

// packages/engine/dist/state/game-state.js
function createInitialState(id, roomCode) {
  return {
    id,
    roomCode,
    phase: "lobby",
    players: {},
    playerOrder: [],
    teams: null,
    targetScore: 2e3,
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
    winner: null
  };
}

// packages/engine/dist/state/game-reducer.js
function ok(state) {
  return { state };
}
function err(state, error) {
  return { state, error };
}
function reduce(state, action) {
  switch (action.type) {
    case "JOIN":
      return handleJoin(state, action);
    case "LEAVE":
      return handleLeave(state, action);
    case "SET_TEAMS":
      return handleSetTeams(state, action);
    case "RANDOMIZE_TEAMS":
      return handleRandomizeTeams(state);
    case "SET_TARGET_SCORE":
      return handleSetTargetScore(state, action);
    case "START_GAME":
      return handleStartGame(state);
    case "DEAL":
      return handleDeal(state);
    case "BID":
      return handleBid(state, action);
    case "PASS":
      return handlePass(state, action);
    case "CONTRER":
      return handleContrer(state, action);
    case "SURCONTRER":
      return handleSurcontrer(state, action);
    case "PLAY_CARD":
      return handlePlayCard(state, action);
    case "DECLARE_BELOTE":
      return handleDeclareBelote(state, action);
    case "NEXT_ROUND":
      return handleNextRound(state);
    case "REMATCH":
      return handleRematch(state, action);
    default:
      return err(state, "Unknown action");
  }
}
function handleJoin(state, action) {
  if (state.phase !== "lobby")
    return err(state, "Can only join in lobby phase");
  if (Object.keys(state.players).length >= 4)
    return err(state, "Game is full");
  if (state.players[action.playerId])
    return err(state, "Player already joined");
  const takenSeats = new Set(Object.values(state.players).map((p) => p.seat));
  const freeSeat = SEAT_ORDER.find((s) => !takenSeats.has(s));
  if (!freeSeat)
    return err(state, "No seats available");
  const player = {
    id: action.playerId,
    name: action.playerName,
    seat: freeSeat
  };
  const newPlayers = { ...state.players, [action.playerId]: player };
  const newOrder = [...state.playerOrder, action.playerId];
  const newPhase = Object.keys(newPlayers).length === 4 ? "team_selection" : "lobby";
  return ok({ ...state, players: newPlayers, playerOrder: newOrder, phase: newPhase });
}
function handleLeave(state, action) {
  if (!state.players[action.playerId])
    return err(state, "Player not found");
  const { [action.playerId]: _, ...remainingPlayers } = state.players;
  const newOrder = state.playerOrder.filter((id) => id !== action.playerId);
  return ok({
    ...state,
    players: remainingPlayers,
    playerOrder: newOrder,
    phase: "lobby",
    teams: null
  });
}
function handleSetTeams(state, action) {
  if (state.phase !== "team_selection")
    return err(state, "Not in team selection phase");
  const playerIds = Object.keys(state.players);
  if (playerIds.length !== 4)
    return err(state, "Need 4 players");
  const newPlayers = {};
  const team1Ids = [];
  const team2Ids = [];
  for (const [playerId, assignment] of Object.entries(action.assignments)) {
    if (!state.players[playerId])
      return err(state, `Player ${playerId} not found`);
    newPlayers[playerId] = { ...state.players[playerId], seat: assignment.seat };
    if (assignment.team === TeamId.Team1)
      team1Ids.push(playerId);
    else
      team2Ids.push(playerId);
  }
  if (team1Ids.length !== 2 || team2Ids.length !== 2) {
    return err(state, "Each team must have exactly 2 players");
  }
  const teams = {
    team1: { id: TeamId.Team1, playerIds: team1Ids, score: 0 },
    team2: { id: TeamId.Team2, playerIds: team2Ids, score: 0 }
  };
  return ok({ ...state, players: newPlayers, teams, phase: "config" });
}
function handleRandomizeTeams(state) {
  if (state.phase !== "team_selection")
    return err(state, "Not in team selection phase");
  const playerIds = Object.keys(state.players);
  if (playerIds.length !== 4)
    return err(state, "Need 4 players");
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const assignments = {};
  assignments[shuffled[0]] = { seat: Seat.North, team: TeamId.Team1 };
  assignments[shuffled[1]] = { seat: Seat.East, team: TeamId.Team2 };
  assignments[shuffled[2]] = { seat: Seat.South, team: TeamId.Team1 };
  assignments[shuffled[3]] = { seat: Seat.West, team: TeamId.Team2 };
  return handleSetTeams(state, { type: "SET_TEAMS", assignments });
}
function handleSetTargetScore(state, action) {
  if (state.phase !== "config")
    return err(state, "Not in config phase");
  if (action.score < 500 || action.score > 5e3)
    return err(state, "Invalid target score");
  return ok({ ...state, targetScore: action.score });
}
function handleStartGame(state) {
  if (state.phase !== "config")
    return err(state, "Not in config phase");
  if (!state.teams)
    return err(state, "Teams not set");
  return ok({ ...state, phase: "dealing", dealer: Seat.North, roundNumber: 1 });
}
function handleDeal(state) {
  if (state.phase !== "dealing")
    return err(state, "Not in dealing phase");
  if (!state.dealer)
    return err(state, "No dealer set");
  const deck = createShuffledDeck();
  const [north, east, south, west] = deal(deck);
  const hands = {
    [Seat.North]: north,
    [Seat.East]: east,
    [Seat.South]: south,
    [Seat.West]: west
  };
  const firstBidder = nextSeat(state.dealer);
  return ok({
    ...state,
    phase: "bidding",
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
    beloteDeclared: false
  });
}
function handleBid(state, action) {
  if (state.phase !== "bidding")
    return err(state, "Not in bidding phase");
  if (!state.currentBidder)
    return err(state, "No current bidder");
  const player = state.players[action.playerId];
  if (!player)
    return err(state, "Player not found");
  if (player.seat !== state.currentBidder)
    return err(state, "Not your turn to bid");
  if (state.highestBid && !isBidHigher(action.points, state.highestBid.points)) {
    return err(state, "Bid must be higher than current highest");
  }
  const bid = {
    playerId: action.playerId,
    points: action.points,
    suit: action.suit
  };
  const bidAction = { type: "bid", bid };
  const newBids = [...state.bids, bidAction];
  return ok({
    ...state,
    bids: newBids,
    highestBid: bid,
    consecutivePasses: 0,
    currentBidder: nextSeat(state.currentBidder)
  });
}
function handlePass(state, action) {
  if (state.phase !== "bidding")
    return err(state, "Not in bidding phase");
  if (!state.currentBidder)
    return err(state, "No current bidder");
  const player = state.players[action.playerId];
  if (!player)
    return err(state, "Player not found");
  if (player.seat !== state.currentBidder)
    return err(state, "Not your turn to bid");
  const passAction = { type: "pass", playerId: action.playerId };
  const newBids = [...state.bids, passAction];
  const newPasses = state.consecutivePasses + 1;
  if (!state.highestBid && newPasses >= 4) {
    const newDealer = nextSeat(state.dealer);
    return ok({
      ...state,
      bids: newBids,
      consecutivePasses: newPasses,
      phase: "dealing",
      dealer: newDealer
    });
  }
  if (state.highestBid && newPasses >= 3) {
    const bidder = state.players[state.highestBid.playerId];
    const contract = {
      bid: state.highestBid,
      team: teamForSeat(bidder.seat),
      contred: false,
      surcontred: false
    };
    let beloteHolder = null;
    for (const seat of SEAT_ORDER) {
      if (state.hands[seat] && hasBelote(state.hands[seat], state.highestBid.suit)) {
        beloteHolder = seat;
        break;
      }
    }
    const firstPlayer = nextSeat(state.dealer);
    return ok({
      ...state,
      bids: newBids,
      consecutivePasses: newPasses,
      contract,
      phase: "playing",
      currentPlayer: firstPlayer,
      currentTrick: createTrick(1, firstPlayer),
      beloteHolder
    });
  }
  return ok({
    ...state,
    bids: newBids,
    consecutivePasses: newPasses,
    currentBidder: nextSeat(state.currentBidder)
  });
}
function handleContrer(state, action) {
  if (state.phase !== "bidding")
    return err(state, "Not in bidding phase");
  if (!state.highestBid)
    return err(state, "No bid to contrer");
  const player = state.players[action.playerId];
  if (!player)
    return err(state, "Player not found");
  const bidderTeam = teamForSeat(state.players[state.highestBid.playerId].seat);
  const playerTeam = teamForSeat(player.seat);
  if (playerTeam === bidderTeam)
    return err(state, "Cannot contrer your own team");
  const bidder = state.players[state.highestBid.playerId];
  const contract = {
    bid: state.highestBid,
    team: teamForSeat(bidder.seat),
    contred: true,
    surcontred: false
  };
  let beloteHolder = null;
  for (const seat of SEAT_ORDER) {
    if (state.hands[seat] && hasBelote(state.hands[seat], state.highestBid.suit)) {
      beloteHolder = seat;
      break;
    }
  }
  const firstPlayer = nextSeat(state.dealer);
  const contrerAction = { type: "contrer", playerId: action.playerId };
  return ok({
    ...state,
    bids: [...state.bids, contrerAction],
    contract,
    phase: "playing",
    currentPlayer: firstPlayer,
    currentTrick: createTrick(1, firstPlayer),
    beloteHolder
  });
}
function handleSurcontrer(state, action) {
  if (state.phase !== "bidding")
    return err(state, "Not in bidding phase");
  if (!state.contract?.contred)
    return err(state, "Must be contred first");
  const player = state.players[action.playerId];
  if (!player)
    return err(state, "Player not found");
  const playerTeam = teamForSeat(player.seat);
  if (playerTeam !== state.contract.team)
    return err(state, "Only bidding team can surcontrer");
  const surcontrerAction = { type: "surcontrer", playerId: action.playerId };
  const newContract = { ...state.contract, surcontred: true };
  return ok({
    ...state,
    bids: [...state.bids, surcontrerAction],
    contract: newContract
  });
}
function handlePlayCard(state, action) {
  if (state.phase !== "playing")
    return err(state, "Not in playing phase");
  if (!state.currentPlayer || !state.currentTrick || !state.contract) {
    return err(state, "Invalid game state");
  }
  const player = state.players[action.playerId];
  if (!player)
    return err(state, "Player not found");
  if (player.seat !== state.currentPlayer)
    return err(state, "Not your turn");
  const card = parseCardId(action.cardId);
  const hand = state.hands[player.seat];
  const trumpSuit = state.contract.bid.suit;
  if (!isCardPlayable(card, hand, state.currentTrick, trumpSuit, player.seat)) {
    return err(state, "This card cannot be played");
  }
  const newHand = hand.filter((c) => !cardEquals(c, card));
  const newHands = { ...state.hands, [player.seat]: newHand };
  const trickCard = { seat: player.seat, card };
  const updatedTrick = {
    ...state.currentTrick,
    cards: [...state.currentTrick.cards, trickCard]
  };
  if (isTrickComplete(updatedTrick)) {
    const winner = determineTrickWinner(updatedTrick, trumpSuit);
    const completedTrick = { ...updatedTrick, winner };
    const newTricks = [...state.tricks, completedTrick];
    if (newTricks.length === 8) {
      const beloteTeam = state.beloteHolder && state.beloteDeclared ? teamForSeat(state.beloteHolder) : null;
      const roundScore = calculateRoundScore(newTricks, state.contract, beloteTeam);
      const newTeams = state.teams ? {
        team1: {
          ...state.teams.team1,
          score: state.teams.team1.score + roundScore.finalScore.team1
        },
        team2: {
          ...state.teams.team2,
          score: state.teams.team2.score + roundScore.finalScore.team2
        }
      } : null;
      let winner2 = null;
      if (newTeams) {
        if (newTeams.team1.score >= state.targetScore)
          winner2 = TeamId.Team1;
        else if (newTeams.team2.score >= state.targetScore)
          winner2 = TeamId.Team2;
        if (newTeams.team1.score >= state.targetScore && newTeams.team2.score >= state.targetScore) {
          winner2 = newTeams.team1.score >= newTeams.team2.score ? TeamId.Team1 : TeamId.Team2;
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
        phase: winner2 ? "game_over" : "scoring",
        winner: winner2
      });
    }
    return ok({
      ...state,
      hands: newHands,
      tricks: newTricks,
      currentTrick: createTrick(newTricks.length + 1, winner),
      currentPlayer: winner
    });
  }
  return ok({
    ...state,
    hands: newHands,
    currentTrick: updatedTrick,
    currentPlayer: nextSeat(state.currentPlayer)
  });
}
function handleDeclareBelote(state, action) {
  const player = state.players[action.playerId];
  if (!player)
    return err(state, "Player not found");
  if (state.beloteHolder !== player.seat)
    return err(state, "You do not hold belote");
  return ok({ ...state, beloteDeclared: true });
}
function handleNextRound(state) {
  if (state.phase !== "scoring")
    return err(state, "Not in scoring phase");
  const newDealer = nextSeat(state.dealer);
  return ok({
    ...state,
    phase: "dealing",
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
    beloteDeclared: false
  });
}
function handleRematch(state, action) {
  if (state.phase !== "game_over")
    return err(state, "Game is not over");
  if (action.sameTeams && state.teams) {
    const resetTeams = {
      team1: { ...state.teams.team1, score: 0 },
      team2: { ...state.teams.team2, score: 0 }
    };
    return ok({
      ...state,
      teams: resetTeams,
      phase: "dealing",
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
      beloteDeclared: false
    });
  }
  return ok({
    ...state,
    phase: "team_selection",
    teams: null,
    roundNumber: 0,
    roundHistory: [],
    winner: null
  });
}

// packages/engine/dist/state/state-projection.js
function projectState(state, playerId) {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(`Player ${playerId} not found in game`);
  }
  const mySeat = player.seat;
  const myHand = state.hands[mySeat] ?? [];
  let playableCards = [];
  if (state.phase === "playing" && state.currentPlayer === mySeat && state.currentTrick && state.contract) {
    const playable = getPlayableCards(myHand, state.currentTrick, state.contract.bid.suit, mySeat);
    playableCards = playable.map(cardId);
  }
  const players = Object.values(state.players).map((p) => ({
    id: p.id,
    name: p.name,
    seat: p.seat,
    cardCount: state.hands[p.seat]?.length ?? 0,
    isConnected: true
    // TODO: track connection state
  }));
  const teams = state.teams ? {
    team1: { id: state.teams.team1.id, playerIds: state.teams.team1.playerIds, score: state.teams.team1.score },
    team2: { id: state.teams.team2.id, playerIds: state.teams.team2.playerIds, score: state.teams.team2.score }
  } : null;
  const currentTrick = state.currentTrick ? {
    number: state.currentTrick.number,
    cards: [...state.currentTrick.cards],
    leader: state.currentTrick.leader,
    winner: state.currentTrick.winner ?? null
  } : null;
  const lastTrick = state.tricks.length > 0 ? {
    number: state.tricks[state.tricks.length - 1].number,
    cards: [...state.tricks[state.tricks.length - 1].cards],
    leader: state.tricks[state.tricks.length - 1].leader,
    winner: state.tricks[state.tricks.length - 1].winner ?? null
  } : null;
  const tricksWon = { team1: 0, team2: 0 };
  for (const trick of state.tricks) {
    if (trick.winner) {
      const team = trick.winner === "north" || trick.winner === "south" ? "team1" : "team2";
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
    winner: state.winner
  };
}

// packages/engine/dist/state/serialization.js
var PLACEHOLDER_CARD = { suit: Suit.Spades, rank: Rank.Seven };
function toPublicState(state) {
  const handCounts = {};
  for (const seat of SEAT_ORDER) {
    handCounts[seat] = state.hands[seat]?.length ?? 0;
  }
  const { hands: _hands, ...rest } = state;
  return { ...rest, handCounts };
}
function serializeHands(state) {
  const out = {};
  for (const seat of SEAT_ORDER) {
    out[seat] = (state.hands[seat] ?? []).map(cardId);
  }
  return out;
}
function deserializeHand(ids) {
  return ids.map(parseCardId);
}
function reconstructState(pub, hands) {
  const fullHands = {};
  for (const seat of SEAT_ORDER) {
    fullHands[seat] = hands[seat] ?? [];
  }
  const { handCounts: _handCounts, ...rest } = pub;
  return { ...rest, hands: fullHands };
}
function projectPublicState(pub, playerId, myHand) {
  const me = pub.players[playerId];
  if (!me) {
    throw new Error(`Player ${playerId} not found in game`);
  }
  const hands = {};
  for (const seat of SEAT_ORDER) {
    if (seat === me.seat) {
      hands[seat] = myHand;
    } else {
      const count = pub.handCounts[seat] ?? 0;
      hands[seat] = Array.from({ length: count }, () => PLACEHOLDER_CARD);
    }
  }
  return projectState(reconstructState(pub, hands), playerId);
}
export {
  ALL_RANKS,
  ALL_SUITS,
  BID_VALUES,
  CAPOT_VALUE,
  DECK_32,
  GENERALE_VALUE,
  PLAIN_POINTS,
  RANK_NAMES_FR,
  Rank,
  SEAT_ORDER,
  SUIT_NAMES_FR,
  SUIT_SYMBOLS,
  Seat,
  Suit,
  TRUMP_POINTS,
  TeamId,
  arePartners,
  calculateRoundScore,
  calculateTrickPoints,
  cardEquals,
  cardId,
  cardPoints,
  cardStrength,
  compareCards,
  contreMultiplier,
  createInitialState,
  createShuffledDeck,
  createTrick,
  deal,
  deserializeHand,
  determineTrickWinner,
  getPlayableCards,
  getValidBidActions,
  hasBelote,
  isBidHigher,
  isBiddingDead,
  isBiddingOver,
  isCapot,
  isCardPlayable,
  isTrickComplete,
  isTrump,
  isValidBidAction,
  nextSeat,
  oppositeTeam,
  parseCardId,
  partnerSeat,
  projectPublicState,
  projectState,
  reconstructState,
  reduce,
  seatsFrom,
  serializeHands,
  shuffle,
  sortHand,
  teamForSeat,
  toPublicState,
  trickLeadSuit
};
