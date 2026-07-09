'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GameTable } from './GameTable';
import { RoundSummary } from './RoundSummary';
import { GameOver } from './GameOver';
import type { OnlineGameHook } from '@/hooks/useOnlineGame';
import type { Card, Suit, BidPoints } from '@contree/engine';
import { cardId, TeamId, Seat } from '@contree/engine';

interface OnlineGameViewProps {
  hook: OnlineGameHook;
}

/** Team a seat belongs to (N/S = team1, E/W = team2). */
function teamOf(seat: string): 'team1' | 'team2' {
  return seat === Seat.North || seat === Seat.South ? 'team1' : 'team2';
}

export function OnlineGameView({ hook }: OnlineGameViewProps) {
  const router = useRouter();
  const { projected, sendAction, error } = hook;

  const handlePlayCard = useCallback(
    (card: Card) => {
      sendAction({ type: 'PLAY_CARD', cardId: cardId(card) });
    },
    [sendAction],
  );
  const handleBid = useCallback(
    (points: BidPoints, suit: Suit) => {
      sendAction({ type: 'BID', points, suit });
    },
    [sendAction],
  );
  const handlePass = useCallback(() => sendAction({ type: 'PASS' }), [sendAction]);
  const handleContrer = useCallback(() => sendAction({ type: 'CONTRER' }), [sendAction]);
  const handleSurcontrer = useCallback(() => sendAction({ type: 'SURCONTRER' }), [sendAction]);
  const handleNextRound = useCallback(() => sendAction({ type: 'NEXT_ROUND' }), [sendAction]);

  if (!projected) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-text-dim">Chargement de la partie...</p>
      </main>
    );
  }

  const team1Names = projected.players
    .filter((p) => teamOf(p.seat) === 'team1')
    .map((p) => p.name);
  const team2Names = projected.players
    .filter((p) => teamOf(p.seat) === 'team2')
    .map((p) => p.name);

  // Scoring screen (only the round leader-ish; anyone can advance the round).
  if (projected.phase === 'scoring' && projected.roundScore) {
    return (
      <RoundSummary
        score={projected.roundScore}
        team1Names={team1Names}
        team2Names={team2Names}
        onNextRound={handleNextRound}
      />
    );
  }

  // Game over screen.
  if (projected.phase === 'game_over' && projected.winner) {
    const isTeam1Winner = projected.winner === TeamId.Team1;
    const t1 = projected.teams?.team1.score ?? 0;
    const t2 = projected.teams?.team2.score ?? 0;
    const myTeam = teamOf(projected.mySeat);
    return (
      <GameOver
        winnerTeamNames={isTeam1Winner ? team1Names : team2Names}
        loserTeamNames={isTeam1Winner ? team2Names : team1Names}
        winnerScore={isTeam1Winner ? t1 : t2}
        loserScore={isTeam1Winner ? t2 : t1}
        isWinner={myTeam === projected.winner}
        onRematchSameTeams={() => sendAction({ type: 'REMATCH', sameTeams: true })}
        onRematchNewTeams={() => sendAction({ type: 'REMATCH', sameTeams: false })}
        onBackToLobby={() => router.push('/lobby')}
      />
    );
  }

  const myTeam = teamOf(projected.mySeat);

  const canContrer =
    projected.phase === 'bidding' &&
    !!projected.highestBid &&
    !projected.contract?.contred &&
    (() => {
      const bidder = projected.players.find((p) => p.id === projected.highestBid!.playerId);
      if (!bidder) return false;
      return teamOf(bidder.seat) !== myTeam;
    })();

  const canSurcontrer =
    projected.phase === 'bidding' &&
    !!projected.contract?.contred &&
    !projected.contract?.surcontred &&
    myTeam === projected.contract?.team;

  const gameTablePlayers = projected.players.map((p) => ({
    id: p.id,
    name: p.name,
    seat: p.seat,
    team: teamOf(p.seat),
    cardCount: p.cardCount,
    isConnected: p.isConnected,
  }));

  // Whose turn is it? (bidding -> currentBidder, playing -> currentPlayer)
  const actorSeat =
    projected.phase === 'bidding'
      ? projected.currentBidder
      : projected.phase === 'playing'
        ? projected.currentPlayer
        : null;
  const isMyTurn = actorSeat != null && actorSeat === projected.mySeat;
  const actorName = projected.players.find((p) => p.seat === actorSeat)?.name;
  const turnLabel = actorSeat
    ? isMyTurn
      ? 'À toi de jouer'
      : `Au tour de ${actorName}`
    : null;

  return (
    <div className="relative">
      <div className="absolute left-2 top-2 z-50 rounded bg-surface/80 px-2 py-1 text-xs text-text-dim backdrop-blur">
        {projected.roomCode} &middot; {projected.players.find((p) => p.seat === projected.mySeat)?.name}
      </div>

      {turnLabel && (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-40 flex justify-center">
          <div
            className={`rounded-full px-4 py-1 text-sm font-semibold shadow-lg backdrop-blur transition ${
              isMyTurn
                ? 'animate-pulse bg-gold text-bg'
                : 'bg-surface/90 text-text-dim'
            }`}
          >
            {turnLabel}
          </div>
        </div>
      )}
      {error && (
        <div className="absolute right-2 top-2 z-50 rounded bg-accent-red/20 px-2 py-1 text-xs text-accent-red">
          {error}
        </div>
      )}

      <GameTable
        players={gameTablePlayers}
        mySeat={projected.mySeat}
        myHand={projected.myHand}
        playableCards={projected.playableCards}
        phase={projected.phase}
        currentPlayer={projected.currentPlayer}
        dealer={projected.dealer}
        currentTrick={projected.currentTrick?.cards ?? []}
        bids={projected.bids}
        contract={
          projected.contract
            ? {
                suit: projected.contract.bid.suit,
                points: projected.contract.bid.points,
                team: projected.contract.team,
                contred: projected.contract.contred,
                surcontred: projected.contract.surcontred,
              }
            : null
        }
        team1Score={projected.teams?.team1.score ?? 0}
        team2Score={projected.teams?.team2.score ?? 0}
        targetScore={projected.targetScore}
        roundNumber={projected.roundNumber}
        roundTeam1Points={projected.phase === 'playing' ? projected.roundPoints.team1 : undefined}
        roundTeam2Points={projected.phase === 'playing' ? projected.roundPoints.team2 : undefined}
        tricksWon={projected.tricksWon}
        highestBid={
          projected.highestBid
            ? { points: projected.highestBid.points, suit: projected.highestBid.suit }
            : null
        }
        currentBidder={projected.currentBidder}
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
