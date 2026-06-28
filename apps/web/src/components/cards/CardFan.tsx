'use client';

import { useMemo, useState } from 'react';
import type { Card as CardType, CardId, Suit } from '@contree/engine';
import { cardId, sortHand } from '@contree/engine';
import { Card } from './Card';
import { Button } from '../ui/Button';

interface CardFanProps {
  cards: CardType[];
  playableCards?: CardId[];
  trumpSuit?: Suit;
  isMyTurn?: boolean;
  onPlayCard?: (card: CardType) => void;
}

export function CardFan({
  cards,
  playableCards = [],
  trumpSuit,
  isMyTurn = false,
  onPlayCard,
}: CardFanProps) {
  const [selectedCard, setSelectedCard] = useState<CardId | null>(null);

  const sortedCards = useMemo(() => sortHand(cards, trumpSuit), [cards, trumpSuit]);

  const total = sortedCards.length;
  const maxSpread = Math.min(total * 5, 45);
  const spreadPerCard = total > 1 ? maxSpread / (total - 1) : 0;
  const startAngle = -maxSpread / 2;

  const handleCardClick = (card: CardType) => {
    const id = cardId(card);
    if (!playableCards.includes(id)) return;

    if (selectedCard === id) {
      // Second click = confirm play
      onPlayCard?.(card);
      setSelectedCard(null);
    } else {
      setSelectedCard(id);
    }
  };

  const handleConfirm = () => {
    if (!selectedCard) return;
    const card = sortedCards.find((c) => cardId(c) === selectedCard);
    if (card) {
      onPlayCard?.(card);
      setSelectedCard(null);
    }
  };

  const handleCancel = () => {
    setSelectedCard(null);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Confirm/cancel bar */}
      {selectedCard && (
        <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Button onClick={handleConfirm} className="px-6 py-1.5 text-sm">
            Jouer cette carte
          </Button>
          <Button onClick={handleCancel} variant="ghost" className="px-4 py-1.5 text-sm">
            Annuler
          </Button>
        </div>
      )}

      {/* Cards */}
      <div className="relative flex h-28 sm:h-32 items-end justify-center w-full max-w-[500px]">
        {sortedCards.map((card, i) => {
          const id = cardId(card);
          const isPlayable = playableCards.includes(id);
          const isSelected = selectedCard === id;
          const angle = startAngle + i * spreadPerCard;
          const yOffset = Math.abs(angle) * 0.5;

          return (
            <div
              key={id}
              className="absolute transition-all duration-300 ease-out"
              style={{
                transform: `rotate(${angle}deg) translateY(-${yOffset}px)`,
                transformOrigin: 'bottom center',
                left: `${(i / Math.max(total - 1, 1)) * (100 - (100 / total)) + (50 / total)}%`,
                marginLeft: '-34px',
                zIndex: isSelected ? 50 : i,
              }}
            >
              <Card
                card={card}
                playable={isPlayable && isMyTurn}
                selected={isSelected}
                grayed={isMyTurn && !isPlayable}
                size="lg"
                onClick={() => handleCardClick(card)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
