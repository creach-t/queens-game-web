import React, { useMemo } from 'react';
import { GameState } from '../types/game';
import { GameCell } from './GameCell';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onCellClick }) => {
  // Calculer la taille des cellules
  const cellSize = useMemo(() => {
    const viewportWidth = Math.min(window.innerWidth * 0.9, 600);
    const viewportHeight = Math.min(window.innerHeight * 0.7, 600);
    const availableSize = Math.min(viewportWidth, viewportHeight);
    
    return Math.floor(availableSize / gameState.gridSize) - 6;
  }, [gameState.gridSize]);

  // Calculer les bordures de régions avec une approche plus simple
  const getCellBorderStyle = (row: number, col: number) => {
    const cell = gameState.board[row][col];
    const borderStyle: React.CSSProperties = {};
    const borderWidth = 3;
    const borderColor = '#2c3e50';
    
    // Vérifier bordure top
    if (row === 0 || gameState.board[row - 1][col].regionId !== cell.regionId) {
      borderStyle.borderTop = `${borderWidth}px solid ${borderColor}`;
    }
    
    // Vérifier bordure right  
    if (col === gameState.gridSize - 1 || gameState.board[row][col + 1].regionId !== cell.regionId) {
      borderStyle.borderRight = `${borderWidth}px solid ${borderColor}`;
    }
    
    // Vérifier bordure bottom
    if (row === gameState.gridSize - 1 || gameState.board[row + 1][col].regionId !== cell.regionId) {
      borderStyle.borderBottom = `${borderWidth}px solid ${borderColor}`;
    }
    
    // Vérifier bordure left
    if (col === 0 || gameState.board[row][col - 1].regionId !== cell.regionId) {
      borderStyle.borderLeft = `${borderWidth}px solid ${borderColor}`;
    }
    
    return borderStyle;
  };

  return (
    <div className="game-board">
      <div 
        className="game-board__grid"
        style={{
          gridTemplateColumns: `repeat(${gameState.gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gameState.gridSize}, ${cellSize}px)`,
          gap: '0px'
        }}
      >
        {gameState.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const borderStyle = getCellBorderStyle(rowIndex, colIndex);
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="game-cell-wrapper"
                style={borderStyle}
              >
                <GameCell
                  cell={cell}
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
