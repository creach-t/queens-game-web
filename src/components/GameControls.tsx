import {
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  X as XIcon
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { GameState } from '../types/game';

interface GameControlsProps {
  gameState: GameState;
  gameTime: number;
  onResetGame: () => void;
  onNewGame: () => void;
  onGridSizeChange: (size: number) => void;
}

// Popup de victoire
const VictoryPopup: React.FC<{
  gameTime: number;
  onClose: () => void;
  onNewGame: () => void;
  onResetGame: () => void;
}> = ({ gameTime = 0, onClose, onNewGame, onResetGame }) => {
  const formatTime = (seconds: number): string => {
    // Protection contre NaN et valeurs invalides
    const validSeconds = isNaN(seconds) || seconds < 0 ? 0 : Math.floor(seconds);
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in-up">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Félicitations !
          </h2>

          {/* Statistiques de victoire - uniquement le temps */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <span className="text-gray-700 text-lg">Temps :</span>
              <span className="font-bold text-blue-600 font-mono text-xl">
                {formatTime(gameTime)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                onResetGame();
                onClose();
              }}
              className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Rejouer
            </button>
            <button
              onClick={() => {
                onNewGame();
                onClose();
              }}
              className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Nouveau jeu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Instructions dropdown
const InstructionsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Comment jouer</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-100 bg-gray-50">
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3">
              <XIcon className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-medium text-sm">Clic simple</div>
                <div className="text-gray-600 text-sm">Placer/enlever un marqueur</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-medium text-sm">Double-clic</div>
                <div className="text-gray-600 text-sm">Placer/enlever une reine</div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="font-medium text-sm mb-2">Règles :</div>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Une reine par ligne, colonne et région</li>
                <li>• Les reines ne peuvent pas se toucher</li>
                <li>• Résolvez en plaçant toutes les reines</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  gameTime,
  onResetGame,
  onNewGame,
  onGridSizeChange
}) => {
  const [showVictoryPopup, setShowVictoryPopup] = useState(false);

  useEffect(() => {
    if (gameState.isCompleted) {
      setShowVictoryPopup(true);
    }
  }, [gameState.isCompleted]);

  const difficultyInfo = {
    5: { name: "Tutoriel", color: "bg-green-100 text-green-700" },
    6: { name: "Facile", color: "bg-blue-100 text-blue-700" },
    7: { name: "Normal", color: "bg-yellow-100 text-yellow-700" },
    8: { name: "Difficile", color: "bg-orange-100 text-orange-700" },
    9: { name: "Expert", color: "bg-red-100 text-red-700" },
    10: { name: "Maître", color: "bg-purple-100 text-purple-700" }

  };

  return (
    <>
      <div className="space-y-6">


        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex gap-2 min-w-0">
            <button
              onClick={onResetGame}
              className="flex-1 min-w-0 py-3 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-sm"
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

        {/* Contrôles de difficulté */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="font-medium text-gray-900">Difficulté</label>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              difficultyInfo[gameState.gridSize as keyof typeof difficultyInfo]?.color
            }`}>
              {difficultyInfo[gameState.gridSize as keyof typeof difficultyInfo]?.name}
            </span>
          </div>

          <select
            value={gameState.gridSize}
            onChange={(e) => onGridSizeChange(Number(e.target.value))}
            className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={5}>5×5 — Tutoriel</option>
            <option value={6}>6×6 — Facile</option>
            <option value={7}>7×7 — Normal</option>
            <option value={8}>8×8 — Difficile</option>
            <option value={9}>9×9 — Expert</option>
            <option value={10}>10×10 — Maître</option>
          </select>
        </div>

        {/* Instructions */}
        <InstructionsDropdown />
      </div>

      {/* Popup de victoire */}
      {showVictoryPopup && (
        <VictoryPopup
          gameTime={gameTime}
          onClose={() => setShowVictoryPopup(false)}
          onNewGame={onNewGame}
          onResetGame={onResetGame}
        />
      )}
    </>
  );
};