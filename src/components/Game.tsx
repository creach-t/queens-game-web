import React, { useCallback, useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { GameBoard } from './GameBoard';
import { CanvasGameBoard } from './CanvasGameBoard';
import { GameControls } from './GameControls';
import { Timer } from './Timer';

export const Game: React.FC = () => {
  const {
    gameState,
    handleCellClick,
    handleCellDrag, // ✨ Nouvelle fonction pour le drag
    resetGame,
    newGame: originalNewGame,
    changeGridSizeOnly,
    gameTime,
    isGenerating,
  } = useGameLogic();

  const [boardAnimationKey, setBoardAnimationKey] = useState(0);
  const [useCanvasBoard, setUseCanvasBoard] = useState(true); // ✨ Switch Canvas/DOM

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
          
          {/* Toggle Canvas/DOM */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '10px',
            gap: '10px',
            alignItems: 'center'
          }}>
            <label style={{ 
              fontSize: '0.9rem', 
              fontWeight: '500',
              color: 'white',
              background: 'rgba(0,0,0,0.3)',
              padding: '5px 10px',
              borderRadius: '15px'
            }}>
              <input
                type="checkbox"
                checked={useCanvasBoard}
                onChange={(e) => setUseCanvasBoard(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              🎨 Canvas + Drag System
            </label>
          </div>
          
          {/* Plateau*/}
          <div className="game-board-section">
            {useCanvasBoard ? (
              <CanvasGameBoard
                gameState={gameState}
                onCellClick={handleCellClick}
                onCellDrag={handleCellDrag} // ✨ Fonction drag
                showVictoryAnimation={showVictoryAnimation}
                isGameBlocked={isGenerating}
                animationMode="none"
                key={`canvas-${boardAnimationKey}`}
              />
            ) : (
              <GameBoard
                gameState={gameState}
                onCellClick={handleCellClick}
                showVictoryAnimation={showVictoryAnimation}
                key={`dom-${boardAnimationKey}`}
                isGameBlocked={isGenerating}
                animationMode="none"
              />
            )}
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