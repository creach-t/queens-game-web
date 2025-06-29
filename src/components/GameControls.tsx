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
import React, { useState } from 'react';
import { GameCell, GameState } from '../types/game';

interface GameControlsProps {
  gameState: GameState;
  gameTime: number;
  onResetGame: () => void;
  onNewGame: () => void;
  onGridSizeChange: (size: number) => void;
}

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
  const formatTime = (seconds: number): string => {
    const validSeconds = isNaN(seconds) || seconds < 0 ? 0 : Math.floor(seconds);
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

    const generateGridEmojis = (board: GameCell[][], gridSize: number) => {
    const regionEmojis = ['🟦', '🟩', '🟨', '🟧', '🟪', '🟫', '⬜', '🟥', '⬛'];

    let gridText = '\n';
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell = board[row][col];
        if (cell.state === 'queen') {
          gridText += '👑';
        } else {
          // Utiliser un emoji de couleur basé sur la région
          gridText += regionEmojis[cell.regionId % regionEmojis.length];
        }
      }
      gridText += '\n';
    }
    return gridText;
  };

  const shareOnLinkedIn = (gridSize: number, gameTime: number) => {
    const timeFormatted = formatTime(gameTime);
    const difficultyName = difficultyInfo[gridSize as keyof typeof difficultyInfo]?.name || 'Expert';
    const gridEmojis = generateGridEmojis(gameState.board, gridSize);

    const text = `🏆 Je viens de résoudre un puzzle Queens ${gridSize}×${gridSize} (${difficultyName}) en ${timeFormatted} ! 👑

${gridEmojis}

Un défi de logique passionnant où il faut placer des reines sans qu'elles se touchent. Vous voulez essayer ?

https://queens-game.creachtheo.fr

#PuzzleGame #LogicGame #Challenge #QueensGame`;

    const url = window.location.origin;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

    window.open(linkedInUrl, '_blank', 'width=600,height=600');
  };

  const difficultyInfo = {
    5: { name: "Tutoriel", color: "bg-green-100 text-green-700" },
    6: { name: "Facile", color: "bg-blue-100 text-blue-700" },
    7: { name: "Normal", color: "bg-yellow-100 text-yellow-700" },
    8: { name: "Difficile", color: "bg-orange-100 text-orange-700" },
    9: { name: "Expert", color: "bg-red-100 text-red-700" },
    10: { name: "Maître", color: "bg-purple-100 text-purple-700" },
    11: { name: "Légendaire", color: "bg-pink-100 text-pink-700" },
    12: { name: "Mythique", color: "bg-gray-100 text-gray-700" }
  };

  return (
    <div className="space-y-6">
      {/* 🎉 MESSAGE DE VICTOIRE */}
      {gameState.isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-green-600" />
              <div className="font-medium text-green-800">Félicitations !</div>
            </div>
            <div className="text-sm text-green-700 mb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-4 h-4" />
                <span>Puzzle {gameState.gridSize}×{gameState.gridSize} résolu en {formatTime(gameTime)}</span>
              </div>
            </div>
            <button
              onClick={() => shareOnLinkedIn(gameState.gridSize, gameTime)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Partager sur LinkedIn
            </button>
          </div>
        </div>
      )}

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
          <option value={11}>11×11 — Légendaire</option>
          <option value={12}>12×12 — Mythique</option>
        </select>
      </div>

      {/* Instructions */}
      <InstructionsDropdown />
    </div>
  );
};