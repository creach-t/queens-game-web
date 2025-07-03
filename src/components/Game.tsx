import React, { useCallback, useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { Timer } from './Timer';

export const Game: React.FC = () => {
  const {
    gameState,
    handleCellClick,
    resetGame,
    newGame: originalNewGame,
    changeGridSizeOnly,
    gameTime,
    isGenerating,
  } = useGameLogic();

  const [boardAnimationKey, setBoardAnimationKey] = useState(0);

const handleGridSizeChange = useCallback((newSize: number) => {
  changeGridSizeOnly(newSize);
  setBoardAnimationKey(prev => prev + 1);
}, [changeGridSizeOnly]);

const handleNewGame = useCallback(() => {
  originalNewGame(gameState.gridSize);
  setBoardAnimationKey(prev => prev + 1);
}, [originalNewGame, gameState.gridSize]);

  const handleResetGame = useCallback(() => {
      resetGame();
  }, [resetGame]);

  const showVictoryAnimation = !isGenerating && gameState.isCompleted;

  return (
    <>
      <div className="game">
        <div className="game-container">
          {/* Timer */}
          <Timer gameTime={gameTime} isCompleted={gameState.isCompleted}/>
          {/* Plateau*/}
          <div className="game-board-section">
            <GameBoard
              gameState={gameState}
              onCellClick={handleCellClick}
              showVictoryAnimation={showVictoryAnimation}
              key={boardAnimationKey}
              isGameBlocked={isGenerating}
              animationMode="none"
            />

          </div>
          {/* Contrôles */}
          <div className="game-controls-section">
            <GameControls
              gameState={gameState}
              gameTime={gameTime}
              onResetGame={handleResetGame}
              onNewGame={handleNewGame}
              onGridSizeChange={handleGridSizeChange}
              onLevelGenerated={() => {}}
            />
          </div>
        </div>
      </div>
    </>
  );
};