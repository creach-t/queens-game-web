import React, { useCallback, useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { Timer } from './Timer';
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
    <div className="game">
      <div className="game-container">
        {/* Timer */}
        <Timer gameTime={gameTime} isCompleted={gameState.isCompleted} />

        {/* Erreur de chargement */}
        {error && (
          <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Plateau */}
        <div className="game-board-section">
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

        {/* Controles */}
        <div className="game-controls-section">
          <GameControls
            gameState={gameState}
            gameTime={gameTime}
            onResetGame={handleResetGame}
            onNewGame={handleNewGame}
            onGridSizeChange={handleGridSizeChange}
            onSaveScore={saveScore}
          />
        </div>
      </div>
    </div>
  );
};
