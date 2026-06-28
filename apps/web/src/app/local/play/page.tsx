'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalGame } from '@/hooks/useLocalGame';
import { GameTable } from '@/components/game/GameTable';
import { RoundSummary } from '@/components/game/RoundSummary';
import { GameOver } from '@/components/game/GameOver';
import { Button } from '@/components/ui/Button';
import type { Card, Suit, BidPoints, CardId } from '@contree/engine';
import { cardId, TeamId, Seat, SEAT_ORDER, calculateTrickPoints, teamForSeat } from '@contree/engine';

export default function LocalPlayPage() {
  const router = useRouter();
  const {
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
  } = useLocalGame();

  // Initialize game from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('localGamePlayers');
    if (!stored) {
      router.push('/local');
      return;
    }
    const names = JSON.parse(stored) as string[];
    if (names.length === 4) {
      createGame(names);
    }
  }, [createGame, router]);

  // Auto-start the game once teams are set
  useEffect(() => {
    if (state.phase === 'config') {
      dispatch({ type: 'SET_TARGET_SCORE', score: 2000 });
      dispatch({ type: 'START_GAME' });
    }
  }, [state.phase, dispatch]);

  // Auto-deal when entering dealing phase
  useEffect(() => {
    if (state.phase === 'dealing') {
      autoAdvance();
    }
  }, [state.phase, autoAdvance]);

  const handlePlayCard = useCallback(
    (card: Card) => {
      if (!activePlayer) return;
      dispatch({
        type: 'PLAY_CARD',
        playerId: activePlayer.id,
        cardId: cardId(card),
      });
    },
    [activePlayer, dispatch],
  );

  const handleBid = useCallback(
    (points: BidPoints, suit: Suit) => {
      if (!activePlayer) return;
      dispatch({
        type: 'BID',
        playerId: activePlayer.id,
        points,
        suit,
      });
    },
    [activePlayer, dispatch],
  );

  const handlePass = useCallback(() => {
    if (!activePlayer) return;
    dispatch({ type: 'PASS', playerId: activePlayer.id });
  }, [activePlayer, dispatch]);

  const handleContrer = useCallback(() => {
    if (!activePlayer) return;
    dispatch({ type: 'CONTRER', playerId: activePlayer.id });
  }, [activePlayer, dispatch]);

  const handleSurcontrer = useCallback(() => {
    if (!activePlayer) return;
    dispatch({ type: 'SURCONTRER', playerId: activePlayer.id });
  }, [activePlayer, dispatch]);

  const handleNextRound = useCallback(() => {
    dispatch({ type: 'NEXT_ROUND' });
  }, [dispatch]);

  const handleRematchSame = useCallback(() => {
    dispatch({ type: 'REMATCH', sameTeams: true });
  }, [dispatch]);

  const handleRematchNew = useCallback(() => {
    dispatch({ type: 'REMATCH', sameTeams: false });
  }, [dispatch]);

  // Loading state
  if (players.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-text-dim">Chargement...</p>
      </main>
    );
  }

  // Hot-seat reveal screen
  if (pendingReveal && activePlayer) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <div className="text-center">
          <p className="text-text-dim text-sm">C&apos;est au tour de</p>
          <h2 className="font-display text-4xl font-bold text-gold">{activePlayer.name}</h2>
          <p className="mt-2 text-text-dim">
            {state.phase === 'bidding' ? 'Phase d\'encheres' : 'Joue une carte'}
          </p>
        </div>
        <Button onClick={revealHand} className="px-8 py-4 text-lg">
          Je suis {activePlayer.name}, montrer ma main
        </Button>
        {lastError && <p className="text-sm text-accent-red">{lastError}</p>}
      </main>
    );
  }

  // Scoring screen
  if (state.phase === 'scoring' && state.roundScore) {
    const team1Names = players
      .filter((_, i) => SEAT_ORDER[i] === Seat.North || SEAT_ORDER[i] === Seat.South)
      .map((p) => p.name);
    const team2Names = players
      .filter((_, i) => SEAT_ORDER[i] === Seat.East || SEAT_ORDER[i] === Seat.West)
      .map((p) => p.name);

    return (
      <RoundSummary
        score={state.roundScore}
        team1Names={team1Names}
        team2Names={team2Names}
        onNextRound={handleNextRound}
      />
    );
  }

  // Game over screen
  if (state.phase === 'game_over' && state.winner) {
    const team1Names = players
      .filter((_, i) => SEAT_ORDER[i] === Seat.North || SEAT_ORDER[i] === Seat.South)
      .map((p) => p.name);
    const team2Names = players
      .filter((_, i) => SEAT_ORDER[i] === Seat.East || SEAT_ORDER[i] === Seat.West)
      .map((p) => p.name);

    const isTeam1Winner = state.winner === TeamId.Team1;
    const t1 = state.teams?.team1.score ?? 0;
    const t2 = state.teams?.team2.score ?? 0;

    return (
      <GameOver
        winnerTeamNames={isTeam1Winner ? team1Names : team2Names}
        loserTeamNames={isTeam1Winner ? team2Names : team1Names}
        winnerScore={isTeam1Winner ? t1 : t2}
        loserScore={isTeam1Winner ? t2 : t1}
        isWinner={true}
        onRematchSameTeams={handleRematchSame}
        onRematchNewTeams={handleRematchNew}
        onBackToLobby={() => router.push('/lobby')}
      />
    );
  }

  // Main game view
  if (!projectedState) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-text-dim">Initialisation...</p>
      </main>
    );
  }

  // Determine canContrer / canSurcontrer
  const canContrer =
    state.phase === 'bidding' &&
    !!state.highestBid &&
    !state.contract?.contred &&
    activePlayer != null &&
    state.players[activePlayer.id] != null &&
    (() => {
      const mySeat = state.players[activePlayer!.id].seat;
      const bidderSeat = state.players[state.highestBid!.playerId].seat;
      const myTeam = mySeat === Seat.North || mySeat === Seat.South ? TeamId.Team1 : TeamId.Team2;
      const bidderTeam =
        bidderSeat === Seat.North || bidderSeat === Seat.South ? TeamId.Team1 : TeamId.Team2;
      return myTeam !== bidderTeam;
    })();

  const canSurcontrer =
    state.phase === 'bidding' &&
    !!state.contract?.contred &&
    !state.contract?.surcontred &&
    activePlayer != null &&
    state.players[activePlayer.id] != null &&
    (() => {
      const mySeat = state.players[activePlayer!.id].seat;
      const myTeam = mySeat === Seat.North || mySeat === Seat.South ? TeamId.Team1 : TeamId.Team2;
      return myTeam === state.contract!.team;
    })();

  const gameTablePlayers = projectedState.players.map((p) => ({
    id: p.id,
    name: p.name,
    seat: p.seat,
    team: (p.seat === Seat.North || p.seat === Seat.South ? 'team1' : 'team2') as
      | 'team1'
      | 'team2',
    cardCount: p.cardCount,
    isConnected: true,
  }));

  return (
    <div className="relative">
      {/* Local mode indicator */}
      <div className="absolute left-2 top-2 z-50 rounded bg-surface/80 px-2 py-1 text-xs text-text-dim backdrop-blur">
        Mode local &middot; {activePlayer?.name}
      </div>

      {lastError && (
        <div className="absolute right-2 top-2 z-50 rounded bg-accent-red/20 px-2 py-1 text-xs text-accent-red">
          {lastError}
        </div>
      )}

      <GameTable
        players={gameTablePlayers}
        mySeat={projectedState.mySeat}
        myHand={projectedState.myHand}
        playableCards={projectedState.playableCards}
        phase={projectedState.phase}
        currentPlayer={projectedState.currentPlayer}
        dealer={projectedState.dealer}
        currentTrick={projectedState.currentTrick?.cards ?? []}
        bids={projectedState.bids}
        contract={
          projectedState.contract
            ? {
                suit: projectedState.contract.bid.suit,
                points: projectedState.contract.bid.points,
                team: projectedState.contract.team,
                contred: projectedState.contract.contred,
                surcontred: projectedState.contract.surcontred,
              }
            : null
        }
        team1Score={projectedState.teams?.team1.score ?? 0}
        team2Score={projectedState.teams?.team2.score ?? 0}
        targetScore={projectedState.targetScore}
        roundNumber={projectedState.roundNumber}
        roundTeam1Points={(() => {
          if (state.phase !== 'playing' || !state.contract) return undefined;
          const pts = calculateTrickPoints(state.tricks, state.contract.bid.suit);
          return pts.team1;
        })()}
        roundTeam2Points={(() => {
          if (state.phase !== 'playing' || !state.contract) return undefined;
          const pts = calculateTrickPoints(state.tricks, state.contract.bid.suit);
          return pts.team2;
        })()}
        tricksWon={projectedState.tricksWon}
        highestBid={
          projectedState.highestBid
            ? { points: projectedState.highestBid.points, suit: projectedState.highestBid.suit }
            : null
        }
        currentBidder={projectedState.currentBidder}
        canContrer={canContrer}
        canSurcontrer={canSurcontrer}
        onPlayCard={handlePlayCard}
        onBid={handleBid}
        onPass={handlePass}
        onContrer={handleContrer}
        onSurcontrer={handleSurcontrer}
      />
    </div>
  );
}
