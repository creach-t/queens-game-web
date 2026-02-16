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
import { GameBoard } from '../GameBoard';
import { LoadingState } from '../GameBoard/LoadingState';

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  gameTime,
  onResetGame,
  onNewGame,
  onGridSizeChange,
  onSaveScore,
  isLoading,
  onCellClick,
  onMarkCell,
  isGameBlocked,
}) => {
  const [levelCounts, setLevelCounts] = useState<Record<number, number>>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(true);

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

  // Réafficher le message de succès quand le jeu est complété
  useEffect(() => {
    if (gameState.isCompleted) {
      setShowSuccessMessage(true);
    }
  }, [gameState.isCompleted]);

  const formatTime = (seconds: number): string => {
    const validSeconds = isNaN(seconds) || seconds < 0 ? 0 : Math.floor(seconds);
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showVictoryAnimation = gameState.isCompleted;

  return (
    <>
      {/* Overlays du haut */}
      <div className="grid grid-cols-3 items-start gap-2 px-2 sm:px-4 py-2">
        {/* Rules (?) - colonne gauche */}
        <div className="flex justify-start">
          <Rules />
        </div>

        {/* Timer centré - colonne centrale */}
        <div className="flex justify-center">
          <Timer gameTime={gameTime} isCompleted={gameState.isCompleted} />
        </div>

        {/* Leaderboard / Trophy button - colonne droite */}
        <div className="flex justify-end">
          {/* Desktop: Leaderboard complet */}
          <div className="hidden md:block max-w-xs">
            <Leaderboard
              gridSize={gameState.gridSize}
              currentTime={gameState.isCompleted ? gameTime : undefined}
              isCompleted={gameState.isCompleted}
              onSaveScore={onSaveScore}
              formatTime={formatTime}
            />
          </div>

          {/* Mobile: Trophy button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 shadow-lg rounded-full flex items-center justify-center transition-all hover:scale-110"
              title="Classement"
            >
              <Trophy className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-yellow-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Leaderboard Popup */}
      {showLeaderboard && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/20 z-45"
            onClick={() => setShowLeaderboard(false)}
          />
          <div className="md:hidden fixed top-16 right-2 z-50 max-w-[min(320px,calc(100vw-1rem))]">
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

      {/* Grille de jeu - flex-1 pour prendre l'espace disponible */}
      <div className="flex-1 flex items-center justify-center px-2 relative min-h-0">
        {isLoading ? (
          <LoadingState />
        ) : (
          <GameBoard
            gameState={gameState}
            onCellClick={onCellClick}
            onMarkCell={onMarkCell}
            showVictoryAnimation={showVictoryAnimation}
            isGameBlocked={isGameBlocked || false}
            animationMode="none"
          />
        )}

        {/* Victory Message - overlay centré sur la grille */}
        {gameState.isCompleted && showSuccessMessage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <SuccessMessage
                gameState={gameState}
                gameTime={gameTime}
                formatTime={formatTime}
                onSaveScore={onSaveScore}
                onClose={() => setShowSuccessMessage(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Overlays du bas */}
      <div className="grid grid-cols-3 items-end gap-2 px-2 sm:px-4 py-2">
        {/* Grid Size Selector avec label - colonne gauche */}
        <div className="flex flex-col items-start gap-1">
          <span className="text-xs text-gray-600 font-medium px-1">Difficulté</span>
          <SizeGridSelector
            currentGridSize={gameState.gridSize}
            onGridSizeChange={onGridSizeChange}
            levelCounts={levelCounts}
          />
        </div>

        {/* Main Controls avec label - colonne centrale */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-600 font-medium">Actions</span>
          <MainControls
            onResetGame={onResetGame}
            onNewGame={onNewGame}
            isCompleted={gameState.isCompleted}
          />
        </div>

        {/* Spacer - colonne droite */}
        <div></div>
      </div>
    </>
  );
};
