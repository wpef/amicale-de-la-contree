'use client';

import { Suit, Rank, SUIT_SYMBOLS } from '@contree/engine';
import type { Card as CardType } from '@contree/engine';

interface CardProps {
  card: CardType;
  playable?: boolean;
  selected?: boolean;
  grayed?: boolean;
  highlight?: boolean;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const suitColors: Record<Suit, string> = {
  [Suit.Spades]: 'text-[#1a1a2e]',
  [Suit.Hearts]: 'text-[#c0392b]',
  [Suit.Diamonds]: 'text-[#e67e22]',
  [Suit.Clubs]: 'text-[#1a6b3c]',
};

const sizes = {
  sm: { card: 'w-10 h-14', rank: 'text-lg', corner: 'text-[9px]' },
  md: { card: 'w-[52px] h-[76px]', rank: 'text-2xl', corner: 'text-[11px]' },
  lg: { card: 'w-[68px] h-[98px]', rank: 'text-3xl', corner: 'text-sm' },
};

const rankDisplay: Record<Rank, string> = {
  [Rank.Seven]: '7', [Rank.Eight]: '8', [Rank.Nine]: '9', [Rank.Ten]: '10',
  [Rank.Jack]: 'V', [Rank.Queen]: 'D', [Rank.King]: 'R', [Rank.Ace]: 'A',
};

export function Card({
  card,
  playable = false,
  selected = false,
  grayed = false,
  highlight = false,
  faceDown = false,
  size = 'md',
  onClick,
}: CardProps) {
  const s = sizes[size];
  const symbol = SUIT_SYMBOLS[card.suit];
  const rank = rankDisplay[card.rank];
  const color = suitColors[card.suit];

  if (faceDown) {
    return (
      <div
        className={`${s.card} rounded-lg border-2 border-[#2a3a5e] shadow-md overflow-hidden`}
        style={{
          background: 'repeating-conic-gradient(#1a237e 0% 25%, #0d1b3e 0% 50%) 50% / 12px 12px',
        }}
      >
        <div className="flex h-full w-full items-center justify-center bg-[#1a237e]/30">
          <span className="text-gold/20 text-xl">{SUIT_SYMBOLS[Suit.Clubs]}</span>
        </div>
      </div>
    );
  }

  let stateClasses: string;
  if (selected) {
    stateClasses = '-translate-y-4 scale-105 border-gold ring-2 ring-gold/50 shadow-xl shadow-gold/20 z-50';
  } else if (grayed) {
    stateClasses = 'border-gray-300 opacity-30';
  } else if (highlight) {
    stateClasses = 'border-gold/60 cursor-pointer hover:-translate-y-2 hover:shadow-lg';
  } else if (playable) {
    stateClasses = 'border-gray-300 cursor-pointer hover:-translate-y-2 hover:shadow-lg';
  } else {
    stateClasses = 'border-gray-300';
  }

  const isClickable = !!onClick && (playable || selected);

  const content = (
    <>
      {/* Top-left corner: suit */}
      <div className={`absolute top-1 left-1 ${color}`}>
        <span className={`${s.corner} font-bold`}>{symbol}</span>
      </div>
      {/* Center: big rank + suit below */}
      <div className={`flex h-full w-full flex-col items-center justify-center ${color}`}>
        <span className={`${s.rank} font-extrabold leading-none`}>{rank}</span>
        <span className="text-sm leading-none mt-0.5">{symbol}</span>
      </div>
      {/* Bottom-right corner: suit (rotated) */}
      <div className={`absolute bottom-1 right-1 rotate-180 ${color}`}>
        <span className={`${s.corner} font-bold`}>{symbol}</span>
      </div>
    </>
  );

  const baseClasses = `${s.card} relative rounded-lg border-2 shadow-md overflow-hidden bg-white transition-all duration-200 ease-out ${stateClasses}`;

  if (isClickable) {
    return <button onClick={onClick} className={baseClasses}>{content}</button>;
  }

  return <div className={baseClasses}>{content}</div>;
}
