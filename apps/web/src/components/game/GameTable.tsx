'use client';

import type { Card as CardType, CardId, TrickCard, Suit, BidPoints } from '@contree/engine';
import { PlayerSeat } from './PlayerSeat';
import { TrickArea } from './TrickArea';
import { Scoreboard } from './Scoreboard';
import { CardFan } from '../cards/CardFan';
import { BiddingPanel } from '../bidding/BiddingPanel';
import { SUIT_SYMBOLS } from '@contree/engine';

interface PlayerInfo {
  id: string;
  name: string;
  seat: string;
  team: 'team1' | 'team2';
  cardCount: number;
  isConnected: boolean;
}

interface GameTableProps {
  // Players
  players: PlayerInfo[];
  mySeat: string;

  // Hand
  myHand: CardType[];
  playableCards: CardId[];

  // Game state
  phase: string;
  currentPlayer: string | null;
  currentTrick: TrickCard[];
  contract: { suit: string; points: number; team: string; contred: boolean; surcontred: boolean } | null;

  // Scores
  team1Score: number;
  team2Score: number;
  targetScore: number;
  roundNumber: number;

  // Bidding
  highestBid: { points: number; suit: string } | null;
  currentBidder: string | null;
  canContrer: boolean;
  canSurcontrer: boolean;

  // Actions
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
  currentTrick,
  contract,
  team1Score,
  team2Score,
  targetScore,
  roundNumber,
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

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar: scores + contract info */}
      <div className="flex items-center justify-between p-2">
        <Scoreboard
          team1Score={team1Score}
          team2Score={team2Score}
          targetScore={targetScore}
          team1Names={team1Names}
          team2Names={team2Names}
          roundNumber={roundNumber}
        />
        {contract && (
          <div className="rounded-lg border border-gold/30 bg-surface/80 px-3 py-1 backdrop-blur">
            <span className="text-sm text-text-dim">Contrat : </span>
            <span className="font-mono font-bold text-gold">
              {contract.points} {SUIT_SYMBOLS[contract.suit as Suit]}
            </span>
            {contract.contred && <span className="ml-1 text-accent-red">Contre !</span>}
            {contract.surcontred && <span className="ml-1 text-accent-red">Surcontre !</span>}
          </div>
        )}
      </div>

      {/* Game table */}
      <div className="game-table relative flex flex-1 items-center justify-center rounded-2xl mx-2">
        {/* Player seats */}
        {players.map((p) => (
          <PlayerSeat
            key={p.id}
            name={p.name}
            seat={p.seat}
            team={p.team}
            cardCount={p.cardCount}
            isCurrentPlayer={p.seat === currentPlayer}
            isConnected={p.isConnected}
            position={getRelativePosition(p.seat, mySeat)}
          />
        ))}

        {/* Trick area (center) */}
        {phase === 'playing' && (
          <TrickArea cards={currentTrick} mySeat={mySeat} />
        )}

        {/* Bidding panel */}
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

      {/* My hand (bottom) */}
      <div className="p-4">
        <CardFan cards={myHand} playableCards={playableCards} onPlayCard={onPlayCard} />
      </div>
    </div>
  );
}
