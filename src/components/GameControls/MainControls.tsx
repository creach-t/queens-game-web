import { RotateCcw, Sparkles } from 'lucide-react';
import React from 'react';
import { MainControlsProps } from '../../types/game';

export const MainControls: React.FC<MainControlsProps> = ({
  onResetGame,
  onNewGame,
  isCompleted
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg p-1.5">
      <div className="flex gap-1.5 sm:gap-2">
        <button
          onClick={onResetGame}
          disabled={isCompleted}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 rounded font-medium transition-all hover:scale-110 disabled:hover:scale-100 flex items-center justify-center"
          title="Réinitialiser"
        >
          <RotateCcw className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={onNewGame}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-all hover:scale-110 flex items-center justify-center"
          title="Nouveau jeu"
        >
          <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};