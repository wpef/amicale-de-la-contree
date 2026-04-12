'use client';

import { useState } from 'react';
import { Suit, SUIT_SYMBOLS, BID_VALUES, CAPOT_VALUE, GENERALE_VALUE } from '@contree/engine';
import type { BidPoints } from '@contree/engine';
import { Button } from '../ui/Button';

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

const allBidValues: BidPoints[] = [...BID_VALUES, CAPOT_VALUE, GENERALE_VALUE];

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
  const [selectedValue, setSelectedValue] = useState<BidPoints | null>(null);
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);

  const minBid = highestBid ? highestBid.points + 10 : 80;
  const availableValues = allBidValues.filter((v) => v >= minBid);

  const handleBid = () => {
    if (selectedValue && selectedSuit) {
      onBid(selectedValue, selectedSuit);
      setSelectedValue(null);
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
    <div className="rounded-lg border border-gold/30 bg-surface/90 p-4 backdrop-blur">
      <h3 className="mb-3 text-center text-sm font-semibold text-gold">Ton enchere</h3>

      {/* Suit selection */}
      <div className="mb-3 flex justify-center gap-2">
        {Object.values(Suit).map((suit) => (
          <button
            key={suit}
            onClick={() => setSelectedSuit(suit)}
            className={`rounded-lg px-3 py-2 text-xl transition ${
              selectedSuit === suit
                ? 'bg-gold/20 ring-2 ring-gold'
                : 'bg-surface-raised hover:bg-border'
            }`}
          >
            {SUIT_SYMBOLS[suit]}
          </button>
        ))}
      </div>

      {/* Value selection */}
      <div className="mb-3 flex flex-wrap justify-center gap-1">
        {availableValues.map((value) => (
          <button
            key={value}
            onClick={() => setSelectedValue(value)}
            className={`rounded px-2 py-1 text-xs font-mono transition ${
              selectedValue === value
                ? 'bg-gold text-bg'
                : 'bg-surface-raised text-text hover:bg-border'
            }`}
          >
            {value === CAPOT_VALUE ? 'Capot' : value === GENERALE_VALUE ? 'Generale' : value}
          </button>
        ))}
      </div>

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
          disabled={!selectedValue || !selectedSuit}
          className="flex-1"
        >
          Enchérir
        </Button>
      </div>
    </div>
  );
}
