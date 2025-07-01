/**
 * Game Validator - React Version
 * Handles conflict detection and visual highlighting for React components
 */

import { GameCell, ColoredRegion, Position } from '../../types/core';
import { areAdjacent, getPlacedQueens, checkRuleViolation } from './rules';

/**
 * Different types of conflicts that can be highlighted in the UI
 */
export interface ConflictAnalysis {
  hasConflicts: boolean;
  conflictingQueens: Position[];
  rowConflicts: Set<number>;
  columnConflicts: Set<number>;
  regionConflicts: Set<number>;
  adjacencyConflicts: Set<string>; // position keys
  conflictCount: number;
}

/**
 * Enhanced game cell with detailed conflict information for React rendering
 */
export interface EnhancedGameCell extends GameCell {
  isInConflictLine: boolean;
  isInConflictColumn: boolean;
  isInConflictRegion: boolean;
  isAroundConflictQueen: boolean;
}

/**
 * Updates the board with conflict highlighting for React components
 */
export function updateBoardWithConflicts(
  board: GameCell[][],
  regions: ColoredRegion[]
): EnhancedGameCell[][] {
  const gridSize = board.length;

  // Create enhanced board with default conflict states
  const enhancedBoard: EnhancedGameCell[][] = board.map(row =>
    row.map(cell => ({
      ...cell,
      isConflict: false,
      isInConflictLine: false,
      isInConflictColumn: false,
      isInConflictRegion: false,
      isAroundConflictQueen: false,
    }))
  );

  // Get conflict analysis
  const analysis = analyzeConflicts(board, regions);

  // Apply visual highlights
  applyConflictHighlights(enhancedBoard, analysis, regions);

  return enhancedBoard;
}

/**
 * Analyzes all conflicts in the current game state
 */
export function analyzeConflicts(
  board: GameCell[][],
  regions: ColoredRegion[]
): ConflictAnalysis {
  const queens = getPlacedQueens(board);

  const analysis: ConflictAnalysis = {
    hasConflicts: false,
    conflictingQueens: [],
    rowConflicts: new Set(),
    columnConflicts: new Set(),
    regionConflicts: new Set(),
    adjacencyConflicts: new Set(),
    conflictCount: 0,
  };

  // Check row conflicts
  const rowViolations = checkRuleViolation(board, regions, 'row');
  if (rowViolations.length > 0) {
    analysis.conflictingQueens.push(...rowViolations);
    rowViolations.forEach(queen => analysis.rowConflicts.add(queen.row));
  }

  // Check column conflicts
  const columnViolations = checkRuleViolation(board, regions, 'column');
  if (columnViolations.length > 0) {
    analysis.conflictingQueens.push(...columnViolations);
    columnViolations.forEach(queen => analysis.columnConflicts.add(queen.col));
  }

  // Check region conflicts
  const regionViolations = checkRuleViolation(board, regions, 'region');
  if (regionViolations.length > 0) {
    analysis.conflictingQueens.push(...regionViolations);

    // Find which regions have conflicts
    regionViolations.forEach(queen => {
      const region = regions.find(r =>
        r.cells.some(cell => cell.row === queen.row && cell.col === queen.col)
      );
      if (region) {
        analysis.regionConflicts.add(region.id);
      }
    });
  }

  // Check adjacency conflicts
  const adjacencyViolations = checkRuleViolation(board, regions, 'adjacency');
  if (adjacencyViolations.length > 0) {
    analysis.conflictingQueens.push(...adjacencyViolations);
    adjacencyViolations.forEach(queen => {
      analysis.adjacencyConflicts.add(`${queen.row}-${queen.col}`);
    });
  }

  // Remove duplicates from conflicting queens
  const uniqueConflictingQueens = analysis.conflictingQueens.filter(
    (queen, index, array) =>
      array.findIndex(q => q.row === queen.row && q.col === queen.col) === index
  );

  analysis.conflictingQueens = uniqueConflictingQueens;
  analysis.hasConflicts = uniqueConflictingQueens.length > 0;
  analysis.conflictCount = uniqueConflictingQueens.length;

  return analysis;
}

/**
 * Applies conflict highlights to the enhanced board
 */
function applyConflictHighlights(
  board: EnhancedGameCell[][],
  analysis: ConflictAnalysis,
  regions: ColoredRegion[]
): void {
  const gridSize = board.length;

  // Highlight row conflicts
  analysis.rowConflicts.forEach(row => {
    for (let col = 0; col < gridSize; col++) {
      board[row][col].isInConflictLine = true;
    }
  });

  // Highlight column conflicts
  analysis.columnConflicts.forEach(col => {
    for (let row = 0; row < gridSize; row++) {
      board[row][col].isInConflictColumn = true;
    }
  });

  // Highlight region conflicts
  analysis.regionConflicts.forEach(regionId => {
    const region = regions.find(r => r.id === regionId);
    if (region) {
      region.cells.forEach(cell => {
        board[cell.row][cell.col].isInConflictRegion = true;
      });
    }
  });

  // Highlight adjacency conflicts (around conflicting queens)
  analysis.adjacencyConflicts.forEach(queenKey => {
    const [row, col] = queenKey.split('-').map(Number);

    // Highlight the area around the conflicting queen
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
          board[newRow][newCol].isAroundConflictQueen = true;
        }
      }
    }
  });

  // Mark all conflicting queens
  analysis.conflictingQueens.forEach(queen => {
    board[queen.row][queen.col].isConflict = true;
  });
}

/**
 * Gets detailed conflict information for debugging or detailed UI feedback
 */
export function getDetailedConflictInfo(
  board: GameCell[][],
  regions: ColoredRegion[]
): {
  queens: Array<{
    position: string;
    conflicts: string[];
    isConflicted: boolean;
  }>;
  summary: {
    total: number;
    byType: Record<string, number>;
  };
} {
  const queens = getPlacedQueens(board);
  const analysis = analyzeConflicts(board, regions);

  const queensInfo = queens.map(queen => {
    const position = `${queen.row + 1}${String.fromCharCode(65 + queen.col)}`;
    const conflicts: string[] = [];

    // Check if this queen is in any conflict
    const isConflicted = analysis.conflictingQueens.some(
      cq => cq.row === queen.row && cq.col === queen.col
    );

    if (analysis.rowConflicts.has(queen.row)) {
      conflicts.push('row');
    }
    if (analysis.columnConflicts.has(queen.col)) {
      conflicts.push('column');
    }
    if (analysis.adjacencyConflicts.has(`${queen.row}-${queen.col}`)) {
      conflicts.push('adjacency');
    }

    // Check region conflict
    const region = regions.find(r =>
      r.cells.some(cell => cell.row === queen.row && cell.col === queen.col)
    );
    if (region && analysis.regionConflicts.has(region.id)) {
      conflicts.push('region');
    }

    return {
      position,
      conflicts,
      isConflicted,
    };
  });

  const summary = {
    total: analysis.conflictCount,
    byType: {
      row: analysis.rowConflicts.size,
      column: analysis.columnConflicts.size,
      region: analysis.regionConflicts.size,
      adjacency: analysis.adjacencyConflicts.size,
    },
  };

  return { queens: queensInfo, summary };
}

/**
 * Validates if a position is safe to place a queen (for preview/hints)
 */
export function isPositionSafe(
  board: GameCell[][],
  regions: ColoredRegion[],
  position: Position
): boolean {
  const { row, col } = position;
  const gridSize = board.length;

  // Check bounds
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
    return false;
  }

  // Check if cell is already occupied
  if (board[row][col].state !== 'empty') {
    return false;
  }

  const queens = getPlacedQueens(board);

  // Check row conflict
  if (queens.some(queen => queen.row === row)) {
    return false;
  }

  // Check column conflict
  if (queens.some(queen => queen.col === col)) {
    return false;
  }

  // Check adjacency conflict
  if (queens.some(queen => areAdjacent(position, queen))) {
    return false;
  }

  // Check region conflict
  const region = regions.find(r =>
    r.cells.some(cell => cell.row === position.row && cell.col === position.col)
  );

  if (region) {
    const hasQueenInRegion = queens.some(queen =>
      region.cells.some(cell => cell.row === queen.row && cell.col === queen.col)
    );

    if (hasQueenInRegion) {
      return false;
    }
  }

  return true;
}

/**
 * Gets all safe positions where a queen can be placed
 */
export function getSafePositions(
  board: GameCell[][],
  regions: ColoredRegion[]
): Position[] {
  const safePositions: Position[] = [];
  const gridSize = board.length;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const position = { row, col };
      if (isPositionSafe(board, regions, position)) {
        safePositions.push(position);
      }
    }
  }

  return safePositions;
}

/**
 * Calculates game completion percentage
 */
export function getCompletionPercentage(
  board: GameCell[][],
  targetQueenCount: number
): number {
  const placedQueens = getPlacedQueens(board);
  return Math.min((placedQueens.length / targetQueenCount) * 100, 100);
}

/**
 * Checks if the game is in a valid state (no conflicts)
 */
export function isGameStateValid(
  board: GameCell[][],
  regions: ColoredRegion[]
): boolean {
  const analysis = analyzeConflicts(board, regions);
  return !analysis.hasConflicts;
}

/**
 * React-specific helper to determine if a cell should be highlighted
 */
export function shouldHighlightCell(
  cell: EnhancedGameCell,
  highlightMode: 'none' | 'conflicts' | 'hints' | 'all' = 'conflicts'
): boolean {
  switch (highlightMode) {
    case 'none':
      return false;
    case 'conflicts':
      return cell.isConflict || cell.isInConflictLine || cell.isInConflictColumn ||
             cell.isInConflictRegion || cell.isAroundConflictQueen;
    case 'hints':
      return cell.isHighlighted;
    case 'all':
      return cell.isHighlighted || cell.isConflict || cell.isInConflictLine ||
             cell.isInConflictColumn || cell.isInConflictRegion || cell.isAroundConflictQueen;
    default:
      return false;
  }
}

/**
 * Gets CSS classes for conflict visualization in React components
 */
export function getConflictCssClasses(cell: EnhancedGameCell): string[] {
  const classes: string[] = [];

  if (cell.isConflict) classes.push('conflict-queen');
  if (cell.isInConflictLine) classes.push('conflict-line');
  if (cell.isInConflictColumn) classes.push('conflict-column');
  if (cell.isInConflictRegion) classes.push('conflict-region');
  if (cell.isAroundConflictQueen) classes.push('conflict-adjacent');
  if (cell.isHighlighted) classes.push('highlighted');

  return classes;
}