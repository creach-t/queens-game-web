import { Clock, Trophy } from 'lucide-react';
import React from 'react';
import { SuccessMessageProps} from '../../types/game';

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  gameState,
  gameTime,
  formatTime
}) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-green-600" />
          <div className="font-medium text-green-800">Félicitations !</div>
        </div>
        <div className="text-sm text-green-700">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Puzzle {gameState.gridSize}×{gameState.gridSize} résolu en {formatTime(gameTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
