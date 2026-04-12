'use client';

import { Suit, Rank, SUIT_SYMBOLS, RANK_NAMES_FR } from '@contree/engine';
import type { Card as CardType } from '@contree/engine';

interface CardProps {
  card: CardType;
  playable?: boolean;
  selected?: boolean;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const suitColors: Record<Suit, string> = {
  [Suit.Spades]: 'text-[#2C3E50]',
  [Suit.Hearts]: 'text-[#C0392B]',
  [Suit.Diamonds]: 'text-[#E67E22]',
  [Suit.Clubs]: 'text-[#27AE60]',
};

const sizes = {
  sm: 'w-10 h-14 text-xs',
  md: 'w-14 h-20 text-sm',
  lg: 'w-20 h-28 text-base',
};

export function Card({ card, playable = false, selected = false, faceDown = false, size = 'md', onClick }: CardProps) {
  if (faceDown) {
    return (
      <div className={`${sizes[size]} flex items-center justify-center rounded-lg border border-border bg-gradient-to-br from-[#1a237e] to-[#0d1b3e] shadow-md`}>
        <span className="text-gold/30 text-2xl">{SUIT_SYMBOLS[Suit.Clubs]}</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!playable}
      className={`${sizes[size]} flex flex-col items-center justify-center rounded-lg border bg-white shadow-md transition-transform ${
        playable
          ? 'cursor-pointer border-gold/50 hover:-translate-y-2 hover:shadow-lg'
          : 'cursor-default border-gray-200'
      } ${selected ? '-translate-y-3 ring-2 ring-gold' : ''} ${suitColors[card.suit]}`}
    >
      <span className="font-bold leading-none">{card.rank}</span>
      <span className="text-lg leading-none">{SUIT_SYMBOLS[card.suit]}</span>
    </button>
  );
}
