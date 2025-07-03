import React from 'react';
import { GameState, Position } from '../types/game';

/**
 * Calcule le style des bordures pour une cellule
 * Gère les bordures entre régions et les bordures externes
 */
export const getCellBorderStyle = (
  gameState: GameState,
  position: Position
): React.CSSProperties => {

  const { row, col } = position;

  if (!gameState.board || !gameState.board[row] || !gameState.board[row][col]) {
    return {};
  }

  const cell = gameState.board[row][col];
  const { gridSize } = gameState;
  const isMobile = window.innerWidth <= 768;

  const style: React.CSSProperties = {};

  // Bordures externes (contour de la grille) - toujours les plus épaisses
  if (row === 0) {
    style.borderTop = isMobile ? '2px solid #2c3e50' : '3px solid #2c3e50';
  }
  if (col === 0) {
    style.borderLeft = isMobile ? '2px solid #2c3e50' : '3px solid #2c3e50';
  }
  if (row === gridSize - 1) {
    style.borderBottom = isMobile ? '2px solid #2c3e50' : '3px solid #2c3e50';
  }
  if (col === gridSize - 1) {
    style.borderRight = isMobile ? '2px solid #2c3e50' : '3px solid #2c3e50';
  }

  // Bordures droites (verticales)
  if (col < gridSize - 1) {
    const rightCell = gameState.board[row][col + 1];
    if (rightCell) {
      if (rightCell.regionId !== cell.regionId) {
        // Entre régions différentes - bordure épaisse
        style.borderRight = isMobile ? '2px solid #2c3e50' : '3px solid #2c3e50';
      } else {
        // Même région - bordure fine
        style.borderRight = '1px solid #2c3e50';
      }
    }
  }

  // Bordures bas (horizontales)
  if (row < gridSize - 1) {
    const bottomCell = gameState.board[row + 1][col];
    if (bottomCell) {
      if (bottomCell.regionId !== cell.regionId) {
        // Entre régions différentes - bordure épaisse
        style.borderBottom = isMobile ? '2px solid #2c3e50' : '3px solid #2c3e50';
      } else {
        // Même région - bordure fine
        style.borderBottom = '1px solid #2c3e50';
      }
    }
  }

  return style;
};

/**
 * Détermine les coins arrondis pour les cellules d'angle de la grille
 */
export const getCellCornerRadius = (
  gridSize: number,
  position: Position
): string => {
  const { row, col } = position;
  if (row === 0 && col === 0) return 'rounded-tl-md';
  if (row === 0 && col === gridSize - 1) return 'rounded-tr-md';
  if (row === gridSize - 1 && col === 0) return 'rounded-bl-md';
  if (row === gridSize - 1 && col === gridSize - 1) return 'rounded-br-md';
  return '';
};

/**
 * Calcule la taille optimale des cellules selon l'écran
 */
export const calculateCellSize = (gridSize: number): number => {
  const maxWidth = Math.min(600, window.innerWidth * 0.85);
  const maxHeight = Math.min(600, window.innerHeight * 0.6);
  const availableSize = Math.min(maxWidth, maxHeight);
  return Math.floor(availableSize / gridSize) - 6;
};