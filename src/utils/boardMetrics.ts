/**
 * Source unique de vérité pour la taille du plateau.
 * Utilisé par GameBoard (pour dimensionner les cellules) ET par GameControls
 * (pour décider si la carte leaderboard peut flotter sans chevaucher la grille).
 * Les deux dérivent du même calcul → pas de désynchronisation.
 */

/** Taille d'une cellule (px) selon la fenêtre et la taille de grille. */
export function computeCellSize(w: number, h: number, gridSize: number): number {
  const isMobile = w < 768;
  const maxWidth = Math.min(600, w * (isMobile ? 0.95 : 0.85));
  // 0.55 réserve la place de la bannière d'indice + du dock de boutons (cf. GameControls).
  const maxHeight = Math.min(600, h * 0.55);
  const availableSize = Math.min(maxWidth, maxHeight);
  const cellMargin = isMobile && gridSize >= 9 ? 4 : 6;
  return Math.floor(availableSize / gridSize) - cellMargin;
}

/** Largeur extérieure de la carte du plateau (grille + paddings + bordure), en px. */
export function computeBoardCardWidth(w: number, h: number, gridSize: number): number {
  const cell = computeCellSize(w, h, gridSize);
  const gridWidth = gridSize * cell + 6; // padding interne 3px de chaque côté (cf. BoardGrid)
  // Padding de la carte : p-6 (48) en desktop (md+), sinon plus petit.
  const cardPadding = w >= 768 ? 48 : w >= 640 ? 24 : 16;
  return gridWidth + cardPadding + 2; // +2 : bordure
}
