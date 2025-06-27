import React from 'react';
import { RefreshCcw, Sparkles, Crown, XCircle, CheckCircle } from 'lucide-react';
import { GameState } from '../types/game';
import { Button } from "@/components/ui/button"

interface GameControlsProps {
  gameState: GameState;
  onResetGame: () => void;
  onNewGame: () => void;
  onGridSizeChange: (size: number) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  onResetGame,
  onNewGame,
  onGridSizeChange
}) => {
  return (
    <div className="w-full flex justify-center px-4 ">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 space-y-6 mx-4">

        {gameState.isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 flex items-start space-x-3">
            <CheckCircle className="text-green-600 w-5 h-5 mt-0.5" />
            <div>
              <h3 className="text-green-800 font-semibold text-sm mb-1">Félicitations !</h3>
              <p className="text-green-700 text-sm">
                Puzzle résolu en {gameState.moveCount} coups
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onResetGame}
            title="Réinitialiser le niveau actuel"
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Réinitialiser
          </Button>

          <Button
            onClick={onNewGame}
            title="Générer un nouveau niveau"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Nouveau jeu
          </Button>
        </div>

        <div>
          <label htmlFor="grid-size" className="block text-sm font-medium text-gray-700 mb-1">
            Taille de la grille :
          </label>
          <select
            id="grid-size"
            value={gameState.gridSize}
            onChange={(e) => onGridSizeChange(Number(e.target.value))}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={4}>4x4 (Facile)</option>
            <option value={5}>5x5 (Moyen)</option>
            <option value={6}>6x6 (Difficile)</option>
            <option value={7}>7x7 (Expert)</option>
            <option value={8}>8x8 (Maître)</option>
            <option value={9}>9x9 (Ultime)</option>
          </select>
        </div>

        <div className="bg-gray-100 rounded-md p-4">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Comment jouer :</h4>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>
              <XCircle className="inline w-4 h-4 mr-1" /> Clic simple : Placer/enlever un marqueur
            </li>
            <li>
              <Crown className="inline w-4 h-4 mr-1" /> Double-clic : Placer/enlever une reine
            </li>
            <li>Une reine par ligne, colonne et région colorée</li>
            <li>Les reines ne peuvent pas se toucher</li>
          </ul>
        </div>

      </div>
    </div>
  );
};
