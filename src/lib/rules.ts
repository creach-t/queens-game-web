/**
 * Queens Game Rules Engine - React Version
 * Pure functions for game rule validation and enforcement
 */

import {
  ColoredRegion,
  GameCell,
  Position,
  ValidationResult,
} from "../types/game";

/**
 * Checks if two positions are adjacent (including diagonally)
 * Core rule: Queens cannot touch each other
 */
export function areAdjacent(pos1: Position, pos2: Position): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

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
  const allQueens: {row: number, col: number}[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (updatedBoard[row][col].state === 'queen') {
        allQueens.push({row, col});
      }
    }
  }

  //console.log(`🔍 Vérification des conflits pour ${allQueens.length} reines`);

  // RÈGLE 1: Conflit de ligne - hachurer toute la ligne
  for (let row = 0; row < gridSize; row++) {
    const queensInRow = allQueens.filter(q => q.row === row);
    if (queensInRow.length > 1) {
      //console.log(`⚠️ Conflit ligne ${row + 1}: ${queensInRow.length} reines`);

      // Marquer toute la ligne
      for (let col = 0; col < gridSize; col++) {
        updatedBoard[row][col].isInConflictLine = true;
      }

      // Marquer les reines en conflit
      for (const queen of queensInRow) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 2: Conflit de colonne - hachurer toute la colonne
  for (let col = 0; col < gridSize; col++) {
    const queensInCol = allQueens.filter(q => q.col === col);
    if (queensInCol.length > 1) {
      //console.log(`⚠️ Conflit colonne ${col + 1}: ${queensInCol.length} reines`);

      // Marquer toute la colonne
      for (let row = 0; row < gridSize; row++) {
        updatedBoard[row][col].isInConflictColumn = true;
      }

      // Marquer les reines en conflit
      for (const queen of queensInCol) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 3: Conflit de région - hachurer toute la région
  for (const region of regions) {
    const queensInRegion = allQueens.filter(q =>
      region.cells.some(cell => cell.row === q.row && cell.col === q.col)
    );

    if (queensInRegion.length > 1) {
      //console.log(`⚠️ Conflit région ${region.id + 1}: ${queensInRegion.length} reines`);

      // Marquer toute la région
      for (const cell of region.cells) {
        updatedBoard[cell.row][cell.col].isInConflictRegion = true;
      }

      // Marquer les reines en conflit
      for (const queen of queensInRegion) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 4: Conflit d'adjacence - hachurer autour de la reine existante
  for (let i = 0; i < allQueens.length; i++) {
    for (let j = i + 1; j < allQueens.length; j++) {
      const queen1 = allQueens[i];
      const queen2 = allQueens[j];

      if (areAdjacent(queen1, queen2)) {
        //console.log(`⚠️ Conflit adjacence: ${queen1.row+1}${String.fromCharCode(65+queen1.col)} et ${queen2.row+1}${String.fromCharCode(65+queen2.col)}`);

        // Marquer les deux reines en conflit
        updatedBoard[queen1.row][queen1.col].isConflict = true;
        updatedBoard[queen2.row][queen2.col].isConflict = true;

        // Hachurer autour de chaque reine
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

  // Compter les conflits
  const conflictCount = allQueens.filter(queen =>
    updatedBoard[queen.row][queen.col].isConflict
  ).length;

  if (conflictCount > 0) {
    //console.log(`⚠️ Total: ${conflictCount} reines en conflit`);
  }

  return updatedBoard;
}

/**
 * Checks if two positions are orthogonally adjacent (sharing an edge)
 */
export function areOrthogonallyAdjacent(
  pos1: Position,
  pos2: Position
): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Validates if placing a queen at a position violates any game rules
 * Returns validation result with detailed conflict information
 */
export function validateQueenPlacement(
  board: GameCell[][],
  regions: ColoredRegion[],
  position: Position
): ValidationResult {
  const { row, col } = position;
  const gridSize = board.length;
  const conflicts: string[] = [];
  const conflictPositions: Position[] = [];

  // Check bounds
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
    return {
      isValid: false,
      conflicts: ["Position is outside the game board"],
      conflictPositions: [],
    };
  }

  // Collect existing queens
  const existingQueens: Position[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (board[r][c].state === "queen") {
        existingQueens.push({ row: r, col: c });
      }
    }
  }

  //  Rule 1: One queen per row
  const queensInRow = existingQueens.filter((q) => q.row === row);
  if (queensInRow.length > 0) {
    conflicts.push(`Row ${row + 1} already has a queen`);
    conflictPositions.push(...queensInRow);
  }

  // Rule 2: One queen per column
  const queensInColumn = existingQueens.filter((q) => q.col === col);
  if (queensInColumn.length > 0) {
    conflicts.push(
      `Column ${String.fromCharCode(65 + col)} already has a queen`
    );
    conflictPositions.push(...queensInColumn);
  }

  // Rule 3: One queen per region
  const targetRegion = findRegionContainingPosition(regions, position);
  if (targetRegion) {
    const queensInRegion = existingQueens.filter((queen) =>
      targetRegion.cells.some(
        (cell) => cell.row === queen.row && cell.col === queen.col
      )
    );

    if (queensInRegion.length > 0) {
      conflicts.push(`This region already has a queen`);
      conflictPositions.push(...queensInRegion);
    }
  }

  // Rule 4: Queens cannot touch each other
  const touchingQueens = existingQueens.filter((queen) =>
    areAdjacent(position, queen)
  );
  if (touchingQueens.length > 0) {
    conflicts.push(`Queens cannot touch each other`);
    conflictPositions.push(...touchingQueens);
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
    conflictPositions,
  };
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
      conflicts.push(
        `Column ${String.fromCharCode(
          65 + col
        )} has ${count} queens (should be 1)`
      );
    }
  }

  // Rule 3: Exactly one queen per region
  for (const region of regions) {
    const queensInRegion = queens.filter((queen) =>
      region.cells.some(
        (cell) => cell.row === queen.row && cell.col === queen.col
      )
    );

    if (queensInRegion.length !== 1) {
      conflicts.push(
        `Region ${region.id + 1} has ${
          queensInRegion.length
        } queens (should be 1)`
      );
    }
  }

  // Rule 4: No queens touching each other
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      if (areAdjacent(queens[i], queens[j])) {
        const pos1 = formatPosition(queens[i]);
        const pos2 = formatPosition(queens[j]);
        conflicts.push(`Queens at ${pos1} and ${pos2} are touching`);
      }
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Finds which region contains a specific position
 */
export function findRegionContainingPosition(
  regions: ColoredRegion[],
  position: Position
): ColoredRegion | null {
  return (
    regions.find((region) =>
      region.cells.some(
        (cell) => cell.row === position.row && cell.col === position.col
      )
    ) || null
  );
}

/**
 * Gets all positions that would conflict with placing a queen at the given position
 */
export function getConflictingPositions(
  gridSize: number,
  position: Position,
  regions: ColoredRegion[]
): {
  sameRow: Position[];
  sameColumn: Position[];
  sameRegion: Position[];
  adjacent: Position[];
} {
  const result = {
    sameRow: [] as Position[],
    sameColumn: [] as Position[],
    sameRegion: [] as Position[],
    adjacent: [] as Position[],
  };

  // Same row positions
  for (let col = 0; col < gridSize; col++) {
    if (col !== position.col) {
      result.sameRow.push({ row: position.row, col });
    }
  }

  // Same column positions
  for (let row = 0; row < gridSize; row++) {
    if (row !== position.row) {
      result.sameColumn.push({ row, col: position.col });
    }
  }

  // Same region positions
  const region = findRegionContainingPosition(regions, position);
  if (region) {
    result.sameRegion = region.cells.filter(
      (cell) => !(cell.row === position.row && cell.col === position.col)
    );
  }

  // Adjacent positions
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      if (rowOffset === 0 && colOffset === 0) continue;

      const adjacentPos = {
        row: position.row + rowOffset,
        col: position.col + colOffset,
      };

      if (isPositionInBounds(adjacentPos, gridSize)) {
        result.adjacent.push(adjacentPos);
      }
    }
  }

  return result;
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
 * Formats a position for human-readable display (e.g., "3B")
 */
export function formatPosition(position: Position): string {
  return `${position.row + 1}${String.fromCharCode(65 + position.col)}`;
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
 * Checks if a specific rule is violated by the current state
 */
export function checkRuleViolation(
  board: GameCell[][],
  regions: ColoredRegion[],
  rule: "row" | "column" | "region" | "adjacency"
): Position[] {
  const queens = getPlacedQueens(board);
  const violatingQueens: Position[] = [];

  switch (rule) {
    case "row": {
      const rowGroups = new Map<number, Position[]>();
      queens.forEach((queen) => {
        const existing = rowGroups.get(queen.row) || [];
        rowGroups.set(queen.row, [...existing, queen]);
      });

      rowGroups.forEach((queensInRow) => {
        if (queensInRow.length > 1) {
          violatingQueens.push(...queensInRow);
        }
      });
      break;
    }

    case "column": {
      const colGroups = new Map<number, Position[]>();
      queens.forEach((queen) => {
        const existing = colGroups.get(queen.col) || [];
        colGroups.set(queen.col, [...existing, queen]);
      });

      colGroups.forEach((queensInCol) => {
        if (queensInCol.length > 1) {
          violatingQueens.push(...queensInCol);
        }
      });
      break;
    }

    case "region": {
      regions.forEach((region) => {
        const queensInRegion = queens.filter((queen) =>
          region.cells.some(
            (cell) => cell.row === queen.row && cell.col === queen.col
          )
        );

        if (queensInRegion.length > 1) {
          violatingQueens.push(...queensInRegion);
        }
      });
      break;
    }

    case "adjacency": {
      for (let i = 0; i < queens.length; i++) {
        for (let j = i + 1; j < queens.length; j++) {
          if (areAdjacent(queens[i], queens[j])) {
            violatingQueens.push(queens[i], queens[j]);
          }
        }
      }
      break;
    }
  }

  return violatingQueens;
}

/**
 * Gets a hint for the next best move
 * Returns the first valid position for the current state
 */
export function getHint(
  board: GameCell[][],
  regions: ColoredRegion[],
  solution?: Position[]
): Position | null {
  // If we have the solution, find the next position to place
  if (solution) {
    const placedQueens = getPlacedQueens(board);
    const placedPositions = new Set(
      placedQueens.map((pos) => `${pos.row}-${pos.col}`)
    );

    for (const solutionPos of solution) {
      const key = `${solutionPos.row}-${solutionPos.col}`;
      if (!placedPositions.has(key)) {
        return solutionPos;
      }
    }
  }

  // Otherwise, find the first valid position
  const gridSize = board.length;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col].state === "empty") {
        const validation = validateQueenPlacement(board, regions, { row, col });
        if (validation.isValid) {
          return { row, col };
        }
      }
    }
  }

  return null;
}
