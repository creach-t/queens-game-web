import { Crown, X } from 'lucide-react';
import React from 'react';
import { GameCellProps } from '../types/game';

export const GameCell: React.FC<GameCellProps> = ({
  cell,
  size,
  onClick,
  showVictoryAnimation = false,
  isLoading = false
}) => {
  // Calculs directs - pas de fonctions
  const iconSize = size * 0.5;
  const hatchSize = Math.max(3, size * 0.08);

  const hasConflict = cell.isInConflictLine || cell.isInConflictColumn ||
                     cell.isInConflictRegion || cell.isAroundConflictQueen;

  // Style unifié - pas de recalculs
  const cellStyle = {
    backgroundColor: cell.state === 'queen' && (cell.isConflict || showVictoryAnimation)
      ? '#fef3c7'
      : cell.regionColor,
    width: size,
    height: size,
    backgroundImage: hasConflict && !showVictoryAnimation
      ? `repeating-linear-gradient(45deg, transparent, transparent ${hatchSize}px, rgba(239, 68, 68, 0.25) ${hatchSize}px, rgba(239, 68, 68, 0.25) ${hatchSize * 2}px)`
      : undefined
  };

  // Classes statiques - pas de concaténation
  const baseClasses = isLoading
    ? "relative flex items-center justify-center border border-slate-300/50 cursor-wait select-none"
    : "relative flex items-center justify-center border border-slate-300/50 cursor-pointer select-none hover:scale-105 active:scale-95";

  return (
    <div
      className={baseClasses}
      onClick={isLoading ? undefined : onClick}
      style={cellStyle}
    >
      {cell.state === 'queen' && (
        <Crown
          size={iconSize}
          className={
            showVictoryAnimation ? 'text-yellow-500 animate-bounce' :
            cell.isConflict ? 'text-red-600' : 'text-slate-800'
          }
          fill="currentColor"
        />
      )}

      {cell.state === 'marked' && (
        <X
          size={iconSize * 0.8}
          className="text-slate-600"
          strokeWidth={1.5}
        />
      )}

      {showVictoryAnimation && cell.state === 'queen' && (
        <div className="absolute inset-0 bg-yellow-200/20 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};