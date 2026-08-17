import React, { useEffect, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { GameControlsProps } from '../../types/game';
import { levelStorage } from '../../utils/levelStorage';
import { computeBoardCardWidth } from '../../utils/boardMetrics';
import { MainControls } from './MainControls';
import { HintBanner } from './HintBanner';
import { Rules } from './Rules';
import { SizeGridSelector } from './SizeGridSelector';
import { SuccessMessage } from './SuccessMessage';
import { Leaderboard } from '../Leaderboard';
import { FullLeaderboard } from '../FullLeaderboard';
import { Timer } from '../Timer';
import { GameBoard } from '../GameBoard';
import { LoadingState } from '../GameBoard/LoadingState';

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  gameTime,
  onResetGame,
  onNewGame,
  onGridSizeChange,
  onSaveScore,
  isLoading,
  onCellClick,
  onMarkCell,
  isGameBlocked,
  onHint,
  hintCooldown,
  hintPenalty,
  hint,
  onDismissHint,
}) => {
  const [levelCounts, setLevelCounts] = useState<Record<number, number>>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(true);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);

  // Taille de fenêtre (throttlée) pour décider si la carte leaderboard peut flotter à côté du plateau
  const [winSize, setWinSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setWinSize({ w: window.innerWidth, h: window.innerHeight }));
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, []);

  // La carte flottante ne s'affiche que si elle ne chevauche PAS le plateau ; sinon → bouton trophée (comme mobile).
  // Calcul déterministe via la même formule que GameBoard (aucune mesure DOM → pas de course/état bloqué).
  const LEADERBOARD_W = 256; // w-64
  const canFloatLeaderboard = useMemo(() => {
    const { w, h } = winSize;
    if (w < 768) return false;
    const boardRight = w / 2 + computeBoardCardWidth(w, h, gameState.gridSize) / 2;
    const leaderboardLeft = w - 16 - LEADERBOARD_W; // right-4
    return leaderboardLeft > boardRight + 16; // marge de sécurité 16px
  }, [winSize, gameState.gridSize]);

  // Charger les counts une seule fois au mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const counts = await levelStorage.getLevelCounts();
      if (!cancelled) setLevelCounts(counts);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Réafficher le message de succès quand le jeu est complété
  useEffect(() => {
    if (gameState.isCompleted) {
      setShowSuccessMessage(true);
    }
  }, [gameState.isCompleted]);

  const formatTime = (seconds: number): string => {
    const validSeconds = isNaN(seconds) || seconds < 0 ? 0 : Math.floor(seconds);
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showVictoryAnimation = gameState.isCompleted;

  return (
    <>
      {/* Overlays du haut — barre courte (Rules + Timer). Le leaderboard desktop flotte
          en position absolue pour ne pas allonger cette barre et faire descendre la grille. */}
      <div className="relative grid grid-cols-3 items-center gap-2 px-2 sm:px-4 py-2">
        {/* Rules (?) - colonne gauche */}
        <div className="flex justify-start">
          <Rules />
        </div>

        {/* Timer centré - colonne centrale */}
        <div className="flex justify-center">
          <Timer gameTime={gameTime} isCompleted={gameState.isCompleted} />
        </div>

        {/* Colonne droite : bouton trophée quand la carte ne peut pas flotter (mobile + desktop étroit) */}
        {!canFloatLeaderboard && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 shadow-lg rounded-full flex items-center justify-center transition-all hover:scale-110"
              title="Classement"
            >
              <Trophy className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-yellow-600" />
            </button>
          </div>
        )}

        {/* Leaderboard flottant en haut à droite (hors flux vertical) — seulement s'il ne chevauche pas la grille */}
        {canFloatLeaderboard && (
          <div className="absolute right-4 top-2 w-64 z-30">
            <Leaderboard
              gridSize={gameState.gridSize}
              formatTime={formatTime}
              onShowFull={() => setShowFullLeaderboard(true)}
            />
          </div>
        )}
      </div>

      {/* Popup leaderboard (déclenché par le trophée : mobile + desktop étroit) */}
      {showLeaderboard && (
        <>
          {/* Standardized backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setShowLeaderboard(false)}
          />
          <div className="fixed top-16 right-2 z-50 max-w-[min(320px,calc(100vw-1rem))]">
            <Leaderboard
              gridSize={gameState.gridSize}
              formatTime={formatTime}
              onShowFull={() => {
                setShowLeaderboard(false);
                setShowFullLeaderboard(true);
              }}
            />
          </div>
        </>
      )}

      {/* Grille de jeu - flex-1 pour prendre l'espace disponible */}
      <div className="flex-1 flex items-center justify-center px-2 relative min-h-0">
        {isLoading ? (
          <LoadingState />
        ) : (
          <GameBoard
            gameState={gameState}
            onCellClick={onCellClick}
            onMarkCell={onMarkCell}
            showVictoryAnimation={showVictoryAnimation}
            isGameBlocked={isGameBlocked || false}
            animationMode="none"
            hintForbidden={hint?.forbidden}
            hintTarget={hint?.target}
          />
        )}

        {/* Victory Message - overlay centré sur la grille */}
        {gameState.isCompleted && showSuccessMessage && (
          <>
            {/* Standardized backdrop */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowSuccessMessage(false)}
            />

            {/* Content centered with fixed positioning */}
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 p-2 sm:p-4">
              <div className="pointer-events-auto w-full flex items-center justify-center">
                <SuccessMessage
                  gameState={gameState}
                  gameTime={gameTime}
                  formatTime={formatTime}
                  onSaveScore={onSaveScore}
                  onClose={() => setShowSuccessMessage(false)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bannière d'indice — au-dessus des boutons, dans le flux (ne recouvre jamais la grille) */}
      {hint && (
        <div className="flex justify-center px-2 pt-1 shrink-0">
          <HintBanner hint={hint} onClose={() => onDismissHint?.()} />
        </div>
      )}

      {/* Dock de contrôles bas — centré, pouce-friendly, s'adapte en largeur */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-2 sm:px-4 py-2">
        <SizeGridSelector
          currentGridSize={gameState.gridSize}
          onGridSizeChange={onGridSizeChange}
          levelCounts={levelCounts}
        />

        <MainControls
          onResetGame={onResetGame}
          onNewGame={onNewGame}
          isCompleted={gameState.isCompleted}
          onHint={onHint}
          hintCooldown={hintCooldown}
          hintPenalty={hintPenalty}
          hintDisabled={isLoading}
        />
      </div>

      {/* Modale du classement complet */}
      {showFullLeaderboard && (
        <FullLeaderboard
          gridSize={gameState.gridSize}
          formatTime={formatTime}
          onClose={() => setShowFullLeaderboard(false)}
        />
      )}
    </>
  );
};
