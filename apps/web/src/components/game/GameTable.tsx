'use client';

import type { Card as CardType, CardId, TrickCard, Suit, BidPoints, BidAction } from '@contree/engine';
import { Seat, SUIT_SYMBOLS } from '@contree/engine';
import { PlayerSeat } from './PlayerSeat';
import { TrickArea } from './TrickArea';
import { Scoreboard } from './Scoreboard';
import { CardFan } from '../cards/CardFan';
import { BiddingPanel } from '../bidding/BiddingPanel';
import { BidHistory } from '../bidding/BidHistory';

interface PlayerInfo {
  id: string;
  name: string;
  seat: string;
  team: 'team1' | 'team2';
  cardCount: number;
  isConnected: boolean;
}

interface GameTableProps {
  players: PlayerInfo[];
  mySeat: string;
  myHand: CardType[];
  playableCards: CardId[];
  phase: string;
  currentPlayer: string | null;
  dealer: string | null;
  currentTrick: TrickCard[];
  contract: {
    suit: string;
    points: number;
    team: string;
    contred: boolean;
    surcontred: boolean;
  } | null;
  team1Score: number;
  team2Score: number;
  targetScore: number;
  roundNumber: number;
  roundTeam1Points?: number;
  roundTeam2Points?: number;
  tricksWon?: { team1: number; team2: number };
  bids: BidAction[];
  highestBid: { points: number; suit: string } | null;
  currentBidder: string | null;
  canContrer: boolean;
  canSurcontrer: boolean;
  onPlayCard: (card: CardType) => void;
  onBid: (points: BidPoints, suit: Suit) => void;
  onPass: () => void;
  onContrer: () => void;
  onSurcontrer: () => void;
}

function getRelativePosition(
  seat: string,
  mySeat: string,
): 'top' | 'left' | 'right' | 'bottom' {
  const seats = ['north', 'east', 'south', 'west'];
  const myIdx = seats.indexOf(mySeat);
  const idx = seats.indexOf(seat);
  const rel = (idx - myIdx + 4) % 4;
  return (['bottom', 'right', 'top', 'left'] as const)[rel];
}

export function GameTable({
  players,
  mySeat,
  myHand,
  playableCards,
  phase,
  currentPlayer,
  dealer,
  currentTrick,
  contract,
  team1Score,
  team2Score,
  targetScore,
  roundNumber,
  roundTeam1Points,
  roundTeam2Points,
  tricksWon,
  bids,
  highestBid,
  currentBidder,
  canContrer,
  canSurcontrer,
  onPlayCard,
  onBid,
  onPass,
  onContrer,
  onSurcontrer,
}: GameTableProps) {
  const team1Names = players.filter((p) => p.team === 'team1').map((p) => p.name);
  const team2Names = players.filter((p) => p.team === 'team2').map((p) => p.name);
  const playerNames: Record<string, string> = {};
  for (const p of players) playerNames[p.id] = p.name;

  const isMyTurn =
    (phase === 'playing' && currentPlayer === mySeat) ||
    (phase === 'bidding' && currentBidder === mySeat);

  const contractTeamColor = contract?.team === 'team1' ? 'border-team1' : 'border-team2';
  const contractTeamNames = contract?.team === 'team1' ? team1Names : team2Names;

  // On mobile during bidding, show a compact layout
  const isBidding = phase === 'bidding';

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex flex-wrap items-start justify-between p-1.5 sm:p-2 gap-1 sm:gap-2 shrink-0">
        <Scoreboard
          team1Score={team1Score}
          team2Score={team2Score}
          targetScore={targetScore}
          team1Names={team1Names}
          team2Names={team2Names}
          roundNumber={roundNumber}
          roundTeam1Points={roundTeam1Points}
          roundTeam2Points={roundTeam2Points}
          tricksWon={tricksWon}
        />
        {contract && (
          <div className={`rounded-lg border-2 ${contractTeamColor} bg-surface/80 px-2 sm:px-3 py-1 sm:py-1.5 backdrop-blur`}>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-gold">
                {contract.points} {SUIT_SYMBOLS[contract.suit as Suit]}
              </span>
              {contract.contred && !contract.surcontred && (
                <span className="text-xs font-bold text-accent-red">x2</span>
              )}
              {contract.surcontred && (
                <span className="text-xs font-bold text-accent-red">x4</span>
              )}
            </div>
            <div className="text-[10px] text-text-dim">
              pris par {contractTeamNames?.join(' & ')}
            </div>
          </div>
        )}
      </div>

      {/* Game table - shrinks on mobile to leave room for cards */}
      <div className={`game-table relative flex items-center justify-center rounded-2xl mx-1 sm:mx-2 ${isBidding ? 'flex-1 min-h-0 max-h-[45vh] sm:max-h-none' : 'flex-1 min-h-0'}`}>
        {/* Player seats */}
        {players.map((p) => (
          <PlayerSeat
            key={p.id}
            name={p.name}
            seat={p.seat}
            team={p.team}
            cardCount={p.cardCount}
            isCurrentPlayer={p.seat === currentPlayer || p.seat === currentBidder}
            isDealer={p.seat === dealer}
            isConnected={p.isConnected}
            position={getRelativePosition(p.seat, mySeat)}
          />
        ))}

        {/* Trick area during play */}
        {phase === 'playing' && <TrickArea cards={currentTrick} mySeat={mySeat} />}

        {/* Bidding panel */}
        {isBidding && (
          <div className="flex gap-3 items-start max-w-full px-2">
            {bids.length > 0 && (
              <div className="hidden sm:block w-40 shrink-0">
                <BidHistory bids={bids} playerNames={playerNames} />
              </div>
            )}
            <div className="w-full sm:w-80 max-w-[320px]">
              <BiddingPanel
                isMyTurn={currentBidder === mySeat}
                highestBid={highestBid}
                canContrer={canContrer}
                canSurcontrer={canSurcontrer}
                onBid={onBid}
                onPass={onPass}
                onContrer={onContrer}
                onSurcontrer={onSurcontrer}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bid history on mobile */}
      {isBidding && bids.length > 0 && (
        <div className="sm:hidden px-2 py-1 shrink-0">
          <BidHistory bids={bids} playerNames={playerNames} />
        </div>
      )}

      {/* Hand - always visible */}
      <div className="p-2 sm:p-4 shrink-0">
        <CardFan
          cards={myHand}
          playableCards={playableCards}
          trumpSuit={contract?.suit as Suit | undefined}
          isMyTurn={isMyTurn}
          onPlayCard={onPlayCard}
        />
      </div>
    </div>
  );
}
