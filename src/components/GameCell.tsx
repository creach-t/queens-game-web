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
    const isConflict = cell.isConflict;
    const iconSize = Math.max(16, size * 0.6);

    switch (cell.state) {
      case 'queen':
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            className="game-cell-icon"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Tête de la couronne */}
            <path
              d="M8 4C9.10457 4 10 3.10457 10 2C10 0.895431 9.10457 0 8 0C6.89543 0 6 0.895431 6 2C6 3.10457 6.89543 4 8 4Z"
              fill={isConflict ? '#e74c3c' : '#000000'}
            />
            {/* Corps de la couronne */}
            <path
              d="M1 9V7L3 5L5.5 7L8 5L10.5 7L13 5L15 7V9L12.75 12.75L14 14V16H2V14L3.25 12.75L1 9Z"
              fill={isConflict ? '#e74c3c' : '#000000'}
            />
          </svg>
        );

      case 'marker':
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            className="game-cell-icon"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 8L8 16M8.00001 8L16 16"
              stroke={isConflict ? '#e74c3c' : '#000000'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      default:
        return null;
    }
  };

  const getCellClasses = () => {
    let classes = 'game-cell';

    // Conflit direct sur la reine
    if (cell.isConflict) {
      classes += ' game-cell--conflict';
    }

    // Types de hachures selon la règle violée
    if (cell.isInConflictLine) {
      classes += ' game-cell--conflict-line';
    }

    if (cell.isInConflictColumn) {
      classes += ' game-cell--conflict-column';
    }

    if (cell.isInConflictRegion) {
      classes += ' game-cell--conflict-region';
    }

    if (cell.isAroundConflictQueen) {
      classes += ' game-cell--around-conflict-queen';
    }

    // États normaux
    if (cell.state === 'queen') {
      classes += ' game-cell--queen';
    } else if (cell.state === 'marker') {
      classes += ' game-cell--marker';
    }

    return classes;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={getCellClasses()}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        backgroundColor: cell.regionColor,
        width: size,
        height: size,
        minWidth: size,
        minHeight: size
      }}
      title={`Cellule ${cell.row + 1}-${cell.col + 1} (Région ${cell.regionId})`}
    >
      <div className="game-cell__content">
        {getCellContent()}
      </div>
    </div>
  );
};