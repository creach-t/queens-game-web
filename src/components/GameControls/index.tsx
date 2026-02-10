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
    <div className="space-y-6">
      {/* Message de victoire */}
      {gameState.isCompleted && (
        <SuccessMessage
          gameState={gameState}
          gameTime={gameTime}
          formatTime={formatTime}
        />
      )}

      {/* Controles principaux */}
      <MainControls
        onResetGame={onResetGame}
        onNewGame={onNewGame}
        isCompleted={gameState.isCompleted}
      />

      {/* Selecteur de grille */}
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
