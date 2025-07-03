import React, { useMemo } from 'react';
import { GameBoardProps } from '../../types/game';
import { useAnimations } from '../../hooks/useAnimations';
import { BoardGrid } from './BoardGrid';
import { LoadingState } from './LoadingState';

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCellClick,
  showVictoryAnimation = false,
  isGameBlocked = false,
  animationMode = 'none',
  onAnimationComplete,

}) => {
  // Calcul de la taille des cellules
  const cellSize = useMemo(() => {
    const maxWidth = Math.min(600, window.innerWidth * 0.85);
    const maxHeight = Math.min(600, window.innerHeight * 0.6);
    const availableSize = Math.min(maxWidth, maxHeight);
    return Math.floor(availableSize / gameState.gridSize) - 6;
  }, [gameState.gridSize]);

  // Gestion des animations
  const {
    isLoading,
    loadedCells,
    isDestroying
  } = useAnimations({
    gameState,
    animationMode,
    onAnimationComplete
  });

  // Gestion du clic sur une cellule
  const handleCellClick = (row: number, col: number) => {
    if (isLoading || isGameBlocked || isDestroying) return;
    onCellClick(row, col);
  };

  // État de chargement initial
  if (!gameState.board || gameState.board.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="flex justify-center items-center w-full p-2 md:p-4">
      <div className={`
        bg-gradient-to-br from-slate-50 to-slate-100
        rounded-xl md:rounded-2xl shadow-xl border border-gray-200
        p-3 md:p-6
        transition-all duration-300
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
        />
      </div>
    </div>
  );
};