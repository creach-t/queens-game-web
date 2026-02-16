import React, { useEffect, useState } from 'react';
import { Users, Activity } from 'lucide-react';
import { levelStorage } from '../utils/levelStorage';

export const GameStats: React.FC = () => {
  const [totalGames, setTotalGames] = useState<number | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Démarrer le suivi de présence
    levelStorage.startPresenceTracking();

    // S'abonner au nombre de joueurs en ligne
    const unsubscribePresence = levelStorage.subscribeToOnlineCount(setOnlineCount);

    // S'abonner aux stats de parties gagnées (temps réel)
    const unsubscribeStats = levelStorage.subscribeToGamesWon((count) => {
      setTotalGames(count);
      setIsLoading(false);
    });

    return () => {
      levelStorage.stopPresenceTracking();
      unsubscribePresence();
      unsubscribeStats();
    };
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {/* Online Players Counter */}
      {onlineCount !== null && onlineCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <Activity className="h-4 w-4" />
          <span className="font-medium">{onlineCount}</span>
          <span className="hidden sm:inline">
            joueur{onlineCount > 1 ? 's' : ''} en ligne
          </span>
          <span className="sm:hidden">online</span>
        </div>
      )}

      {/* Total Games Counter */}
      {totalGames !== null && totalGames > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Users className="h-4 w-4" />
          <span className="font-medium">{totalGames.toLocaleString()}</span>
          <span className="hidden sm:inline">
            partie{totalGames > 1 ? 's' : ''} gagnée{totalGames > 1 ? 's' : ''}
          </span>
          <span className="sm:hidden">wins</span>
        </div>
      )}
    </div>
  );
};
