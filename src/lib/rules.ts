/**
 * Queens Game Rules Engine
 * Pure functions for game rule validation and enforcement
 * Optimisé avec des Map-based lookups pour O(Q + N) au lieu de O(Q×N)
 */

import {
  ColoredRegion,
  GameCell,
  Position,
  ValidationResult,
} from "../types/game";

/**
 * Checks if two positions are adjacent (including diagonally)
 */
export function areAdjacent(pos1: Position, pos2: Position): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Gets all queens currently placed on the board
 */
export function getPlacedQueens(board: GameCell[][]): Position[] {
  const queens: Position[] = [];
  const gridSize = board.length;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col].state === "queen") {
        queens.push({ row, col });
      }
    }
  }

  return queens;
}

/**
 * Met à jour les conflits sur le plateau
 * Optimisé : pré-indexe les reines par ligne/colonne/région via Map
 */
export function updateConflicts(
  board: GameCell[][],
  regions: ColoredRegion[]
): GameCell[][] {
  const gridSize = board.length;
  const updatedBoard = board.map(row => row.map(cell => ({
    ...cell,
    isConflict: false,
    isInConflictLine: false,
    isInConflictColumn: false,
    isInConflictRegion: false,
    isAroundConflictQueen: false
  })));

  // Collecter toutes les reines
  const allQueens: Position[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (updatedBoard[row][col].state === 'queen') {
        allQueens.push({ row, col });
      }
    }
  }

  if (allQueens.length === 0) return updatedBoard;

  // Pré-indexer les reines par ligne et colonne (O(Q))
  const queensByRow = new Map<number, Position[]>();
  const queensByCol = new Map<number, Position[]>();
  for (const queen of allQueens) {
    if (!queensByRow.has(queen.row)) queensByRow.set(queen.row, []);
    queensByRow.get(queen.row)!.push(queen);
    if (!queensByCol.has(queen.col)) queensByCol.set(queen.col, []);
    queensByCol.get(queen.col)!.push(queen);
  }

  // Pré-indexer cellule → regionId (O(R×C))
  const cellToRegionId = new Map<string, number>();
  for (const region of regions) {
    for (const cell of region.cells) {
      cellToRegionId.set(`${cell.row}-${cell.col}`, region.id);
    }
  }

  // Grouper les reines par région (O(Q))
  const queensByRegion = new Map<number, Position[]>();
  for (const queen of allQueens) {
    const regionId = cellToRegionId.get(`${queen.row}-${queen.col}`);
    if (regionId !== undefined) {
      if (!queensByRegion.has(regionId)) queensByRegion.set(regionId, []);
      queensByRegion.get(regionId)!.push(queen);
    }
  }

  // RÈGLE 1: Conflit de ligne
  for (const [row, queensInRow] of queensByRow) {
    if (queensInRow.length > 1) {
      for (let col = 0; col < gridSize; col++) {
        updatedBoard[row][col].isInConflictLine = true;
      }
      for (const queen of queensInRow) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 2: Conflit de colonne
  for (const [col, queensInCol] of queensByCol) {
    if (queensInCol.length > 1) {
      for (let row = 0; row < gridSize; row++) {
        updatedBoard[row][col].isInConflictColumn = true;
      }
      for (const queen of queensInCol) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 3: Conflit de région
  for (const region of regions) {
    const queensInRegion = queensByRegion.get(region.id);
    if (queensInRegion && queensInRegion.length > 1) {
      for (const cell of region.cells) {
        updatedBoard[cell.row][cell.col].isInConflictRegion = true;
      }
      for (const queen of queensInRegion) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 4: Conflit d'adjacence
  for (let i = 0; i < allQueens.length; i++) {
    for (let j = i + 1; j < allQueens.length; j++) {
      const queen1 = allQueens[i];
      const queen2 = allQueens[j];

      if (areAdjacent(queen1, queen2)) {
        updatedBoard[queen1.row][queen1.col].isConflict = true;
        updatedBoard[queen2.row][queen2.col].isConflict = true;

        for (const queen of [queen1, queen2]) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = queen.row + dr;
              const newCol = queen.col + dc;
              if (newRow >= 0 && newRow < gridSize &&
                  newCol >= 0 && newCol < gridSize) {
                updatedBoard[newRow][newCol].isAroundConflictQueen = true;
              }
            }
          }
        }
      }
    }
  }

  return updatedBoard;
}

/**
 * Validates a complete game state against all rules
 */
export function validateCompleteGameState(
  queens: Position[],
  regions: ColoredRegion[],
  gridSize: number
): ValidationResult {
  const conflicts: string[] = [];

  // Rule 1: Exactly one queen per row
  const rowCounts = new Map<number, number>();
  queens.forEach((queen) => {
    rowCounts.set(queen.row, (rowCounts.get(queen.row) || 0) + 1);
  });

  for (let row = 0; row < gridSize; row++) {
    const count = rowCounts.get(row) || 0;
    if (count !== 1) {
      conflicts.push(`Row ${row + 1} has ${count} queens (should be 1)`);
    }
  }

  // Rule 2: Exactly one queen per column
  const colCounts = new Map<number, number>();
  queens.forEach((queen) => {
    colCounts.set(queen.col, (colCounts.get(queen.col) || 0) + 1);
  });

  for (let col = 0; col < gridSize; col++) {
    const count = colCounts.get(col) || 0;
    if (count !== 1) {
      conflicts.push(`Column ${col + 1} has ${count} queens (should be 1)`);
    }
  }

  // Rule 3: Exactly one queen per region (Map-based lookup)
  const cellToRegionId = new Map<string, number>();
  for (const region of regions) {
    for (const cell of region.cells) {
      cellToRegionId.set(`${cell.row}-${cell.col}`, region.id);
    }
  }

  const queensPerRegion = new Map<number, number>();
  for (const queen of queens) {
    const regionId = cellToRegionId.get(`${queen.row}-${queen.col}`);
    if (regionId !== undefined) {
      queensPerRegion.set(regionId, (queensPerRegion.get(regionId) || 0) + 1);
    }
  }

  for (const region of regions) {
    const count = queensPerRegion.get(region.id) || 0;
    if (count !== 1) {
      conflicts.push(`Region ${region.id + 1} has ${count} queens (should be 1)`);
    }
  }

  // Rule 4: No queens touching each other
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      if (areAdjacent(queens[i], queens[j])) {
        conflicts.push(`Queens at ${queens[i].row + 1},${queens[i].col + 1} and ${queens[j].row + 1},${queens[j].col + 1} are touching`);
      }
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Checks if a position is within grid bounds
 */
export function isPositionInBounds(
  position: Position,
  gridSize: number
): boolean {
  return (
    position.row >= 0 &&
    position.row < gridSize &&
    position.col >= 0 &&
    position.col < gridSize
  );
}

/**
 * Gets a hint for the next best move based on the solution
 */
export function getHint(
  board: GameCell[][],
  solution?: Position[]
): Position | null {
  if (solution) {
    const placedPositions = new Set(
      getPlacedQueens(board).map((pos) => `${pos.row}-${pos.col}`)
    );

    for (const solutionPos of solution) {
      const key = `${solutionPos.row}-${solutionPos.col}`;
      if (!placedPositions.has(key)) {
        return solutionPos;
      }
    }
  }

  return null;
}
