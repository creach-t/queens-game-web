import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { UseAnimationsProps, UseAnimationsReturn } from '../types/game';

/**
 * Pré-calcule l'ordre en spirale depuis le centre
 * Utilise un Set pour éviter les doublons O(1) au lieu de .find() O(n)
 */
function computeSpiralOrder(gridSize: number): string[] {
  const centerRow = Math.floor(gridSize / 2);
  const centerCol = Math.floor(gridSize / 2);
  const result: string[] = [];
  const seen = new Set<string>();
  const maxRadius = Math.max(centerRow, centerCol, gridSize - centerRow, gridSize - centerCol);

  for (let radius = 0; radius <= maxRadius; radius++) {
    for (let row = Math.max(0, centerRow - radius); row <= Math.min(gridSize - 1, centerRow + radius); row++) {
      for (let col = Math.max(0, centerCol - radius); col <= Math.min(gridSize - 1, centerCol + radius); col++) {
        if (row === centerRow - radius || row === centerRow + radius ||
            col === centerCol - radius || col === centerCol + radius) {
          const key = `${row}-${col}`;
          if (!seen.has(key)) {
            seen.add(key);
            result.push(key);
          }
        }
      }
    }
  }
  return result;
}

export const useAnimations = ({
  gameState,
  animationMode,
  onAnimationComplete
}: UseAnimationsProps): UseAnimationsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCells, setLoadedCells] = useState<Set<string>>(new Set());
  const [isDestroying, setIsDestroying] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Mémoïser l'ordre spirale — recalculé uniquement si gridSize change
  const spiralOrder = useMemo(
    () => computeSpiralOrder(gameState.gridSize),
    [gameState.gridSize]
  );

  const reverseSpiralOrder = useMemo(
    () => [...spiralOrder].reverse(),
    [spiralOrder]
  );

  // Animation de construction via requestAnimationFrame
  const startConstructionAnimation = useCallback(() => {
    setIsLoading(true);
    setIsDestroying(false);
    setLoadedCells(new Set());

    const delay = Math.max(15, 60 - gameState.gridSize * 3);
    let currentIndex = 0;
    let lastTime = 0;
    let rafId: number;
    let cancelled = false;

    const animate = (timestamp: number) => {
      if (cancelled) return;
      if (!lastTime) lastTime = timestamp;
      const elapsed = timestamp - lastTime;

      if (elapsed >= delay && currentIndex < spiralOrder.length) {
        const key = spiralOrder[currentIndex];
        setLoadedCells(prev => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
        currentIndex++;
        lastTime = timestamp;
      }

      if (currentIndex < spiralOrder.length) {
        rafId = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          if (!cancelled) {
            setIsLoading(false);
            onAnimationComplete?.();
          }
        }, 150);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [spiralOrder, gameState.gridSize, onAnimationComplete]);

  // Animation de destruction via requestAnimationFrame
  const startDestructionAnimation = useCallback(() => {
    setIsDestroying(true);

    const delay = Math.max(10, 40 - gameState.gridSize * 2);
    let currentIndex = 0;
    let lastTime = 0;
    let rafId: number;
    let cancelled = false;

    const animate = (timestamp: number) => {
      if (cancelled) return;
      if (!lastTime) lastTime = timestamp;
      const elapsed = timestamp - lastTime;

      if (elapsed >= delay && currentIndex < reverseSpiralOrder.length) {
        const key = reverseSpiralOrder[currentIndex];
        setLoadedCells(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        currentIndex++;
        lastTime = timestamp;
      }

      if (currentIndex < reverseSpiralOrder.length) {
        rafId = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          if (!cancelled) {
            setIsDestroying(false);
            onAnimationComplete?.();
          }
        }, 100);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [reverseSpiralOrder, gameState.gridSize, onAnimationComplete]);

  // Gestion du mode d'animation avec cleanup propre
  useEffect(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (animationMode === 'construction') {
      cleanupRef.current = startConstructionAnimation();
    } else if (animationMode === 'destruction') {
      cleanupRef.current = startDestructionAnimation();
    } else if (animationMode === 'none') {
      const allCells = new Set<string>();
      for (let row = 0; row < gameState.gridSize; row++) {
        for (let col = 0; col < gameState.gridSize; col++) {
          allCells.add(`${row}-${col}`);
        }
      }
      setLoadedCells(allCells);
      setIsLoading(false);
      setIsDestroying(false);
    }

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [animationMode, gameState.gridSize, startConstructionAnimation, startDestructionAnimation]);

  return {
    isLoading,
    loadedCells,
    isDestroying
  };
};
