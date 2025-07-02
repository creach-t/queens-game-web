import { Clock, Trophy } from 'lucide-react';
import React from 'react';
import { GameCell, GameState } from '../../types/game';

interface SuccessMessageProps {
  gameState: GameState;
  gameTime: number;
  formatTime: (seconds: number) => string;
}

const difficultyInfo = {
  5: { name: "Tutoriel" },
  6: { name: "Facile" },
  7: { name: "Normal" },
  8: { name: "Difficile" },
  9: { name: "Expert" },
  10: { name: "Maître" },
  11: { name: "Légendaire" },
  12: { name: "Mythique" }
};

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  gameState,
  gameTime,
  formatTime
}) => {
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

  return (
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
  );
};