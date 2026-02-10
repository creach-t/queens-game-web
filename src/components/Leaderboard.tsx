import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Trophy, Clock, Medal, Save } from 'lucide-react';
import { LeaderboardData } from '../types/game';
import { levelStorage } from '../utils/levelStorage';

interface LeaderboardProps {
  gridSize: number;
  currentTime?: number;
  isCompleted: boolean;
  onSaveScore?: (playerName: string) => Promise<boolean>;
  formatTime: (seconds: number) => string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  gridSize,
  currentTime,
  isCompleted,
  onSaveScore,
  formatTime
}) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({ entries: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [canEnter, setCanEnter] = useState(false);
  const [savedPlayerName, setSavedPlayerName] = useState<string>(''); // Mémoriser le nom du joueur

  // Empêcher les chargements multiples
  const loadingRef = useRef(false);
  const lastLoadedGridSize = useRef<number | null>(null);

  const loadLeaderboard = useCallback(async () => {
    // Éviter les chargements en parallèle
    if (loadingRef.current) return;

    // Éviter de recharger si déjà chargé pour cette taille
    if (lastLoadedGridSize.current === gridSize && leaderboardData.entries.length > 0) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const data = await levelStorage.getLeaderboard(gridSize);
      setLeaderboardData(data);
      lastLoadedGridSize.current = gridSize;
    } catch (error) {
      console.error('Erreur chargement leaderboard:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [gridSize, leaderboardData.entries.length]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Vérifier si le score peut entrer dans le top 3 et sauvegarder automatiquement si nom déjà connu
  useEffect(() => {
    if (!isCompleted || !currentTime || savedSuccessfully) {
      setCanEnter(false);
      return;
    }

    const checkEligibility = async () => {
      // Utiliser le nom sauvegardé si disponible, sinon un nom temporaire
      const nameToCheck = savedPlayerName || playerName || '___temp___';
      const eligible = await levelStorage.canEnterLeaderboard(gridSize, currentTime, nameToCheck);
      setCanEnter(eligible);

      // Si le joueur a déjà un nom sauvegardé et qu'il est éligible, sauvegarder automatiquement
      if (eligible && savedPlayerName && onSaveScore) {
        setIsSaving(true);
        const success = await onSaveScore(savedPlayerName);
        setIsSaving(false);
        if (success) {
          setSavedSuccessfully(true);
          // Recharger le leaderboard après 500ms
          setTimeout(() => {
            loadLeaderboard();
          }, 500);
        }
      }
    };

    checkEligibility();
  }, [isCompleted, currentTime, gridSize, savedSuccessfully, playerName, savedPlayerName, onSaveScore, loadLeaderboard]);

  const handleSaveScore = async () => {
    if (!playerName.trim() || !onSaveScore || !currentTime) return;

    setIsSaving(true);
    const trimmedName = playerName.trim();
    const success = await onSaveScore(trimmedName);
    setIsSaving(false);

    if (success) {
      setSavedSuccessfully(true);
      setSavedPlayerName(trimmedName); // Mémoriser le nom pour les prochaines victoires
      setPlayerName('');
      // Recharger le leaderboard après 500ms
      setTimeout(() => {
        loadLeaderboard();
      }, 500);
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-700" />;
      default:
        return <span className="text-xs text-gray-500 w-4 text-center">{rank}</span>;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-gray-800">Top 3 - {gridSize}×{gridSize}</h3>
      </div>

      {/* Formulaire de sauvegarde du score (uniquement si éligible) */}
      {isCompleted && currentTime && !savedSuccessfully && canEnter && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-blue-900 font-medium">
            🎉 Top 3 ! Enregistrez votre temps : {formatTime(currentTime)}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Votre nom"
              maxLength={20}
              className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && playerName.trim()) {
                  handleSaveScore();
                }
              }}
            />
            <button
              onClick={handleSaveScore}
              disabled={!playerName.trim() || isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Envoi...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* Message de confirmation */}
      {savedSuccessfully && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800 font-medium">✓ Score enregistré avec succès !</p>
        </div>
      )}

      {/* Liste du leaderboard */}
      {isLoading ? (
        <div className="text-sm text-gray-500 text-center py-4">Chargement...</div>
      ) : leaderboardData.entries.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4">
          Aucun score pour cette taille
        </div>
      ) : (
        <div className="space-y-1">
          {leaderboardData.entries.map((entry, index) => (
            <div
              key={`${entry.userId}-${entry.timestamp}`}
              className={`flex items-center justify-between p-2 rounded text-sm ${
                entry.userId === leaderboardData.userBest?.userId
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getMedalIcon(index + 1)}
                <span className="text-gray-700 text-sm truncate font-medium">
                  {entry.playerName}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 ml-2">
                <Clock className="w-3 h-3" />
                <span className="font-medium">{formatTime(entry.time)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
