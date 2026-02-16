import React, { useEffect, useState } from 'react';
import { GameControlsProps } from '../../types/game';
import { levelStorage } from '../../utils/levelStorage';
import { MainControls } from './MainControls';
import { Rules } from './Rules';
import { SizeGridSelector } from './SizeGridSelector';
import { SuccessMessage } from './SuccessMessage';
import { Leaderboard } from '../Leaderboard';
import { Timer } from '../Timer';

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  gameTime,
  onResetGame,
  onNewGame,
  onGridSizeChange,
  onSaveScore,
}) => {
  const [levelCounts, setLevelCounts] = useState<Record<number, number>>({});

  // Charger les counts une seule fois au mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const counts = await levelStorage.getLevelCounts();
      if (!cancelled) setLevelCounts(counts);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const formatTime = (seconds: number): string => {
    const validSeconds = isNaN(seconds) || seconds < 0 ? 0 : Math.floor(seconds);
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Top-Left: Rules (?) */}
      <div className="fixed top-14 sm:top-20 left-2 sm:left-4 z-40">
        <Rules />
      </div>

      {/* Top-Center: Timer */}
      <div className="fixed top-14 sm:top-20 left-1/2 -translate-x-1/2 z-40">
        <Timer gameTime={gameTime} isCompleted={gameState.isCompleted} />
        {/* Message de victoire juste en dessous du timer */}
        {gameState.isCompleted && (
          <div className="mt-1">
            <SuccessMessage
              gameState={gameState}
              gameTime={gameTime}
              formatTime={formatTime}
            />
          </div>
        )}
      </div>

      {/* Top-Right: Leaderboard - hidden on small screens, shown on lg+ */}
      <div className="hidden lg:block fixed top-20 right-4 z-40 max-w-xs">
        <Leaderboard
          gridSize={gameState.gridSize}
          currentTime={gameState.isCompleted ? gameTime : undefined}
          isCompleted={gameState.isCompleted}
          onSaveScore={onSaveScore}
          formatTime={formatTime}
        />
      </div>

      {/* Bottom-Center: Main Controls */}
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-40">
        <MainControls
          onResetGame={onResetGame}
          onNewGame={onNewGame}
          isCompleted={gameState.isCompleted}
        />
      </div>

      {/* Bottom-Left: Grid Size Selector */}
      <div className="fixed bottom-2 sm:bottom-4 left-2 sm:left-4 z-40">
        <SizeGridSelector
          currentGridSize={gameState.gridSize}
          onGridSizeChange={onGridSizeChange}
          levelCounts={levelCounts}
        />
      </div>

      {/* Mobile Leaderboard - Show in popup when completed on small/medium screens */}
      {gameState.isCompleted && (
        <div className="lg:hidden fixed top-28 sm:top-32 right-2 z-40 max-w-[min(320px,calc(100vw-1rem))]">
          <Leaderboard
            gridSize={gameState.gridSize}
            currentTime={gameState.isCompleted ? gameTime : undefined}
            isCompleted={gameState.isCompleted}
            onSaveScore={onSaveScore}
            formatTime={formatTime}
          />
        </div>
      )}
    </>
  );
};
