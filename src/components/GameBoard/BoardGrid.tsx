import React, { useCallback, useMemo, useRef } from 'react';
import { BoardGridProps } from '../../types/game';
import { getCellBorderStyle, getCornerClasses } from '../../utils/boardUtils';
import { GameCell } from '../GameCell';
import { AnimationOverlay } from './AnimationOverlay';

/** Retrouve la cellule [data-row][data-col] sous un point (x, y) de l'écran */
function getCellAtPoint(x: number, y: number): { row: number; col: number } | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const cellEl = (el as HTMLElement).closest('[data-row]') as HTMLElement;
  if (!cellEl) return null;
  const row = Number(cellEl.dataset.row);
  const col = Number(cellEl.dataset.col);
  if (isNaN(row) || isNaN(col)) return null;
  return { row, col };
}

export const BoardGrid: React.FC<BoardGridProps> = ({
  gameState,
  cellSize,
  loadedCells,
  isDestroying,
  isLoading,
  showVictoryAnimation,
  onCellClick,
  onMarkCell
}) => {
  // Pré-calculer les coins arrondis (4 entrées max)
  const cornerClasses = useMemo(
    () => getCornerClasses(gameState.gridSize),
    [gameState.gridSize]
  );

  // Pré-calculer isMobile une seule fois
  const isMobile = useMemo(() => window.innerWidth <= 768, []);

  // Pré-calculer tous les styles de bordure (ne dépend que des régions)
  const borderStyles = useMemo(() => {
    const styles = new Map<string, React.CSSProperties>();
    for (let row = 0; row < gameState.gridSize; row++) {
      for (let col = 0; col < gameState.gridSize; col++) {
        styles.set(
          `${row}-${col}`,
          getCellBorderStyle(gameState, { row, col }, isMobile)
        );
      }
    }
    return styles;
  }, [gameState.gridSize, gameState.board, isMobile]);

  // Event delegation : desktop uniquement (tactile géré par touch handlers)
  const handleGridClick = useCallback((e: React.MouseEvent) => {
    if (isTouchDevice.current) return;
    const target = (e.target as HTMLElement).closest('[data-row]') as HTMLElement;
    if (!target) return;
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    if (!isNaN(row) && !isNaN(col)) {
      onCellClick(row, col);
    }
  }, [onCellClick]);

  // --- Gestion tactile ---
  // Dès qu'un touchstart est détecté, on sait qu'on est sur un device tactile
  // et on ignore tous les click (qui sont gérés via touchend)
  const isTouchDevice = useRef(false);
  const isSwiping = useRef(false);
  const lastSwipedCell = useRef<string | null>(null);
  const swipedCells = useRef<Set<string>>(new Set());
  const touchStartCell = useRef<{ row: number; col: number } | null>(null);
  const hasMoved = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isTouchDevice.current = true;
    const touch = e.touches[0];
    const cell = getCellAtPoint(touch.clientX, touch.clientY);
    if (!cell) return;

    touchStartCell.current = cell;
    hasMoved.current = false;
    // On ne démarre pas encore le swipe — on attend un touchmove
    lastSwipedCell.current = `${cell.row}-${cell.col}`;
    swipedCells.current = new Set();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const cell = getCellAtPoint(touch.clientX, touch.clientY);
    if (!cell) return;

    const cellKey = `${cell.row}-${cell.col}`;

    // Première fois qu'on bouge : activer le mode swipe
    if (!hasMoved.current) {
      hasMoved.current = true;
      isSwiping.current = true;

      // Marquer aussi la cellule de départ si elle est vide
      if (touchStartCell.current) {
        const startKey = `${touchStartCell.current.row}-${touchStartCell.current.col}`;
        swipedCells.current.add(startKey);
        onMarkCell(touchStartCell.current.row, touchStartCell.current.col);
      }
    }

    // Éviter de re-marquer la même cellule
    if (cellKey === lastSwipedCell.current || swipedCells.current.has(cellKey)) return;

    lastSwipedCell.current = cellKey;
    swipedCells.current.add(cellKey);
    onMarkCell(cell.row, cell.col);
  }, [onMarkCell]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const wasSwiping = hasMoved.current;
    const startCell = touchStartCell.current;

    // Toujours empêcher le click synthétique sur tactile — on gère tout ici
    e.preventDefault();

    // Tap sans mouvement → cycle normal (empty → marked → queen → empty)
    if (!wasSwiping && startCell) {
      onCellClick(startCell.row, startCell.col);
    }

    isSwiping.current = false;
    lastSwipedCell.current = null;
    swipedCells.current.clear();
    touchStartCell.current = null;
    hasMoved.current = false;
  }, [onCellClick, gameState.board]);

  const isAnimating = isLoading || isDestroying;

  return (
    <div
      className="bg-slate-800 rounded-lg shadow-inner relative overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gameState.gridSize}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${gameState.gridSize}, ${cellSize}px)`,
        gap: '0px',
        padding: '3px',
        touchAction: 'none', // Empêcher le scroll pendant le swipe sur la grille
      }}
      onClick={handleGridClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {gameState.board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const cellKey = `${rowIndex}-${colIndex}`;
          const isLoaded = loadedCells.has(cellKey);

          return (
            <div
              key={cellKey}
              data-row={rowIndex}
              data-col={colIndex}
              className={`
                relative overflow-hidden
                ${cornerClasses.get(cellKey) || ''}
                ${isLoaded ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
                ${isDestroying ? 'blur-sm' : ''}
                ${isAnimating ? 'transition-transform transition-opacity duration-300 ease-out' : ''}
              `}
              style={borderStyles.get(cellKey)}
            >
              <GameCell
                cell={cell}
                size={cellSize}
                showVictoryAnimation={showVictoryAnimation}
                isLoading={!isLoaded}
              />
            </div>
          );
        })
      )}

      <AnimationOverlay
        isDestroying={isDestroying}
        isLoading={isLoading}
      />
    </div>
  );
};
