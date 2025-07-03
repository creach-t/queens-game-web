import React, { useEffect, useState } from 'react';
import { GameControlsProps } from '../../types/game';
import { levelStorage } from '../../utils/levelStorage';
import { MainControls } from './MainControls';
import { Rules } from './Rules';
import { SizeGridSelector } from './SizeGridSelector';
import { SuccessMessage } from './SuccessMessage';

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  gameTime,
  onResetGame,
  onNewGame,
  onGridSizeChange,
  onLevelGenerated
}) => {
  const [levelCounts, setLevelCounts] = useState<Record<number, number>>({});

  const loadLevelCounts = async () => {
    const counts = await levelStorage.getLevelCounts();
    setLevelCounts(counts);
  };

  useEffect(() => {
    loadLevelCounts();
  }, []);

  useEffect(() => {
    if (onLevelGenerated) {
      loadLevelCounts();
    }
  }, [gameState.solution, onLevelGenerated]);

  const formatTime = (seconds: number): string => {
    const validSeconds = isNaN(seconds) || seconds < 0 ? 0 : Math.floor(seconds);
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Message de victoire */}
      {gameState.isCompleted && (
        <SuccessMessage
          gameState={gameState}
          gameTime={gameTime}
          formatTime={formatTime}
        />
      )}

      {/* Contrôles principaux */}
      <MainControls
        onResetGame={onResetGame}
        onNewGame={onNewGame}
        isCompleted={gameState.isCompleted}
      />

      {/* Sélecteur de grille */}
      <SizeGridSelector
        currentGridSize={gameState.gridSize}
        onGridSizeChange={onGridSizeChange}
        levelCounts={levelCounts}
      />

      {/* Instructions */}
      <Rules />
    </div>
  );
};