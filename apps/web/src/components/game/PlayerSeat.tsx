'use client';

import { SUIT_SYMBOLS } from '@contree/engine';
import type { Suit } from '@contree/engine';

const suitDisplayColors: Record<string, string> = {
  spades: '#4a6fa5',
  hearts: '#e74c3c',
  diamonds: '#f39c12',
  clubs: '#2ecc71',
};

interface BidDisplay {
  type: 'pass' | 'bid' | 'contrer' | 'surcontrer';
  points?: number;
  suit?: Suit;
}

interface PlayerSeatProps {
  name: string;
  seat: string;
  team: 'team1' | 'team2';
  cardCount: number;
  isCurrentPlayer: boolean;
  isDealer: boolean;
  isConnected: boolean;
  position: 'top' | 'left' | 'right' | 'bottom';
  lastBid?: BidDisplay | null;
}

const positionClasses = {
  top: 'top-2 left-1/2 -translate-x-1/2',
  bottom: 'bottom-2 left-1/2 -translate-x-1/2',
  left: 'left-1 sm:left-2 top-1/4 sm:top-1/2 sm:-translate-y-1/2',
  right: 'right-1 sm:right-2 top-1/4 sm:top-1/2 sm:-translate-y-1/2',
};

const teamColors = {
  team1: 'border-team1',
  team2: 'border-team2',
};

export function PlayerSeat({
  name,
  seat,
  team,
  cardCount,
  isCurrentPlayer,
  isDealer,
  isConnected,
  position,
  lastBid,
}: PlayerSeatProps) {
  return (
    <div className={`absolute ${positionClasses[position]} z-10`}>
      <div
        className={`rounded-lg border-2 ${teamColors[team]} ${
          isCurrentPlayer ? 'bg-gold/20 ring-2 ring-gold' : 'bg-surface/80'
        } px-3 py-1.5 text-center backdrop-blur`}
      >
        <div className="flex items-center gap-1.5">
          {!isConnected && <span className="h-2 w-2 rounded-full bg-accent-red" />}
          {isDealer && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-bg">
              D
            </span>
          )}
          <span className="text-sm font-medium text-text">{name}</span>
          <span className="text-xs text-text-dim">({cardCount})</span>
        </div>
        {/* Bid display */}
        {lastBid && (
          <div className="mt-0.5 text-xs">
            {lastBid.type === 'pass' && (
              <span className="text-text-dim italic">passe</span>
            )}
            {lastBid.type === 'bid' && lastBid.suit && (
              <span className="font-mono font-bold">
                {lastBid.points}{' '}
                <span style={{ color: suitDisplayColors[lastBid.suit] }}>
                  {SUIT_SYMBOLS[lastBid.suit]}
                </span>
              </span>
            )}
            {lastBid.type === 'contrer' && (
              <span className="font-bold text-accent-red">Contre !</span>
            )}
            {lastBid.type === 'surcontrer' && (
              <span className="font-bold text-accent-red">Surcontre !</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
