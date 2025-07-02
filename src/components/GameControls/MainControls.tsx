import { RotateCcw, Sparkles } from 'lucide-react';
import React from 'react';

interface MainControlsProps {
  onResetGame: () => void;
  onNewGame: () => void;
  isCompleted: boolean;
}

export const MainControls: React.FC<MainControlsProps> = ({
  onResetGame,
  onNewGame,
  isCompleted
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex gap-2 min-w-0">
        <button
          onClick={onResetGame}
          disabled={isCompleted}
          className="flex-1 min-w-0 py-3 px-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <RotateCcw className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Réinitialiser</span>
        </button>

        <button
          onClick={onNewGame}
          className="flex-1 min-w-0 py-3 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Nouveau jeu</span>
        </button>
      </div>
    </div>
  );
};