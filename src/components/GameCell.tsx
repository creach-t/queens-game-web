import { Crown, X } from 'lucide-react';
import React from 'react';
import { GameCellProps } from '../types/game';

const GameCellComponent: React.FC<GameCellProps> = ({
  cell,
  size,
  showVictoryAnimation = false,
  isLoading = false
}) => {
  const iconSize = size * 0.5;
  const hatchSize = Math.max(3, size * 0.08);

  const hasConflict = cell.isInConflictLine || cell.isInConflictColumn ||
                     cell.isInConflictRegion || cell.isAroundConflictQueen;

  const cellStyle: React.CSSProperties = {
    backgroundColor: cell.state === 'queen' && (cell.isConflict || showVictoryAnimation)
      ? '#fef3c7'
      : cell.regionColor,
    width: size,
    height: size,
    backgroundImage: hasConflict && !showVictoryAnimation
      ? `repeating-linear-gradient(45deg, transparent, transparent ${hatchSize}px, rgba(239, 68, 68, 0.25) ${hatchSize}px, rgba(239, 68, 68, 0.25) ${hatchSize * 2}px)`
      : undefined
  };

  const baseClasses = isLoading
    ? "relative flex items-center justify-center border border-slate-300/50 cursor-wait select-none"
    : "relative flex items-center justify-center border border-slate-300/50 cursor-pointer select-none hover:scale-105 active:scale-95";

  return (
    <div className={baseClasses} style={cellStyle}>
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
          className="text-slate-700"
          strokeWidth={2}
        />
      )}

      {showVictoryAnimation && cell.state === 'queen' && (
        <div className="absolute inset-0 bg-yellow-200/20 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};

// React.memo avec comparateur custom — seules les cellules modifiées re-render
export const GameCell = React.memo(GameCellComponent, (prev, next) => {
  return (
    prev.cell.state === next.cell.state &&
    prev.cell.isConflict === next.cell.isConflict &&
    prev.cell.isInConflictLine === next.cell.isInConflictLine &&
    prev.cell.isInConflictColumn === next.cell.isInConflictColumn &&
    prev.cell.isInConflictRegion === next.cell.isInConflictRegion &&
    prev.cell.isAroundConflictQueen === next.cell.isAroundConflictQueen &&
    prev.cell.regionColor === next.cell.regionColor &&
    prev.size === next.size &&
    prev.showVictoryAnimation === next.showVictoryAnimation &&
    prev.isLoading === next.isLoading
  );
});
