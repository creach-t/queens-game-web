import React, { useMemo } from 'react';
import { GameState } from '../types/game';
import { GameCell } from './GameCell';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onCellClick }) => {
  // Calculer la taille des cellules en fonction de la grille et de l'écran
  const cellSize = useMemo(() => {
    const viewportWidth = Math.min(window.innerWidth * 0.9, 600);
    const viewportHeight = Math.min(window.innerHeight * 0.7, 600);
    const availableSize = Math.min(viewportWidth, viewportHeight);
    
    return Math.floor(availableSize / gameState.gridSize) - 4; // -4 pour les bordures
  }, [gameState.gridSize]);

  return (
    <div className="game-board">
      <div 
        className="game-board__grid"
        style={{
          gridTemplateColumns: `repeat(${gameState.gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gameState.gridSize}, ${cellSize}px)`,
          gap: '2px'
        }}
      >
        {gameState.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <GameCell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              size={cellSize}
              onClick={() => onCellClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  );
};