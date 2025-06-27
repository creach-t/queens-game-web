import React from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import './Game.css';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';

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
    <div className="game">
      <div className="game-container">
        {/* Plateau de jeu */}
        <div className="game-board-section">
          <GameBoard
            gameState={gameState}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Contrôles et statistiques */}
        <div className="game-controls-section">
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