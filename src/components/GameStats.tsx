import React, { useEffect, useState } from 'react';
import { Users, Activity } from 'lucide-react';
import { levelStorage } from '../utils/levelStorage';

export const GameStats: React.FC = () => {
  const [totalGames, setTotalGames] = useState<number | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribePresence: (() => void) | undefined;
    let unsubscribeStats: (() => void) | undefined;

    const setup = async () => {
      // Démarrer le suivi de présence et attendre qu'il soit initialisé
      await levelStorage.startPresenceTracking();

      // S'abonner au nombre de joueurs en ligne (attendra auth en interne)
      unsubscribePresence = levelStorage.subscribeToOnlineCount(setOnlineCount);

      // S'abonner aux stats de parties gagnées (temps réel)
      unsubscribeStats = levelStorage.subscribeToGamesWon((count) => {
        setTotalGames(count);
        setIsLoading(false);
      });
    };

    setup();

    return () => {
      levelStorage.stopPresenceTracking();
      if (unsubscribePresence) unsubscribePresence();
      if (unsubscribeStats) unsubscribeStats();
    };
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {/* Online Players Counter */}
      {onlineCount !== null && onlineCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
          <Activity className="h-3 w-3" />
          <span className="font-medium">{onlineCount}</span>
          <span className="hidden sm:inline">
            joueur{onlineCount > 1 ? 's' : ''} en ligne
          </span>
          <span className="sm:hidden">online</span>
        </div>
      )}

      {/* Total Games Counter */}
      {totalGames !== null && totalGames > 0 && (
        <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
          <Users className="h-3 w-3" />
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
