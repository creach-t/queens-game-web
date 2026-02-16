import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { levelStorage } from '../utils/levelStorage';

export const GameStats: React.FC = () => {
  const [totalGames, setTotalGames] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const total = await levelStorage.getTotalGamesPlayed();
        setTotalGames(total);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();

    // Rafraîchir les stats toutes les 60 secondes
    const interval = setInterval(loadStats, 60000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return null;
  }

  if (totalGames === null || totalGames === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
      <Users className="h-4 w-4" />
      <span className="font-medium">{totalGames.toLocaleString()}</span>
      <span className="hidden sm:inline">partie{totalGames > 1 ? 's' : ''} jouée{totalGames > 1 ? 's' : ''}</span>
      <span className="sm:hidden">parties</span>
    </div>
  );
};
