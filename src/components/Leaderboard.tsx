import React, { useEffect, useState } from 'react';
import { Trophy, Clock, Medal } from 'lucide-react';
import { LeaderboardData } from '../types/game';
import { levelStorage } from '../utils/levelStorage';

interface LeaderboardProps {
  levelKey?: string;
  formatTime: (seconds: number) => string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ levelKey, formatTime }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({ entries: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!levelKey) {
      setIsLoading(false);
      return;
    }

    const loadLeaderboard = async () => {
      setIsLoading(true);
      const data = await levelStorage.getLeaderboard(levelKey);
      setLeaderboardData(data);
      setIsLoading(false);
    };

    loadLeaderboard();
  }, [levelKey]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-gray-800">Leaderboard</h3>
        </div>
        <div className="text-sm text-gray-500 text-center py-4">Chargement...</div>
      </div>
    );
  }

  if (!levelKey || leaderboardData.entries.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-gray-800">Leaderboard</h3>
        </div>
        <div className="text-sm text-gray-500 text-center py-4">
          Aucun score pour ce niveau
        </div>
      </div>
    );
  }

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
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-gray-800">Top 10</h3>
      </div>

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
            <div className="flex items-center gap-2">
              {getMedalIcon(index + 1)}
              <span className="text-gray-700 text-xs truncate max-w-[100px]">
                {entry.userId.slice(0, 8)}...
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="w-3 h-3" />
              <span className="font-medium">{formatTime(entry.time)}</span>
            </div>
          </div>
        ))}
      </div>

      {leaderboardData.userBest && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Votre meilleur temps</div>
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-2 rounded">
            <span className="text-sm font-medium text-blue-900">Vous</span>
            <div className="flex items-center gap-1 text-blue-900">
              <Clock className="w-3 h-3" />
              <span className="font-bold">{formatTime(leaderboardData.userBest.time)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
