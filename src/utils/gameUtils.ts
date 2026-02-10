import { ColoredRegion, GameCell, GameState, Position } from "../types/game";
import { REGION_COLORS } from "../constants";

/**
 * Initialise le plateau de jeu
 */
export function initializeBoard(
  gridSize: number,
  regions: ColoredRegion[]
): GameCell[][] {
  const board: GameCell[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(null));

  const regionMap = new Map<string, { id: number; color: string }>();
  regions.forEach((region) => {
    region.cells.forEach((cell) => {
      regionMap.set(`${cell.row}-${cell.col}`, {
        id: region.id,
        color: region.color,
      });
    });
  });

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const regionInfo = regionMap.get(`${row}-${col}`);

      board[row][col] = {
        row,
        col,
        regionId: regionInfo?.id ?? 0,
        regionColor: regionInfo?.color ?? REGION_COLORS[0],
        state: "empty",
        isHighlighted: false,
        isConflict: false,
      };
    }
  }

  return board;
}

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

/**
 * Convertit une position en clé string unique
 */
export function positionToKey(pos: Position): string {
  return `${pos.row}-${pos.col}`;
}

/**
 * Formats une position pour l'affichage (ex: "3B")
 */
export function formatPosition(pos: Position): string {
  return `${pos.row + 1}${String.fromCharCode(65 + pos.col)}`;
}
