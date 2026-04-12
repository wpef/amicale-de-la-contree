'use client';

import type { Card as CardType, CardId } from '@contree/engine';
import { Card } from './Card';

interface CardFanProps {
  cards: CardType[];
  playableCards?: CardId[];
  onPlayCard?: (card: CardType) => void;
}

export function CardFan({ cards, playableCards = [], onPlayCard }: CardFanProps) {
  const total = cards.length;
  const maxSpread = 40; // degrees
  const spreadPerCard = total > 1 ? maxSpread / (total - 1) : 0;
  const startAngle = -maxSpread / 2;

  return (
    <div className="relative flex h-32 items-end justify-center">
      {cards.map((card, i) => {
        const cardId = `${card.suit}-${card.rank}` as CardId;
        const isPlayable = playableCards.includes(cardId);
        const angle = startAngle + i * spreadPerCard;
        const yOffset = Math.abs(angle) * 0.3;

        return (
          <div
            key={cardId}
            className="absolute transition-transform duration-200"
            style={{
              transform: `rotate(${angle}deg) translateY(-${yOffset}px)`,
              transformOrigin: 'bottom center',
              left: `${(i / total) * 70 + 15}%`,
              zIndex: i,
            }}
          >
            <Card
              card={card}
              playable={isPlayable}
              size="lg"
              onClick={isPlayable && onPlayCard ? () => onPlayCard(card) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
