import { useEffect, useState } from 'react';
import { UseAnimationsProps, UseAnimationsReturn } from '../types/game';

export const useAnimations = ({
  gameState,
  animationMode,
  onAnimationComplete
}: UseAnimationsProps): UseAnimationsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCells, setLoadedCells] = useState<Set<string>>(new Set());
  const [isDestroying, setIsDestroying] = useState(false);

  // Animation de construction en spirale depuis le centre
  const startConstructionAnimation = () => {
    if (!gameState.board || gameState.board.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsDestroying(false);
    setLoadedCells(new Set());

    const { gridSize } = gameState;
    const centerRow = Math.floor(gridSize / 2);
    const centerCol = Math.floor(gridSize / 2);
    const cells: { row: number; col: number; }[] = [];

    // Spirale depuis le centre
    for (let radius = 0; radius <= Math.max(centerRow, centerCol, gridSize - centerRow, gridSize - centerCol); radius++) {
      for (let row = Math.max(0, centerRow - radius); row <= Math.min(gridSize - 1, centerRow + radius); row++) {
        for (let col = Math.max(0, centerCol - radius); col <= Math.min(gridSize - 1, centerCol + radius); col++) {
          if ((row === centerRow - radius || row === centerRow + radius ||
               col === centerCol - radius || col === centerCol + radius) &&
               !cells.find(c => c.row === row && c.col === col)) {
            cells.push({ row, col });
          }
        }
      }
    }

    // Délai adaptatif selon la taille de grille
    const delay = Math.max(15, 60 - gridSize * 3);
    cells.forEach((cell, index) => {
      setTimeout(() => {
        setLoadedCells(prev => new Set([...prev, `${cell.row}-${cell.col}`]));

        if (index === cells.length - 1) {
          setTimeout(() => {
            setIsLoading(false);
            if (onAnimationComplete) onAnimationComplete();
          }, 150);
        }
      }, index * delay);
    });
  };

  // Animation de destruction de l'extérieur vers le centre
  const startDestructionAnimation = () => {
    if (!gameState.board || gameState.board.length === 0) {
      if (onAnimationComplete) onAnimationComplete();
      return;
    }

    setIsDestroying(true);
    const { gridSize } = gameState;
    const centerRow = Math.floor(gridSize / 2);
    const centerCol = Math.floor(gridSize / 2);
    const destructionOrder: { row: number; col: number; }[] = [];

    // Destruction de l'extérieur vers le centre
    for (let radius = Math.max(centerRow, centerCol, gridSize - centerRow, gridSize - centerCol); radius >= 0; radius--) {
      for (let row = Math.max(0, centerRow - radius); row <= Math.min(gridSize - 1, centerRow + radius); row++) {
        for (let col = Math.max(0, centerCol - radius); col <= Math.min(gridSize - 1, centerCol + radius); col++) {
          if ((row === centerRow - radius || row === centerRow + radius ||
               col === centerCol - radius || col === centerCol + radius) &&
               !destructionOrder.find(c => c.row === row && c.col === col)) {
            destructionOrder.push({ row, col });
          }
        }
      }
    }

    const delay = Math.max(10, 40 - gridSize * 2);
    destructionOrder.forEach((cell, index) => {
      setTimeout(() => {
        setLoadedCells(prev => {
          const newSet = new Set(prev);
          newSet.delete(`${cell.row}-${cell.col}`);
          return newSet;
        });

        if (index === destructionOrder.length - 1) {
          setTimeout(() => {
            setIsDestroying(false);
            if (onAnimationComplete) onAnimationComplete();
          }, 100);
        }
      }, index * delay);
    });
  };

  // Effet pour démarrer les animations selon le mode
  useEffect(() => {
    if (animationMode === 'construction') {
      startConstructionAnimation();
    } else if (animationMode === 'destruction') {
      startDestructionAnimation();
    } else if (animationMode === 'none') {
      setIsLoading(false);
      setIsDestroying(false);
      const allCells = new Set<string>();
      for (let row = 0; row < gameState.gridSize; row++) {
        for (let col = 0; col < gameState.gridSize; col++) {
          allCells.add(`${row}-${col}`);
        }
      }
      setLoadedCells(allCells);
    }
  }, [animationMode, gameState.gridSize, gameState.board.length]);

  return {
    isLoading,
    loadedCells,
    isDestroying
  };
};