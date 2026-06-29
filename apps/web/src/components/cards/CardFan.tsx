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

  // If it's my turn but playableCards is empty, all cards are playable (pisser/defausse)
  const allCardIds = sortedCards.map(cardId);
  const effectivePlayable =
    isMyTurn && playableCards.length === 0 && cards.length > 0
      ? allCardIds
      : playableCards;

  // When ALL cards are playable, no need to highlight/gray - show them all as "normal but clickable"
  const allPlayable = isMyTurn && effectivePlayable.length === cards.length;

  const handleCardClick = (card: CardType) => {
    const id = cardId(card);
    if (!effectivePlayable.includes(id)) return;

    if (selectedCard === id) {
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

  // Cards overlap each other horizontally, no rotation on mobile for clarity
  const cardOverlap = total <= 4 ? 0 : Math.min((total - 4) * 4, 30);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Confirm/cancel bar */}
      {selectedCard && (
        <div className="flex gap-2">
          <Button onClick={handleConfirm} className="px-5 py-1 text-sm">
            Jouer cette carte
          </Button>
          <Button onClick={handleCancel} variant="ghost" className="px-3 py-1 text-sm">
            Annuler
          </Button>
        </div>
      )}

      {/* Cards - horizontal row with overlap */}
      <div
        className="flex justify-center items-end"
        style={{ marginLeft: `${cardOverlap}px` }}
      >
        {sortedCards.map((card, i) => {
          const id = cardId(card);
          const isPlayable = effectivePlayable.includes(id);
          const isSelected = selectedCard === id;

          return (
            <div
              key={id}
              className="transition-all duration-200 ease-out shrink-0"
              style={{
                marginLeft: i === 0 ? 0 : `-${cardOverlap}px`,
                zIndex: isSelected ? 50 : i,
              }}
            >
              <Card
                card={card}
                playable={isPlayable && isMyTurn}
                selected={isSelected}
                grayed={isMyTurn && !isPlayable}
                highlight={isMyTurn && !allPlayable && isPlayable}
                size="md"
                onClick={() => handleCardClick(card)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
