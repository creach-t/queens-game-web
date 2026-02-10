import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { GameBoardProps } from '../../types/game';
import { useAnimations } from '../../hooks/useAnimations';
import { BoardGrid } from './BoardGrid';
import { LoadingState } from './LoadingState';

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCellClick,
  onMarkCell,
  showVictoryAnimation = false,
  isGameBlocked = false,
  animationMode = 'none',
  onAnimationComplete,
}) => {
  // Responsive cell size avec resize listener
  const [windowSize, setWindowSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight
  });

  useEffect(() => {
    let rafId: number;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const cellSize = useMemo(() => {
    // Pour mobile (< 768px), utiliser 95% de la largeur pour maximiser l'espace
    const isMobile = windowSize.w < 768;
    const maxWidth = Math.min(600, windowSize.w * (isMobile ? 0.95 : 0.85));
    const maxHeight = Math.min(600, windowSize.h * 0.6);
    const availableSize = Math.min(maxWidth, maxHeight);
    // Réduire la marge entre cellules sur mobile (grandes grilles)
    const cellMargin = isMobile && gameState.gridSize >= 9 ? 4 : 6;
    return Math.floor(availableSize / gameState.gridSize) - cellMargin;
  }, [gameState.gridSize, windowSize.w, windowSize.h]);

  // Animations
  const {
    isLoading,
    loadedCells,
    isDestroying
  } = useAnimations({
    gameState,
    animationMode,
    onAnimationComplete
  });

  // Handlers stables avec useCallback
  const handleCellClick = useCallback((row: number, col: number) => {
    if (isLoading || isGameBlocked || isDestroying) return;
    onCellClick(row, col);
  }, [isLoading, isGameBlocked, isDestroying, onCellClick]);

  const handleMarkCell = useCallback((row: number, col: number) => {
    if (isLoading || isGameBlocked || isDestroying) return;
    onMarkCell(row, col);
  }, [isLoading, isGameBlocked, isDestroying, onMarkCell]);

  // État de chargement initial
  if (!gameState.board || gameState.board.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="flex justify-center items-center w-full p-1 sm:p-2 md:p-4">
      <div className={`
        bg-gradient-to-br from-slate-50 to-slate-100
        rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl border border-gray-200
        p-2 sm:p-3 md:p-6
        transition-opacity duration-300
        ${isGameBlocked ? 'pointer-events-none opacity-70' : ''}
      `}>
        <BoardGrid
          gameState={gameState}
          cellSize={cellSize}
          loadedCells={loadedCells}
          isDestroying={isDestroying}
          isLoading={isLoading}
          showVictoryAnimation={showVictoryAnimation && !isLoading && !isDestroying}
          onCellClick={handleCellClick}
          onMarkCell={handleMarkCell}
        />
      </div>
    </div>
  );
};
