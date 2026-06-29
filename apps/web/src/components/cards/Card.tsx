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
  [Suit.Spades]: '#4a6fa5',
  [Suit.Hearts]: '#e74c3c',
  [Suit.Diamonds]: '#f39c12',
  [Suit.Clubs]: '#2ecc71',
};

const sizes = {
  sm: { w: 40, h: 56 },
  md: { w: 52, h: 76 },
  lg: { w: 68, h: 98 },
};

const rankDisplay: Record<Rank, string> = {
  [Rank.Seven]: '7', [Rank.Eight]: '8', [Rank.Nine]: '9', [Rank.Ten]: '10',
  [Rank.Jack]: 'V', [Rank.Queen]: 'D', [Rank.King]: 'R', [Rank.Ace]: 'A',
};

function CardSVG({ card, w, h }: { card: CardType; w: number; h: number }) {
  const symbol = SUIT_SYMBOLS[card.suit];
  const rank = rankDisplay[card.rank];
  const color = suitColors[card.suit];

  // Scale everything relative to a 130x190 viewBox
  return (
    <svg width={w} height={h} viewBox="0 0 130 190" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <defs>
        <linearGradient id={`bg-${card.suit}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#16213e" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="128" height="188" rx="10" fill={`url(#bg-${card.suit})`} />

      {/* Gold inner frame */}
      <rect x="7" y="7" width="116" height="176" rx="6" fill="none" stroke="#d4af37" strokeWidth="0.5" opacity="0.3" />

      {/* Top-left corner: rank + suit */}
      <text x="15" y="28" fontFamily="Georgia, serif" fontSize="16" fontWeight="bold" fill={color}>{rank}</text>
      <text x="16" y="44" fontSize="14" fill={color}>{symbol}</text>

      {/* Bottom-right corner (rotated) */}
      <g transform="rotate(180, 65, 95)">
        <text x="15" y="28" fontFamily="Georgia, serif" fontSize="16" fontWeight="bold" fill={color}>{rank}</text>
        <text x="16" y="44" fontSize="14" fill={color}>{symbol}</text>
      </g>

      {/* Center: BIG suit symbol */}
      <text x="65" y="78" fontSize="62" fill={color} textAnchor="middle" dominantBaseline="middle" opacity="0.15">{symbol}</text>
      <text x="65" y="78" fontSize="50" fill={color} textAnchor="middle" dominantBaseline="middle">{symbol}</text>

      {/* Rank below symbol in gold */}
      <text x="65" y="128" fontFamily="Georgia, serif" fontSize="38" fontWeight="bold" fill="#d4af37" textAnchor="middle">{rank}</text>
    </svg>
  );
}

function CardBack({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 130 190" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="back-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#16213e" />
        </linearGradient>
        <pattern id="back-pattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="none" />
          <circle cx="8" cy="8" r="1" fill="#d4af37" opacity="0.15" />
        </pattern>
      </defs>
      <rect x="1" y="1" width="128" height="188" rx="10" fill="url(#back-bg)" stroke="#d4af37" strokeWidth="1" />
      <rect x="7" y="7" width="116" height="176" rx="6" fill="url(#back-pattern)" stroke="#d4af37" strokeWidth="0.4" opacity="0.4" />
      <text x="65" y="95" fontSize="28" fill="#d4af37" textAnchor="middle" dominantBaseline="middle" opacity="0.2">♠</text>
    </svg>
  );
}

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
  const { w, h } = sizes[size];

  if (faceDown) {
    return (
      <div className="inline-block rounded-lg shadow-md overflow-hidden">
        <CardBack w={w} h={h} />
      </div>
    );
  }

  let stateClasses: string;
  if (selected) {
    stateClasses = '-translate-y-4 scale-105 ring-2 ring-gold/60 shadow-xl shadow-gold/20 z-50';
  } else if (grayed) {
    stateClasses = 'opacity-30';
  } else if (highlight) {
    stateClasses = 'ring-2 ring-gold/50 cursor-pointer hover:-translate-y-2 hover:shadow-lg';
  } else if (playable) {
    stateClasses = 'cursor-pointer hover:-translate-y-2 hover:shadow-lg';
  } else {
    stateClasses = '';
  }

  const isClickable = !!onClick && (playable || selected);

  const svgContent = <CardSVG card={card} w={w} h={h} />;
  const baseClasses = `inline-block rounded-lg shadow-md overflow-hidden transition-all duration-200 ease-out ${stateClasses}`;

  if (isClickable) {
    return <button onClick={onClick} className={baseClasses}>{svgContent}</button>;
  }

  return <div className={baseClasses}>{svgContent}</div>;
}
