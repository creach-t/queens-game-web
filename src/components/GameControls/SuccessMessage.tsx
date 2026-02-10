import { Clock, Trophy } from 'lucide-react';
import React from 'react';
import { SuccessMessageProps} from '../../types/game';
import { Leaderboard } from '../Leaderboard';

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  gameState,
  gameTime,
  formatTime,
  onScoreSaved
}) => {
  return (
    <div className="space-y-3">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-green-600" />
            <div className="font-medium text-green-800">Félicitations !</div>
          </div>
          <div className="text-sm text-green-700 mb-1">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Puzzle {gameState.gridSize}×{gameState.gridSize} résolu en {formatTime(gameTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard avec input pour le nom */}
      <Leaderboard
        gridSize={gameState.gridSize}
        currentTime={gameTime}
        isCompleted={gameState.isCompleted}
        onSaveScore={onScoreSaved}
        formatTime={formatTime}
      />
    </div>
  );
};
