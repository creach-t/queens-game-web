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

  // Calculer les bordures de régions
  const getRegionBorders = useMemo(() => {
    const borders: { [key: string]: string[] } = {};
    
    gameState.board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellKey = `${rowIndex}-${colIndex}`;
        const cellBorders: string[] = [];
        
        // Vérifier bordure top
        if (rowIndex === 0 || gameState.board[rowIndex - 1][colIndex].regionId !== cell.regionId) {
          cellBorders.push('border-top');
        }
        
        // Vérifier bordure right
        if (colIndex === gameState.gridSize - 1 || gameState.board[rowIndex][colIndex + 1].regionId !== cell.regionId) {
          cellBorders.push('border-right');
        }
        
        // Vérifier bordure bottom
        if (rowIndex === gameState.gridSize - 1 || gameState.board[rowIndex + 1][colIndex].regionId !== cell.regionId) {
          cellBorders.push('border-bottom');
        }
        
        // Vérifier bordure left
        if (colIndex === 0 || gameState.board[rowIndex][colIndex - 1].regionId !== cell.regionId) {
          cellBorders.push('border-left');
        }
        
        borders[cellKey] = cellBorders;
      });
    });
    
    return borders;
  }, [gameState.board, gameState.gridSize]);

  return (
    <div className="game-board">
      <div 
        className="game-board__grid"
        style={{
          gridTemplateColumns: `repeat(${gameState.gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gameState.gridSize}, ${cellSize}px)`,
          gap: '1px'
        }}
      >
        {gameState.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            const regionBorders = getRegionBorders[cellKey] || [];
            
            return (
              <div
                key={cellKey}
                className={`game-cell-container ${regionBorders.join(' ')}`}
                style={{
                  '--region-color': cell.regionColor
                } as React.CSSProperties}
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
