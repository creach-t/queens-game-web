import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Trophy, Clock, Medal } from 'lucide-react';
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
  formatTime
}) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({ entries: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Empêcher les chargements multiples
  const loadingRef = useRef(false);
  const lastLoadedGridSize = useRef<number | null>(null);

  const loadLeaderboard = useCallback(async (forceRefresh = false) => {
    // Éviter les chargements en parallèle
    if (loadingRef.current) return;

    // Éviter de recharger si déjà chargé pour cette taille (sauf si forceRefresh)
    if (!forceRefresh && lastLoadedGridSize.current === gridSize && leaderboardData.entries.length > 0) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      // Si forceRefresh, invalider le cache d'abord
      if (forceRefresh) {
        levelStorage.invalidateLeaderboardCache(gridSize);
      }
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
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-600" />
        <h3 className="font-semibold text-gray-800 text-sm">Top 3 - {gridSize}×{gridSize}</h3>
      </div>

      {/* Liste du leaderboard */}
      {isLoading ? (
        <div className="text-xs text-gray-500 text-center py-3">Chargement...</div>
      ) : leaderboardData.entries.length === 0 ? (
        <div className="text-xs text-gray-500 text-center py-3">
          Aucun score pour cette taille
        </div>
      ) : (
        <div className="space-y-1">
          {leaderboardData.entries.map((entry, index) => (
            <div
              key={`${entry.userId}-${entry.timestamp}`}
              className={`flex items-center justify-between p-1.5 rounded text-xs ${
                entry.userId === leaderboardData.userBest?.userId
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getMedalIcon(index + 1)}
                <span className="text-gray-700 text-xs truncate font-medium">
                  {entry.playerName}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 ml-2">
                <Clock className="w-3 h-3" />
                <span className="font-medium text-xs">{formatTime(entry.time)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
