import React from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { Timer } from './Timer';

export const Game: React.FC = () => {
  const {
    gameState,
    handleCellClick,
    resetGame,
    newGame,
    gameTime,
    showVictoryAnimation,
    isGameBlocked
  } = useGameLogic(6); // Commencer avec une grille 6x6

  const handleGridSizeChange = (newSize: number) => {
    newGame(newSize);
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

        {/* Plateau de jeu - Prend 2 colonnes sur desktop */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <Timer
            gameTime={gameTime}
            isCompleted={gameState.isCompleted}
          />
          <GameBoard
            gameState={gameState}
            onCellClick={handleCellClick}
            showVictoryAnimation={showVictoryAnimation}
            isGameBlocked={isGameBlocked}
          />
        </div>

        {/* Contrôles - 1 colonne */}
        <div className="lg:col-span-1">
          <GameControls
            gameState={gameState}
            gameTime={gameTime}
            onResetGame={resetGame}
            onNewGame={() => newGame()}
            onGridSizeChange={handleGridSizeChange}
          />
        </div>

      </div>
    </div>
  );
};