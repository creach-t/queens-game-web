import { Trophy } from 'lucide-react';
import React from 'react';
import { SuccessMessageProps} from '../../types/game';

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  gameState,
  gameTime,
  formatTime
}) => {
  return (
    <div className="bg-green-50/90 backdrop-blur-sm border border-green-200 shadow-lg rounded-lg p-1.5 sm:p-2">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
          <div className="font-medium text-green-800 text-xs sm:text-sm">
            {gameState.gridSize}×{gameState.gridSize} — {formatTime(gameTime)}
          </div>
        </div>
      </div>
    </div>
  );
};
