import { Trophy, Sparkles, Crown, Save, X } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { SuccessMessageProps } from '../../types/game';
import { levelStorage } from '../../utils/levelStorage';

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  gameState,
  gameTime,
  formatTime,
  onSaveScore,
  onClose
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [canEnter, setCanEnter] = useState(false);
  const [savedPlayerName, setSavedPlayerName] = useState<string>('');

  // Charger le nom sauvegardé depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('queens-game-player-name');
    if (saved) {
      setSavedPlayerName(saved);
    }
  }, []);

  // Vérifier si le score peut entrer dans le top 3
  const checkEligibility = useCallback(async () => {
    if (!gameTime || savedSuccessfully) {
      setCanEnter(false);
      return;
    }

    const nameToCheck = savedPlayerName || playerName || '___temp___';
    const eligible = await levelStorage.canEnterLeaderboard(gameState.gridSize, gameTime, nameToCheck);
    setCanEnter(eligible);
  }, [gameTime, gameState.gridSize, savedSuccessfully, playerName, savedPlayerName]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const handleSaveScore = async () => {
    const nameToSave = playerName.trim() || savedPlayerName;
    if (!nameToSave || !gameTime) return;

    setIsSaving(true);
    const success = await onSaveScore(nameToSave);
    setIsSaving(false);

    if (success) {
      setSavedSuccessfully(true);
      setSavedPlayerName(nameToSave);
      localStorage.setItem('queens-game-player-name', nameToSave);
      setPlayerName('');
    }
  };

  return (
    <div className="bg-white/98 backdrop-blur-sm shadow-xl rounded-xl p-4 sm:p-5 max-w-[85vw] sm:max-w-sm w-full mx-auto relative border border-gray-200/80">
      {/* Bouton de fermeture minimaliste */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors group"
        title="Fermer"
      >
        <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
      </button>

      <div className="text-center space-y-3">
        {/* Icône principale */}
        <div className="flex items-center justify-center">
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500" />
        </div>

        {/* Titre minimaliste */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
          Puzzle résolu !
        </h3>

        {/* Statistiques compactes */}
        <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Crown className="w-4 h-4 text-gray-500" />
            <span className="font-semibold">{gameState.gridSize}×{gameState.gridSize}</span>
          </div>
          <span>•</span>
          <span className="font-mono font-bold text-gray-800">
            {formatTime(gameTime)}
          </span>
        </div>

        {/* Formulaire Top 3 minimaliste */}
        {canEnter && !savedSuccessfully && (
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-semibold text-blue-600">Top 3</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={savedPlayerName || "Votre nom"}
                maxLength={20}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (playerName.trim() || savedPlayerName)) {
                    handleSaveScore();
                  }
                }}
                autoFocus
              />
              <button
                onClick={handleSaveScore}
                disabled={(!playerName.trim() && !savedPlayerName) || isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isSaving ? 'Envoi...' : 'Sauver'}</span>
                <span className="sm:hidden">{isSaving ? '...' : 'OK'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Message de confirmation minimaliste */}
        {savedSuccessfully && (
          <div className="pt-2">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600">
              <span className="text-lg">✓</span>
              <p className="text-sm font-semibold">Score enregistré</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
