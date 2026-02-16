import React, { useCallback, useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { LoadingState } from './GameBoard/LoadingState';

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

  const [boardAnimationKey, setBoardAnimationKey] = useState(0);

  const handleGridSizeChange = useCallback(async (newSize: number) => {
    await changeGridSizeOnly(newSize);
    setBoardAnimationKey(prev => prev + 1);
  }, [changeGridSizeOnly]);

  const handleNewGame = useCallback(async () => {
    await originalNewGame(gameState.gridSize);
    setBoardAnimationKey(prev => prev + 1);
  }, [originalNewGame, gameState.gridSize]);

  const handleResetGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const showVictoryAnimation = !isGenerating && gameState.isCompleted;

  return (
    <div className="relative h-[calc(100vh-9rem)]">
      {/* Erreur de chargement */}
      {error && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 max-w-md mx-4 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs text-center">
          {error}
        </div>
      )}

      {/* Plateau de jeu centré */}
      <div className="absolute inset-0 flex items-center justify-center px-2">
        {isLoading ? (
          <LoadingState />
        ) : (
          <GameBoard
            gameState={gameState}
            onCellClick={handleCellClick}
            onMarkCell={markCell}
            showVictoryAnimation={showVictoryAnimation}
            key={boardAnimationKey}
            isGameBlocked={isGenerating}
            animationMode="none"
          />
        )}
      </div>

      {/* Overlays positionnés */}
      <GameControls
        gameState={gameState}
        gameTime={gameTime}
        onResetGame={handleResetGame}
        onNewGame={handleNewGame}
        onGridSizeChange={handleGridSizeChange}
        onSaveScore={saveScore}
      />
    </div>
  );
};
