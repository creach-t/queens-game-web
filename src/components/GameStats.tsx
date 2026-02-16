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
    <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-gray-500">
      {/* Online Players Counter - Rond vert */}
      {onlineCount !== null && onlineCount > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="relative flex items-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <div className="absolute w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
          </div>
          <span className="font-medium">{onlineCount}</span>
          <span className="hidden sm:inline">connecté{onlineCount > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Séparateur */}
      {onlineCount !== null && onlineCount > 0 && totalGames !== null && totalGames > 0 && (
        <span className="text-gray-300">•</span>
      )}

      {/* Total Games Counter - Phrase discrète */}
      {totalGames !== null && totalGames > 0 && (
        <div className="flex items-center gap-1">
          <span>{totalGames.toLocaleString()}</span>
          <span>partie{totalGames > 1 ? 's' : ''} gagnée{totalGames > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};
