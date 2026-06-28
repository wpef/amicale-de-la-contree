'use client';

import type { Card as CardType, CardId, TrickCard, Suit, BidPoints } from '@contree/engine';
import { Seat, SUIT_SYMBOLS } from '@contree/engine';
import { PlayerSeat } from './PlayerSeat';
import { TrickArea } from './TrickArea';
import { Scoreboard } from './Scoreboard';
import { CardFan } from '../cards/CardFan';
import { BiddingPanel } from '../bidding/BiddingPanel';

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

  const isMyTurn =
    (phase === 'playing' && currentPlayer === mySeat) ||
    (phase === 'bidding' && currentBidder === mySeat);

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-2 gap-2">
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
          <div className="rounded-lg border border-gold/30 bg-surface/80 px-3 py-1.5 backdrop-blur">
            <span className="text-xs text-text-dim">Contrat </span>
            <span className="font-mono font-bold text-gold">
              {contract.points} {SUIT_SYMBOLS[contract.suit as Suit]}
            </span>
            {contract.contred && !contract.surcontred && (
              <span className="ml-1 text-xs font-bold text-accent-red">Contre</span>
            )}
            {contract.surcontred && (
              <span className="ml-1 text-xs font-bold text-accent-red">Surcontre</span>
            )}
          </div>
        )}
      </div>

      {/* Game table */}
      <div className="game-table relative flex flex-1 items-center justify-center rounded-2xl mx-2">
        {players.map((p) => (
          <PlayerSeat
            key={p.id}
            name={p.name}
            seat={p.seat}
            team={p.team}
            cardCount={p.cardCount}
            isCurrentPlayer={p.seat === currentPlayer}
            isDealer={p.seat === dealer}
            isConnected={p.isConnected}
            position={getRelativePosition(p.seat, mySeat)}
          />
        ))}

        {phase === 'playing' && <TrickArea cards={currentTrick} mySeat={mySeat} />}

        {phase === 'bidding' && (
          <div className="absolute bottom-20 left-1/2 w-80 -translate-x-1/2">
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
        )}
      </div>

      {/* Hand */}
      <div className="p-4">
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
