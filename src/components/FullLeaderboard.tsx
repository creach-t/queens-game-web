import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Trophy, Clock, Medal, X, Loader2 } from 'lucide-react';
import { RankedEntry } from '../types/game';
import { levelStorage } from '../utils/levelStorage';

const PAGE_SIZE = 20;

interface FullLeaderboardProps {
  gridSize: number;
  formatTime: (seconds: number) => string;
  onClose: () => void;
}

const getMedal = (rank: number) => {
  switch (rank) {
    case 1:
      return <Medal className="w-4 h-4 text-yellow-500 shrink-0" />;
    case 2:
      return <Medal className="w-4 h-4 text-gray-400 shrink-0" />;
    case 3:
      return <Medal className="w-4 h-4 text-amber-700 shrink-0" />;
    default:
      return <span className="text-xs text-gray-500 w-6 text-center shrink-0">{rank}</span>;
  }
};

export const FullLeaderboard: React.FC<FullLeaderboardProps> = ({
  gridSize,
  formatTime,
  onClose,
}) => {
  const [entries, setEntries] = useState<RankedEntry[]>([]);
  const [cursor, setCursor] = useState<{ time: number; key: string } | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  const currentUserId = levelStorage.getCurrentUserId();

  const loadPage = useCallback(
    async (isFirst: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (isFirst) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        // rang de départ = nb d'entrées déjà chargées + 1
        const startRank = isFirst ? 1 : entries.length + 1;
        const page = await levelStorage.getLeaderboardPage(
          gridSize,
          PAGE_SIZE,
          isFirst ? null : cursor,
          startRank
        );
        setEntries((prev) => (isFirst ? page.entries : [...prev, ...page.entries]));
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } catch (error) {
        console.error('Erreur chargement leaderboard complet:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [gridSize, cursor, entries.length]
  );

  // Charger la première page au montage / changement de grille
  useEffect(() => {
    setEntries([]);
    setCursor(null);
    setHasMore(false);
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridSize]);

  // Fermer avec Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop standardisé */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />

      {/* Modale */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 pointer-events-none">
        <div className="pointer-events-auto bg-white shadow-2xl rounded-xl border border-gray-200 w-full max-w-md max-h-[85vh] flex flex-col">
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-800">
                Classement complet — {gridSize}×{gridSize}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Corps scrollable */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-8">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement…
              </div>
            ) : entries.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                Aucun score pour cette taille de grille.
              </div>
            ) : (
              <div className="space-y-1">
                {entries.map((entry) => (
                  <div
                    key={entry.key}
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      currentUserId && entry.userId === currentUserId
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getMedal(entry.rank)}
                      <span className="text-gray-700 truncate font-medium">
                        {entry.playerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 ml-2 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono font-medium">{formatTime(entry.time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pied : voir plus */}
          {hasMore && !isLoading && (
            <div className="px-3 py-2 border-t border-gray-100">
              <button
                onClick={() => loadPage(false)}
                disabled={isLoadingMore}
                className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:text-gray-400"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement…
                  </>
                ) : (
                  `Voir plus (${PAGE_SIZE} de plus)`
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
