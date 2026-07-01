'use client';

import { useState } from 'react';
import { Suit, SUIT_SYMBOLS, CAPOT_VALUE, GENERALE_VALUE } from '@contree/engine';
import type { BidPoints } from '@contree/engine';
import { Button } from '../ui/Button';

const suitDisplayColors: Record<Suit, string> = {
  [Suit.Spades]: '#4a6fa5',
  [Suit.Hearts]: '#e74c3c',
  [Suit.Diamonds]: '#f39c12',
  [Suit.Clubs]: '#2ecc71',
};

interface BiddingPanelProps {
  isMyTurn: boolean;
  highestBid: { points: number; suit: string } | null;
  canContrer: boolean;
  canSurcontrer: boolean;
  onBid: (points: BidPoints, suit: Suit) => void;
  onPass: () => void;
  onContrer: () => void;
  onSurcontrer: () => void;
}

const SPECIAL_BIDS = [
  { value: CAPOT_VALUE as BidPoints, label: 'Capot' },
  { value: GENERALE_VALUE as BidPoints, label: 'Generale' },
];

export function BiddingPanel({
  isMyTurn,
  highestBid,
  canContrer,
  canSurcontrer,
  onBid,
  onPass,
  onContrer,
  onSurcontrer,
}: BiddingPanelProps) {
  const minBid = highestBid ? highestBid.points + 10 : 80;
  const [selectedValue, setSelectedValue] = useState<BidPoints>(Math.max(minBid, 80) as BidPoints);
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);

  const canIncrement = selectedValue < 160;
  const canDecrement = selectedValue > minBid;

  const increment = () => {
    if (selectedValue < 160) setSelectedValue((selectedValue + 10) as BidPoints);
  };
  const decrement = () => {
    if (selectedValue > minBid) setSelectedValue((selectedValue - 10) as BidPoints);
  };

  const handleBid = () => {
    if (selectedSuit && selectedValue >= minBid) {
      onBid(selectedValue, selectedSuit);
      setSelectedSuit(null);
    }
  };

  if (!isMyTurn) {
    return (
      <div className="rounded-lg border border-border bg-surface/80 px-4 py-3 text-center backdrop-blur">
        <p className="text-text-dim">En attente des encheres...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gold/30 bg-surface/90 p-3 backdrop-blur">
      <h3 className="mb-2 text-center text-sm font-semibold text-gold">Ton enchere</h3>

      {/* Suit selection */}
      <div className="mb-2 flex justify-center gap-2">
        {Object.values(Suit).map((suit) => (
          <button
            key={suit}
            onClick={() => setSelectedSuit(suit)}
            className={`rounded-lg px-3 py-1.5 text-2xl font-bold transition ${
              selectedSuit === suit
                ? 'ring-2 ring-gold bg-gold/10'
                : 'bg-surface-raised hover:bg-border'
            }`}
            style={{ color: suitDisplayColors[suit] }}
          >
            {SUIT_SYMBOLS[suit]}
          </button>
        ))}
      </div>

      {/* Value: +/- stepper */}
      <div className="mb-2 flex items-center justify-center gap-3">
        <button
          onClick={decrement}
          disabled={!canDecrement}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-lg font-bold text-text transition hover:bg-border disabled:opacity-30"
        >
          -
        </button>
        <span className="w-16 text-center font-mono text-2xl font-bold text-gold">
          {selectedValue}
        </span>
        <button
          onClick={increment}
          disabled={!canIncrement}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-lg font-bold text-text transition hover:bg-border disabled:opacity-30"
        >
          +
        </button>
      </div>

      {/* Special bids */}
      {minBid <= GENERALE_VALUE && (
        <div className="mb-2 flex justify-center gap-2">
          {SPECIAL_BIDS.filter((s) => s.value >= minBid).map((special) => (
            <button
              key={special.value}
              onClick={() => setSelectedValue(special.value)}
              className={`rounded px-3 py-1 text-xs font-semibold transition ${
                selectedValue === special.value
                  ? 'bg-gold text-bg'
                  : 'bg-surface-raised text-text hover:bg-border'
              }`}
            >
              {special.label}
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={onPass} variant="ghost" className="flex-1">
          Passer
        </Button>
        {canContrer && (
          <Button onClick={onContrer} variant="secondary" className="flex-1">
            Contrer
          </Button>
        )}
        {canSurcontrer && (
          <Button onClick={onSurcontrer} variant="secondary" className="flex-1">
            Surcontrer
          </Button>
        )}
        <Button
          onClick={handleBid}
          disabled={!selectedSuit || selectedValue < minBid}
          className="flex-1"
        >
          {selectedValue}
          {selectedSuit && (
            <span style={{ color: suitDisplayColors[selectedSuit] }} className="ml-1 text-lg">
              {SUIT_SYMBOLS[selectedSuit]}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
