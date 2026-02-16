import { Clock, Trophy } from 'lucide-react';
import React from 'react';
import { SuccessMessageProps} from '../../types/game';

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  gameState,
  gameTime,
  formatTime
}) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-green-600" />
          <div className="font-medium text-green-800 text-sm">Félicitations !</div>
        </div>
        <div className="text-xs text-green-700">
          <div className="flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Puzzle {gameState.gridSize}×{gameState.gridSize} résolu en {formatTime(gameTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
