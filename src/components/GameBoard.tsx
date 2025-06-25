import React, { useMemo, useRef } from 'react';
import { GameState } from '../types/game';
import './GameBoard.css';
import { GameCell } from './GameCell';

interface GameBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onCellClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const cellSize = useMemo(() => {
    const maxWidth = Math.min(600, window.innerWidth * 0.8);
    const maxHeight = Math.min(600, window.innerHeight * 0.7);
    const availableSize = Math.min(maxWidth, maxHeight);

    return Math.floor(availableSize / gameState.gridSize) - 4;
  }, [gameState.gridSize]);

  const getCellBorderStyle = (row: number, col: number) => {
    const cell = gameState.board[row][col];
    const style: React.CSSProperties = {};
    const thin = '1px solid #37474F';
    const thick = '4px solid #37474F';

    if (row === 0) {
      style.borderTop = thick;
    }

    if (col === 0) {
      style.borderLeft = thick;
    }

    if (col === gameState.gridSize - 1) {
      style.borderRight = thick;
    } else {
      const rightNeighbor = gameState.board[row][col + 1];
      style.borderRight = (rightNeighbor.regionId === cell.regionId) ? thin : thick;
    }

    if (row === gameState.gridSize - 1) {
      style.borderBottom = thick;
    } else {
      const bottomNeighbor = gameState.board[row + 1][col];
      style.borderBottom = (bottomNeighbor.regionId === cell.regionId) ? thin : thick;
    }

    return style;
  };

  return (
    <div className="game-board-">
      <div
        ref={containerRef}
        className="game-board__grid-"
        style={{
          gridTemplateColumns: `repeat(${gameState.gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gameState.gridSize}, ${cellSize}px)`,
        }}
      >
        {gameState.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellWithBorders = {
              ...cell,
              regionColor: cell.regionColor
            };

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="game-cell-wrapper-"
                style={getCellBorderStyle(rowIndex, colIndex)}
              >
                <GameCell
                  cell={cellWithBorders}
                  size={cellSize}
                  onClick={() => onCellClick(rowIndex, colIndex)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};