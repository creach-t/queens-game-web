import React from 'react';
import { BoardGridProps } from '../../types/game';
import { getCellBorderStyle, getCellCornerRadius } from '../../utils/boardUtils';
import { GameCell } from '../GameCell';
import { AnimationOverlay } from './AnimationOverlay';

export const BoardGrid: React.FC<BoardGridProps> = ({
  gameState,
  cellSize,
  loadedCells,
  isDestroying,
  isLoading,
  showVictoryAnimation,
  onCellClick
}) => {
  return (
    <div
      className="bg-slate-800 rounded-lg shadow-inner relative overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gameState.gridSize}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${gameState.gridSize}, ${cellSize}px)`,
        gap: '0px',
        padding: '3px'
      }}
    >
      {/* Cellules du plateau */}
      {gameState.board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const position = { row: rowIndex, col: colIndex };
          const cellKey = `${rowIndex}-${colIndex}`;
          const isLoaded = loadedCells.has(cellKey);
          const borderStyle = getCellBorderStyle(gameState, position);
          const cornerRadius = getCellCornerRadius(gameState.gridSize, position);

          return (
            <div
              key={cellKey}
              className={`
                relative overflow-hidden transition-all duration-300 ease-out
                ${cornerRadius}
                ${isLoaded ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
                ${isDestroying ? 'blur-sm' : ''}
              `}
              style={borderStyle}
            >
              <GameCell
                cell={cell}
                size={cellSize}
                onClick={() => onCellClick(rowIndex, colIndex)}
                showVictoryAnimation={showVictoryAnimation}
                isLoading={!isLoaded}
              />
            </div>
          );
        })
      )}

      {/* Overlays d'animation */}
      <AnimationOverlay
        isDestroying={isDestroying}
        isLoading={isLoading}
      />
    </div>
  );
};