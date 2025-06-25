import React, { useMemo, useRef } from 'react';
import { GameState } from '../types/game';
import { GameCell } from './GameCell';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onCellClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calcul responsive de la taille des cellules avec approche professionnelle
  const cellSize = useMemo(() => {
    const maxWidth = Math.min(600, window.innerWidth * 0.8);
    const maxHeight = Math.min(600, window.innerHeight * 0.7);
    const availableSize = Math.min(maxWidth, maxHeight);
    
    return Math.floor(availableSize / gameState.gridSize) - 4;
  }, [gameState.gridSize]);

  // Calculer les bordures de régions de manière optimisée
  const getCellBorderStyle = (row: number, col: number) => {
    const cell = gameState.board[row][col];
    const borderStyle: React.CSSProperties = {};
    const borderWidth = 2;
    const borderColor = '#37474F';
    
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
    <div className="game-board-professional">
      <div 
        ref={containerRef}
        className="game-board__grid-professional"
        style={{
          gridTemplateColumns: `repeat(${gameState.gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gameState.gridSize}, ${cellSize}px)`,
        }}
      >
        {gameState.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            // Fusionner les styles de bordure pour les régions
            const cellWithBorders = {
              ...cell,
              regionColor: cell.regionColor
            };
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="game-cell-wrapper-professional"
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