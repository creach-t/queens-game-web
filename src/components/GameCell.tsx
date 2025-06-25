import React from 'react';
import { GameCell as GameCellType } from '../types/game';
import './GameCell.css';

interface GameCellProps {
  cell: GameCellType;
  size: number;
  onClick: () => void;
}

export const GameCell: React.FC<GameCellProps> = ({ cell, size, onClick }) => {
  const getCellContent = () => {
    switch (cell.state) {
      case 'queen':
        return '♛';
      case 'marker':
        return '✗';
      default:
        return '';
    }
  };

  const getCellClasses = () => {
    let classes = 'game-cell';
    
    if (cell.isConflict) {
      classes += ' game-cell--conflict';
    }
    
    if (cell.isHighlighted) {
      classes += ' game-cell--highlighted';
    }
    
    if (cell.state === 'queen') {
      classes += ' game-cell--queen';
    } else if (cell.state === 'marker') {
      classes += ' game-cell--marker';
    }
    
    return classes;
  };

  return (
    <div
      className={getCellClasses()}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        backgroundColor: cell.regionColor,
        width: size,
        height: size,
        minWidth: size,
        minHeight: size
      }}
      title={`Cellule ${cell.row + 1}-${cell.col + 1} (Région ${cell.regionId})`}
    >
      <span className="game-cell__content">
        {getCellContent()}
      </span>
    </div>
  );
};
