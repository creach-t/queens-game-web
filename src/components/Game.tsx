import React from 'react';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { useGameLogic } from '../hooks/useGameLogic';
import './Game.css';

export const Game: React.FC = () => {
  const {
    gameState,
    handleCellClick,
    resetGame,
    newGame
  } = useGameLogic(6); // Commencer avec une grille 6x6

  const handleGridSizeChange = (newSize: number) => {
    newGame(newSize);
  };

  return (
    <div className="game-professional">
      <div className="game-container-professional">
        {/* Plateau de jeu - Section principale */}
        <div className="game-board-section-professional">
          <GameBoard 
            gameState={gameState}
            onCellClick={handleCellClick}
          />
        </div>
        
        {/* Panneau latéral - Contrôles et statistiques */}
        <div className="game-controls-section-professional">
          <GameControls
            gameState={gameState}
            onResetGame={resetGame}
            onNewGame={() => newGame()}
            onGridSizeChange={handleGridSizeChange}
          />
        </div>
      </div>
    </div>
  );
};