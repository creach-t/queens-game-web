import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);

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
      <div className="fixed top-2 sm:top-4 left-2 sm:left-4 z-40">
        <Rules />
      </div>

      {/* Top-Center: Timer */}
      <div className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-40">
        <Timer gameTime={gameTime} isCompleted={gameState.isCompleted} />
      </div>

      {/* Top-Right: Leaderboard - visible on md+ screens */}
      <div className="hidden md:block fixed top-2 sm:top-4 right-2 sm:right-4 z-40 max-w-xs">
        <Leaderboard
          gridSize={gameState.gridSize}
          currentTime={gameState.isCompleted ? gameTime : undefined}
          isCompleted={gameState.isCompleted}
          onSaveScore={onSaveScore}
          formatTime={formatTime}
        />
      </div>

      {/* Top-Right Mobile: Leaderboard Button */}
      <div className="md:hidden fixed top-2 sm:top-4 right-2 sm:right-4 z-40">
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 shadow-lg rounded-full flex items-center justify-center transition-all hover:scale-110"
          title="Classement"
        >
          <Trophy className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-yellow-600" />
        </button>
      </div>

      {/* Mobile Leaderboard Popup */}
      {showLeaderboard && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/20 z-45"
            onClick={() => setShowLeaderboard(false)}
          />
          <div className="md:hidden fixed top-14 right-2 z-50 max-w-[min(320px,calc(100vw-1rem))]">
            <Leaderboard
              gridSize={gameState.gridSize}
              currentTime={gameState.isCompleted ? gameTime : undefined}
              isCompleted={gameState.isCompleted}
              onSaveScore={onSaveScore}
              formatTime={formatTime}
            />
          </div>
        </>
      )}

      {/* Victory Message Overlay - Centered */}
      {gameState.isCompleted && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
          <div className="pointer-events-auto">
            <SuccessMessage
              gameState={gameState}
              gameTime={gameTime}
              formatTime={formatTime}
            />
          </div>
        </div>
      )}

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
    </>
  );
};
