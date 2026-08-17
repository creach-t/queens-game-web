import { GameState } from "../types/game";

/**
 * Réinitialise le plateau de jeu (vide toutes les cellules)
 */
export function resetGameBoard(gameState: GameState): GameState {
  const newBoard = gameState.board.map((row) =>
    row.map((cell) => ({
      ...cell,
      state: "empty" as const,
      isHighlighted: false,
      isConflict: false,
      isInConflictLine: false,
      isInConflictColumn: false,
      isInConflictRegion: false,
      isAroundConflictQueen: false,
    }))
  );

  const newRegions = gameState.regions.map((region) => ({
    ...region,
    hasQueen: false,
    queenPosition: undefined,
  }));

  return {
    ...gameState,
    board: newBoard,
    regions: newRegions,
    queensPlaced: 0,
    isCompleted: false,
    moveCount: 0,
  };
}
