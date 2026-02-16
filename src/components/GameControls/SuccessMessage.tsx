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
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-2xl rounded-xl p-4 sm:p-6 max-w-sm w-full mx-4 relative">
      {/* Bouton de fermeture */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-200/50 transition-colors group"
        title="Fermer"
      >
        <X className="w-5 h-5 text-green-700 group-hover:text-green-900" />
      </button>

      <div className="text-center space-y-3">
        {/* Icône et titre */}
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-pulse" />
        </div>

        <div>
          <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-1">
            Puzzle Résolu !
          </h3>
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-green-700">
            <Crown className="w-4 h-4 text-green-600" />
            <span className="font-semibold">
              {gameState.gridSize}×{gameState.gridSize}
            </span>
            <span className="text-green-600">•</span>
            <span className="font-mono font-semibold">
              {formatTime(gameTime)}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-green-600">
          Toutes les reines sont placées correctement !
        </p>

        {/* Formulaire de sauvegarde du score (uniquement si éligible) */}
        {canEnter && !savedSuccessfully && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 space-y-2 mt-3">
            <p className="text-sm text-blue-900 font-semibold">
              🎉 Record Top 3 !
            </p>
            <p className="text-xs text-blue-700">
              Enregistrez votre temps au classement
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={savedPlayerName || "Votre nom"}
                maxLength={20}
                className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Envoi...' : 'Sauver'}
              </button>
            </div>
          </div>
        )}

        {/* Message de confirmation */}
        {savedSuccessfully && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 mt-3">
            <p className="text-sm text-emerald-800 font-semibold">✓ Score enregistré !</p>
            <p className="text-xs text-emerald-600 mt-1">Consultez le classement</p>
          </div>
        )}
      </div>
    </div>
  );
};
