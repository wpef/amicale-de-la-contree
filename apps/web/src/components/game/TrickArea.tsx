'use client';

import type { TrickCard } from '@contree/engine';
import { SUIT_SYMBOLS } from '@contree/engine';
import { Card } from '../cards/Card';

interface TrickAreaProps {
  cards: TrickCard[];
  mySeat: string;
}

/** Position of each played card relative to the center, oriented for the current player */
function getCardPosition(
  cardSeat: string,
  mySeat: string,
): { top: string; left: string } {
  const seats = ['north', 'east', 'south', 'west'];
  const myIndex = seats.indexOf(mySeat);
  const cardIndex = seats.indexOf(cardSeat);
  const relativeIndex = (cardIndex - myIndex + 4) % 4;

  // 0 = me (bottom), 1 = right, 2 = top, 3 = left
  switch (relativeIndex) {
    case 0:
      return { top: '60%', left: '50%' };
    case 1:
      return { top: '50%', left: '65%' };
    case 2:
      return { top: '30%', left: '50%' };
    case 3:
      return { top: '50%', left: '35%' };
    default:
      return { top: '50%', left: '50%' };
  }
}

export function TrickArea({ cards, mySeat }: TrickAreaProps) {
  return (
    <div className="relative h-48 w-48">
      {cards.map((tc) => {
        const pos = getCardPosition(tc.seat, mySeat);
        return (
          <div
            key={`${tc.card.suit}-${tc.card.rank}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{ top: pos.top, left: pos.left }}
          >
            <Card card={tc.card} size="md" />
          </div>
        );
      })}
    </div>
  );
}
