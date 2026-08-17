import { Trophy, Crown, Save, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { SuccessMessageProps, SaveScoreResult } from '../../types/game';

/** Formate un rang en ordinal français : 1er, 2ᵉ, 3ᵉ… */
const formatRank = (rank: number): string => (rank === 1 ? '1er' : `${rank}ᵉ`);

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  gameState,
  gameTime,
  formatTime,
  onSaveScore,
  onClose
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedPlayerName, setSavedPlayerName] = useState<string>('');
  const [result, setResult] = useState<SaveScoreResult | null>(null);

  // Charger le nom sauvegardé depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('queens-game-player-name');
    if (saved) {
      setSavedPlayerName(saved);
    }
  }, []);

  const handleSaveScore = async () => {
    const nameToSave = playerName.trim() || savedPlayerName;
    if (!nameToSave || !gameTime) return;

    setIsSaving(true);
    const res = await onSaveScore(nameToSave);
    setIsSaving(false);

    setResult(res);
    if (res.status !== 'error') {
      setSavedPlayerName(nameToSave);
      localStorage.setItem('queens-game-player-name', nameToSave);
      setPlayerName('');
    }
  };

  // Message explicite selon le résultat de l'enregistrement
  const renderResult = (res: SaveScoreResult) => {
    if (res.status === 'error') {
      return (
        <p className="text-sm text-amber-600 font-medium">
          Enregistrement indisponible pour le moment.
        </p>
      );
    }

    const rankLine =
      res.rank && res.total ? (
        <p className="text-sm text-gray-600">
          Vous êtes <span className="font-bold text-gray-800">{formatRank(res.rank)}</span> sur {res.total}.
        </p>
      ) : null;

    if (res.status === 'created') {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600">
            <span className="text-lg">✓</span>
            <p className="text-sm font-semibold">Score enregistré 🎉</p>
          </div>
          {rankLine}
        </div>
      );
    }

    if (res.status === 'improved') {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600">
            <span className="text-lg">🚀</span>
            <p className="text-sm font-semibold">Nouveau record perso !</p>
          </div>
          {res.previousBestTime !== undefined && (
            <p className="text-sm text-gray-600">
              <span className="font-mono line-through text-gray-400">{formatTime(res.previousBestTime)}</span>
              {' → '}
              <span className="font-mono font-bold text-gray-800">{formatTime(res.time)}</span>
            </p>
          )}
          {rankLine}
        </div>
      );
    }

    // unchanged
    return (
      <div className="space-y-1">
        <p className="text-sm text-gray-700 font-medium">
          Votre meilleur temps reste{' '}
          <span className="font-mono font-bold">
            {formatTime(res.previousBestTime ?? res.time)}
          </span>
          .
        </p>
        <p className="text-xs text-gray-500">
          Ce run : <span className="font-mono">{formatTime(res.time)}</span> — rien à enregistrer.
        </p>
        {rankLine}
      </div>
    );
  };

  const showForm = result === null || result.status === 'error';

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

        {/* Formulaire d'enregistrement (chaque score est enregistré, 1 entrée/joueur) */}
        {showForm && (
          <div className="pt-2 space-y-2">
            <p className="text-xs text-gray-500">
              Enregistrez votre temps pour voir votre classement
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={savedPlayerName || 'Votre nom'}
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
                <span className="hidden sm:inline">{isSaving ? 'Envoi...' : 'Enregistrer'}</span>
                <span className="sm:hidden">{isSaving ? '...' : 'OK'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Résultat de l'enregistrement */}
        {result && result.status !== 'error' && (
          <div className="pt-2">{renderResult(result)}</div>
        )}
        {result && result.status === 'error' && (
          <div className="pt-1">{renderResult(result)}</div>
        )}
      </div>
    </div>
  );
};
