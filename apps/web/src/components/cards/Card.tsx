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
  [Rank.Jack]: 'J', [Rank.Queen]: 'Q', [Rank.King]: 'K', [Rank.Ace]: 'A',
};

const isFigure = (rank: Rank) =>
  rank === Rank.Jack || rank === Rank.Queen || rank === Rank.King || rank === Rank.Ace;

function SuitFiligrane({ suit, color }: { suit: Suit; color: string }) {
  switch (suit) {
    case Suit.Hearts:
      return (
        <>
          <path d="M65 160 C65 160, 15 115, 15 70 C15 45, 35 30, 55 38 C60 40, 63 44, 65 50 C67 44, 70 40, 75 38 C95 30, 115 45, 115 70 C115 115, 65 160, 65 160Z"
            fill="none" stroke={color} strokeWidth="3" opacity="0.25"/>
          <path d="M65 155 C65 155, 20 112, 20 72 C20 50, 38 36, 55 42 C60 44, 63 48, 65 54 C67 48, 70 44, 75 42 C92 36, 110 50, 110 72 C110 112, 65 155, 65 155Z"
            fill="none" stroke={color} strokeWidth="1.5" opacity="0.12"/>
        </>
      );
    case Suit.Spades:
      return (
        <>
          <path d="M65 25 C65 25, 15 75, 15 105 C15 130, 35 145, 55 135 C60 133, 63 128, 65 122 C67 128, 70 133, 75 135 C95 145, 115 130, 115 105 C115 75, 65 25, 65 25Z"
            fill="none" stroke={color} strokeWidth="3" opacity="0.25"/>
          <path d="M65 30 C65 30, 20 77, 20 105 C20 127, 38 140, 55 132 C60 130, 63 125, 65 120 C67 125, 70 130, 75 132 C92 140, 110 127, 110 105 C110 77, 65 30, 65 30Z"
            fill="none" stroke={color} strokeWidth="1.5" opacity="0.12"/>
          <line x1="65" y1="135" x2="65" y2="165" stroke={color} strokeWidth="2.5" opacity="0.2"/>
          <line x1="50" y1="165" x2="80" y2="165" stroke={color} strokeWidth="2.5" opacity="0.2"/>
        </>
      );
    case Suit.Diamonds:
      return (
        <>
          <path d="M65 20 L115 95 L65 170 L15 95 Z"
            fill="none" stroke={color} strokeWidth="3" opacity="0.25"/>
          <path d="M65 28 L110 95 L65 162 L20 95 Z"
            fill="none" stroke={color} strokeWidth="1.5" opacity="0.12"/>
        </>
      );
    case Suit.Clubs:
      return (
        <>
          <circle cx="65" cy="60" r="30" fill="none" stroke={color} strokeWidth="3" opacity="0.25"/>
          <circle cx="40" cy="95" r="30" fill="none" stroke={color} strokeWidth="3" opacity="0.25"/>
          <circle cx="90" cy="95" r="30" fill="none" stroke={color} strokeWidth="3" opacity="0.25"/>
          <circle cx="65" cy="60" r="26" fill="none" stroke={color} strokeWidth="1.5" opacity="0.12"/>
          <circle cx="40" cy="95" r="26" fill="none" stroke={color} strokeWidth="1.5" opacity="0.12"/>
          <circle cx="90" cy="95" r="26" fill="none" stroke={color} strokeWidth="1.5" opacity="0.12"/>
          <line x1="65" y1="120" x2="65" y2="165" stroke={color} strokeWidth="2.5" opacity="0.2"/>
          <line x1="50" y1="165" x2="80" y2="165" stroke={color} strokeWidth="2.5" opacity="0.2"/>
        </>
      );
  }
}

function CardSVG({ card, w, h }: { card: CardType; w: number; h: number }) {
  const rank = rankDisplay[card.rank];
  const color = suitColors[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];
  const valueColor = isFigure(card.rank) ? '#d4af37' : color;
  const fontSize = rank === '10' ? 46 : 52;
  const cornerSize = rank === '10' ? 12 : 13;

  return (
    <svg width={w} height={h} viewBox="0 0 130 190" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`bg-${card.suit}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#16213e" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="128" height="188" rx="10" fill={`url(#bg-${card.suit})`} stroke="#d4af37" strokeWidth="0.8" />

      {/* Filigrane */}
      <SuitFiligrane suit={card.suit} color={color} />

      {/* Value */}
      <text x="65" y="105" fontFamily="Georgia, serif" fontSize={fontSize} fontWeight="bold" fill={valueColor} textAnchor="middle" dominantBaseline="middle">{rank}</text>

      {/* Top-left corner */}
      <text x="11" y="22" fontFamily="Georgia, serif" fontSize={cornerSize} fontWeight="bold" fill={color}>{rank}</text>
      <text x="11" y="36" fontSize="12" fill={color}>{symbol}</text>

      {/* Bottom-right corner */}
      <g transform="rotate(180, 65, 95)">
        <text x="11" y="22" fontFamily="Georgia, serif" fontSize={cornerSize} fontWeight="bold" fill={color}>{rank}</text>
        <text x="11" y="36" fontSize="12" fill={color}>{symbol}</text>
      </g>
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
        <pattern id="back-pat" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="1" fill="#d4af37" opacity="0.15" />
        </pattern>
      </defs>
      <rect x="1" y="1" width="128" height="188" rx="10" fill="url(#back-bg)" stroke="#d4af37" strokeWidth="1" />
      <rect x="7" y="7" width="116" height="176" rx="6" fill="url(#back-pat)" stroke="#d4af37" strokeWidth="0.4" opacity="0.4" />
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
    stateClasses = 'opacity-25';
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
