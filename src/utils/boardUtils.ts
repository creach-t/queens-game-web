import React from 'react';
import { GameState, Position } from '../types/game';

/**
 * Calcule le style des bordures pour une cellule
 * Paramètre isMobile passé pour éviter 144 appels à window.innerWidth
 */
export const getCellBorderStyle = (
  gameState: GameState,
  position: Position,
  isMobile: boolean
): React.CSSProperties => {
  const { row, col } = position;

  if (!gameState.board || !gameState.board[row] || !gameState.board[row][col]) {
    return {};
  }

  const cell = gameState.board[row][col];
  const { gridSize } = gameState;
  const style: React.CSSProperties = {};

  const thickBorder = isMobile ? '2px solid #2c3e50' : '3px solid #2c3e50';
  const thinBorder = '1px solid #2c3e50';

  // Bordures externes
  if (row === 0) style.borderTop = thickBorder;
  if (col === 0) style.borderLeft = thickBorder;
  if (row === gridSize - 1) style.borderBottom = thickBorder;
  if (col === gridSize - 1) style.borderRight = thickBorder;

  // Bordures droites (entre régions)
  if (col < gridSize - 1) {
    const rightCell = gameState.board[row][col + 1];
    if (rightCell) {
      style.borderRight = rightCell.regionId !== cell.regionId ? thickBorder : thinBorder;
    }
  }

  // Bordures bas (entre régions)
  if (row < gridSize - 1) {
    const bottomCell = gameState.board[row + 1][col];
    if (bottomCell) {
      style.borderBottom = bottomCell.regionId !== cell.regionId ? thickBorder : thinBorder;
    }
  }

  return style;
};

/**
 * Map des coins arrondis — seulement 4 cellules en ont besoin
 */
export const getCornerClasses = (gridSize: number): Map<string, string> => {
  const g = gridSize - 1;
  return new Map([
    ['0-0', 'rounded-tl-md'],
    [`0-${g}`, 'rounded-tr-md'],
    [`${g}-0`, 'rounded-bl-md'],
    [`${g}-${g}`, 'rounded-br-md'],
  ]);
};
