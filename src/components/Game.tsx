import React, { useCallback } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { GameControls } from './GameControls';

export const Game: React.FC = () => {
  const {
    gameState,
    handleCellClick,
    markCell,
    resetGame,
    newGame: originalNewGame,
    changeGridSizeOnly,
    saveScore,
    gameTime,
    isGenerating,
    isLoading,
    error,
  } = useGameLogic();

  const handleGridSizeChange = useCallback(async (newSize: number) => {
    await changeGridSizeOnly(newSize);
  }, [changeGridSizeOnly]);

  const handleNewGame = useCallback(async () => {
    await originalNewGame(gameState.gridSize);
  }, [originalNewGame, gameState.gridSize]);

  const handleResetGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  return (
    <div className="h-full flex flex-col">
      {/* Erreur de chargement */}
      {error && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 max-w-md mx-4 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs text-center">
          {error}
        </div>
      )}

      <GameControls
        gameState={gameState}
        gameTime={gameTime}
        onResetGame={handleResetGame}
        onNewGame={handleNewGame}
        onGridSizeChange={handleGridSizeChange}
        onSaveScore={saveScore}
        isLoading={isLoading}
        onCellClick={handleCellClick}
        onMarkCell={markCell}
        isGameBlocked={isGenerating}
      />
    </div>
  );
};
