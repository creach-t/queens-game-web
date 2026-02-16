import { RotateCcw, Sparkles } from 'lucide-react';
import React from 'react';
import { MainControlsProps } from '../../types/game';

export const MainControls: React.FC<MainControlsProps> = ({
  onResetGame,
  onNewGame,
  isCompleted
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg p-2">
      <div className="flex gap-2 min-w-0">
        <button
          onClick={onResetGame}
          disabled={isCompleted}
          className="flex-1 min-w-0 py-2 px-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 rounded font-medium transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <RotateCcw className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Réinitialiser</span>
        </button>

        <button
          onClick={onNewGame}
          className="flex-1 min-w-0 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Nouveau jeu</span>
        </button>
      </div>
    </div>
  );
};