'use client';

import type { BidAction } from '@contree/engine';
import { SUIT_SYMBOLS } from '@contree/engine';

interface BidHistoryProps {
  bids: BidAction[];
  playerNames: Record<string, string>;
}

export function BidHistory({ bids, playerNames }: BidHistoryProps) {
  if (bids.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-surface/80 px-3 py-2 backdrop-blur">
      <h4 className="mb-1.5 text-center text-xs font-semibold text-text-dim">Encheres</h4>
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
        {bids.map((action, i) => {
          const pid = action.type === 'bid' ? action.bid.playerId : action.playerId;
          const name = playerNames[pid] ?? '?';
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-text w-16 truncate">{name}</span>
              {action.type === 'pass' && (
                <span className="text-text-dim italic">passe</span>
              )}
              {action.type === 'bid' && (
                <span className="font-mono font-bold text-gold">
                  {action.bid.points} {SUIT_SYMBOLS[action.bid.suit]}
                </span>
              )}
              {action.type === 'contrer' && (
                <span className="font-bold text-accent-red">Contre !</span>
              )}
              {action.type === 'surcontrer' && (
                <span className="font-bold text-accent-red">Surcontre !</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
