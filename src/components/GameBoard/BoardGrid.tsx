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
  onMarkCell,
  forbiddenKeys,
  targetKey
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

  // Détermine l'action « intelligente » verrouillée d'un glisser selon l'état de la
  // 1re case : vide → on POSE des croix, barrée → on RETIRE des croix, reine → rien.
  // Toute la trajectoire applique ensuite cette même action (parité souris/tactile).
  const boardRef = useRef(gameState.board);
  boardRef.current = gameState.board;
  const dragActionFor = useCallback((row: number, col: number): 'mark' | 'unmark' | null => {
    const state = boardRef.current[row]?.[col]?.state;
    if (state === 'empty') return 'mark';
    if (state === 'marked') return 'unmark';
    return null; // reine : on ne peint pas par-dessus
  }, []);

  // --- Gestion tactile ---
  // Dès qu'un touchstart est détecté, on sait qu'on est sur un device tactile
  // et on ignore tous les click (qui sont gérés via touchend)
  const isTouchDevice = useRef(false);
  const lastSwipedCell = useRef<string | null>(null);
  const swipedCells = useRef<Set<string>>(new Set());
  const touchStartCell = useRef<{ row: number; col: number } | null>(null);
  const hasMoved = useRef(false);
  const swipeAction = useRef<'mark' | 'unmark' | null>(null);

  // --- Gestion mouse drag (desktop) ---
  const mouseStartCell = useRef<{ row: number; col: number } | null>(null);
  const draggedCells = useRef<Set<string>>(new Set());
  const lastDraggedCell = useRef<string | null>(null);
  const hasMouseMoved = useRef(false);
  const mouseAction = useRef<'mark' | 'unmark' | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isTouchDevice.current = true;
    const touch = e.touches[0];
    const cell = getCellAtPoint(touch.clientX, touch.clientY);
    if (!cell) return;

    touchStartCell.current = cell;
    hasMoved.current = false;
    swipeAction.current = null;
    // On ne démarre pas encore le swipe — on attend un touchmove
    lastSwipedCell.current = `${cell.row}-${cell.col}`;
    swipedCells.current = new Set();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const cell = getCellAtPoint(touch.clientX, touch.clientY);
    if (!cell) return;

    const cellKey = `${cell.row}-${cell.col}`;

    // Première fois qu'on bouge : verrouiller l'action sur la case de départ
    if (!hasMoved.current) {
      hasMoved.current = true;

      if (touchStartCell.current) {
        const start = touchStartCell.current;
        swipeAction.current = dragActionFor(start.row, start.col);
        if (swipeAction.current) {
          swipedCells.current.add(`${start.row}-${start.col}`);
          onMarkCell(start.row, start.col, swipeAction.current);
        }
      }
    }

    if (!swipeAction.current) return; // glisser démarré sur une reine : rien à peindre

    // Éviter de re-traiter la même cellule
    if (cellKey === lastSwipedCell.current || swipedCells.current.has(cellKey)) return;

    lastSwipedCell.current = cellKey;
    swipedCells.current.add(cellKey);
    onMarkCell(cell.row, cell.col, swipeAction.current);
  }, [onMarkCell, dragActionFor]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const wasSwiping = hasMoved.current;
    const startCell = touchStartCell.current;

    // Toujours empêcher le click synthétique sur tactile — on gère tout ici
    e.preventDefault();

    // Tap sans mouvement → cycle normal (empty → marked → queen → empty)
    if (!wasSwiping && startCell) {
      onCellClick(startCell.row, startCell.col);
    }

    lastSwipedCell.current = null;
    swipedCells.current.clear();
    touchStartCell.current = null;
    hasMoved.current = false;
    swipeAction.current = null;
  }, [onCellClick]);

  // --- Gestion mouse drag (desktop) ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Skip si device tactile, ou clic non gauche (le clic droit est géré par onContextMenu)
    if (isTouchDevice.current || e.button !== 0) return;

    const cell = getCellAtPoint(e.clientX, e.clientY);
    if (!cell) return;

    mouseStartCell.current = cell;
    hasMouseMoved.current = false;
    mouseAction.current = null;
    lastDraggedCell.current = `${cell.row}-${cell.col}`;
    draggedCells.current = new Set();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Skip si device tactile ou pas de mousedown actif
    if (isTouchDevice.current || !mouseStartCell.current) return;

    const cell = getCellAtPoint(e.clientX, e.clientY);
    if (!cell) return;

    const cellKey = `${cell.row}-${cell.col}`;

    // Première fois qu'on bouge : verrouiller l'action sur la case de départ
    if (!hasMouseMoved.current) {
      hasMouseMoved.current = true;

      const start = mouseStartCell.current;
      mouseAction.current = dragActionFor(start.row, start.col);
      if (mouseAction.current) {
        draggedCells.current.add(`${start.row}-${start.col}`);
        onMarkCell(start.row, start.col, mouseAction.current);
      }
    }

    if (!mouseAction.current) return; // glisser démarré sur une reine : rien à peindre

    // Éviter de re-traiter la même cellule
    if (cellKey === lastDraggedCell.current || draggedCells.current.has(cellKey)) return;

    lastDraggedCell.current = cellKey;
    draggedCells.current.add(cellKey);
    onMarkCell(cell.row, cell.col, mouseAction.current);
  }, [onMarkCell, dragActionFor]);

  const resetMouseDrag = useCallback(() => {
    lastDraggedCell.current = null;
    draggedCells.current.clear();
    mouseStartCell.current = null;
    hasMouseMoved.current = false;
    mouseAction.current = null;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isTouchDevice.current) return;

    const wasDragging = hasMouseMoved.current;
    const startCell = mouseStartCell.current;

    // Click sans drag → cycle normal
    if (!wasDragging && startCell) {
      onCellClick(startCell.row, startCell.col);
    }

    resetMouseDrag();
  }, [onCellClick, resetMouseDrag]);

  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice.current) return;
    // Reset l'état de drag quand la souris quitte la grille
    resetMouseDrag();
  }, [resetMouseDrag]);

  // Clic droit (desktop) : poser / retirer une croix directement, sans menu contextuel.
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Toujours supprimer le menu contextuel natif sur la grille
    e.preventDefault();
    if (isTouchDevice.current) return; // parité tactile : géré par le tap/swipe

    // Un clic droit interrompt un éventuel glisser gauche en cours
    resetMouseDrag();

    const cell = getCellAtPoint(e.clientX, e.clientY);
    if (!cell) return;
    onMarkCell(cell.row, cell.col, 'toggle');
  }, [onMarkCell, resetMouseDrag]);

  const isAnimating = isLoading || isDestroying;

  return (
    <div
      className="bg-slate-800 rounded-lg shadow-inner relative overflow-hidden select-none"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gameState.gridSize}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${gameState.gridSize}, ${cellSize}px)`,
        gap: '0px',
        padding: '3px',
        touchAction: 'none', // Empêcher le scroll pendant le swipe sur la grille
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {gameState.board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const cellKey = `${rowIndex}-${colIndex}`;
          const isLoaded = loadedCells.has(cellKey);
          const isTarget = targetKey === cellKey;
          const isForbidden = forbiddenKeys?.has(cellKey) ?? false;

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
                ${isTarget ? 'hint-highlight' : ''}
              `}
              style={borderStyles.get(cellKey)}
            >
              <GameCell
                cell={cell}
                size={cellSize}
                showVictoryAnimation={showVictoryAnimation}
                isLoading={!isLoaded}
              />
              {isForbidden && (
                <div className="hint-forbidden-overlay absolute inset-0 pointer-events-none" aria-hidden="true" />
              )}
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
