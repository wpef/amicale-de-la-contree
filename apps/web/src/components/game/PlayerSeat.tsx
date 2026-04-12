'use client';

interface PlayerSeatProps {
  name: string;
  seat: string;
  team: 'team1' | 'team2';
  cardCount: number;
  isCurrentPlayer: boolean;
  isConnected: boolean;
  position: 'top' | 'left' | 'right' | 'bottom';
}

const positionClasses = {
  top: 'top-2 left-1/2 -translate-x-1/2',
  bottom: 'bottom-2 left-1/2 -translate-x-1/2',
  left: 'left-2 top-1/2 -translate-y-1/2',
  right: 'right-2 top-1/2 -translate-y-1/2',
};

const teamColors = {
  team1: 'border-team1',
  team2: 'border-team2',
};

export function PlayerSeat({
  name,
  seat,
  team,
  cardCount,
  isCurrentPlayer,
  isConnected,
  position,
}: PlayerSeatProps) {
  return (
    <div className={`absolute ${positionClasses[position]} z-10`}>
      <div
        className={`rounded-lg border-2 ${teamColors[team]} ${
          isCurrentPlayer ? 'bg-gold/20 ring-2 ring-gold' : 'bg-surface/80'
        } px-3 py-1.5 text-center backdrop-blur`}
      >
        <div className="flex items-center gap-2">
          {!isConnected && <span className="h-2 w-2 rounded-full bg-accent-red" />}
          <span className="text-sm font-medium text-text">{name}</span>
          <span className="text-xs text-text-dim">({cardCount})</span>
        </div>
      </div>
    </div>
  );
}
