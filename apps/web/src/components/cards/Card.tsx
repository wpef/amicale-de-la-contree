'use client';

import { Suit, Rank, SUIT_SYMBOLS } from '@contree/engine';
import type { Card as CardType } from '@contree/engine';

interface CardProps {
  card: CardType;
  playable?: boolean;
  selected?: boolean;
  grayed?: boolean;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const suitTextColors: Record<Suit, string> = {
  [Suit.Spades]: 'text-[#1a1a2e]',
  [Suit.Hearts]: 'text-[#c0392b]',
  [Suit.Diamonds]: 'text-[#e67e22]',
  [Suit.Clubs]: 'text-[#1a6b3c]',
};

const suitBgTints: Record<Suit, string> = {
  [Suit.Spades]: 'from-slate-50 to-slate-100',
  [Suit.Hearts]: 'from-red-50/40 to-rose-50/30',
  [Suit.Diamonds]: 'from-amber-50/40 to-orange-50/30',
  [Suit.Clubs]: 'from-emerald-50/40 to-green-50/30',
};

const sizes = {
  sm: { card: 'w-10 h-14', rank: 'text-[10px]', suit: 'text-[10px]', center: 'text-lg' },
  md: { card: 'w-[52px] h-[76px]', rank: 'text-xs', suit: 'text-[10px]', center: 'text-2xl' },
  lg: { card: 'w-[68px] h-[98px]', rank: 'text-sm', suit: 'text-xs', center: 'text-3xl' },
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
  faceDown = false,
  size = 'md',
  onClick,
}: CardProps) {
  const s = sizes[size];
  const symbol = SUIT_SYMBOLS[card.suit];
  const rank = rankDisplay[card.rank];
  const color = suitTextColors[card.suit];
  const bgTint = suitBgTints[card.suit];

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

  const isInteractive = !!onClick && (playable || selected);

  if (!isInteractive) {
    return (
      <div
        className={`
          ${s.card} relative rounded-lg border-2 shadow-md overflow-hidden
          bg-gradient-to-br ${bgTint}
          ${grayed ? 'border-gray-300/50 opacity-40 saturate-0' : 'border-gray-200'}
        `}
      >
        <div className="absolute inset-[3px] rounded border border-gray-200/40 pointer-events-none" />
        <div className={`absolute top-[3px] left-[5px] flex flex-col items-center leading-none ${color}`}>
          <span className={`${s.rank} font-bold`}>{rank}</span>
          <span className={`${s.suit}`}>{symbol}</span>
        </div>
        <div className={`flex h-full w-full items-center justify-center ${color}`}>
          <span className={`${s.center} drop-shadow-sm`}>{symbol}</span>
        </div>
        <div className={`absolute bottom-[3px] right-[5px] flex flex-col items-center leading-none rotate-180 ${color}`}>
          <span className={`${s.rank} font-bold`}>{rank}</span>
          <span className={`${s.suit}`}>{symbol}</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        ${s.card} relative rounded-lg border-2 shadow-md overflow-hidden
        bg-gradient-to-br ${bgTint}
        transition-all duration-200 ease-out cursor-pointer
        ${selected
          ? '-translate-y-6 scale-110 border-gold ring-2 ring-gold/50 shadow-xl shadow-gold/20 z-50'
          : 'border-gold/40 hover:-translate-y-3 hover:shadow-lg'
        }
      `}
    >
      {/* Inner frame */}
      <div className="absolute inset-[3px] rounded border border-gray-200/40 pointer-events-none" />

      {/* Top-left corner */}
      <div className={`absolute top-[3px] left-[5px] flex flex-col items-center leading-none ${color}`}>
        <span className={`${s.rank} font-bold`}>{rank}</span>
        <span className={`${s.suit}`}>{symbol}</span>
      </div>

      {/* Center suit */}
      <div className={`flex h-full w-full items-center justify-center ${color}`}>
        <span className={`${s.center} drop-shadow-sm`}>{symbol}</span>
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className={`absolute bottom-[3px] right-[5px] flex flex-col items-center leading-none rotate-180 ${color}`}>
        <span className={`${s.rank} font-bold`}>{rank}</span>
        <span className={`${s.suit}`}>{symbol}</span>
      </div>
    </button>
  );
}
