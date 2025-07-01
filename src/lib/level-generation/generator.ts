/**
 * Level Generator - React Version
 * Generates playable Queens Game levels adapted for React architecture
 */

import { REGION_COLORS } from "../../constants/game";
import {
  ColoredRegion,
  GameState,
  LevelConfig,
  Position,
} from "../../types/core";

/**
 * Simple N-Queens solver for solution generation
 */
function generateNQueensSolution(gridSize: number): Position[] | null {
  const solution: Position[] = [];
  const usedCols = new Set<number>();

  function isValidPosition(row: number, col: number): boolean {
    if (usedCols.has(col)) return false;

    for (const queen of solution) {
      const rowDiff = Math.abs(queen.row - row);
      const colDiff = Math.abs(queen.col - col);

      // Check adjacency (queens can't touch)
      if (rowDiff <= 1 && colDiff <= 1) return false;
    }

    return true;
  }

  function backtrack(row: number): boolean {
    if (row >= gridSize) return true;

    // Try columns in random order for variety
    const cols = Array.from({ length: gridSize }, (_, i) => i);
    for (let i = cols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cols[i], cols[j]] = [cols[j], cols[i]];
    }

    for (const col of cols) {
      if (isValidPosition(row, col)) {
        solution.push({ row, col });
        usedCols.add(col);

        if (backtrack(row + 1)) return true;

        solution.pop();
        usedCols.delete(col);
      }
    }

    return false;
  }

  return backtrack(0) ? solution : null;
}

/**
 * Creates initial regions from queen positions
 */
function createRegionsFromQueens(queens: Position[]): ColoredRegion[] {
  return queens.map((queen, index) => ({
    id: index,
    color: REGION_COLORS[index % REGION_COLORS.length],
    cells: [{ ...queen }],
    hasQueen: true,
    queenPosition: { ...queen },
  }));
}

/**
 * Calculates Manhattan distance between two positions
 */
function manhattanDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

/**
 * Checks if two positions are orthogonally adjacent
 */
function areOrthogonallyAdjacent(pos1: Position, pos2: Position): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Gets expansion candidates for a region
 */
function getRegionExpansionCandidates(
  region: ColoredRegion,
  gridSize: number,
  occupiedPositions: Set<string>
): Position[] {
  const candidates: Position[] = [];
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  for (const cell of region.cells) {
    for (const dir of directions) {
      const newPos = {
        row: cell.row + dir.row,
        col: cell.col + dir.col,
      };

      if (
        newPos.row >= 0 &&
        newPos.row < gridSize &&
        newPos.col >= 0 &&
        newPos.col < gridSize
      ) {
        const key = `${newPos.row}-${newPos.col}`;
        if (!occupiedPositions.has(key)) {
          // Check if not already in candidates
          if (
            !candidates.some(
              (c) => c.row === newPos.row && c.col === newPos.col
            )
          ) {
            candidates.push(newPos);
          }
        }
      }
    }
  }

  return candidates;
}

/**
 * Generates target sizes for regions based on complexity
 */
function generateTargetSizes(
  totalCells: number,
  numRegions: number,
  complexity: "easy" | "medium" | "hard"
): number[] {
  const ranges = {
    easy: { min: 3, max: 6 },
    medium: { min: 2, max: 8 },
    hard: { min: 1, max: 10 },
  };

  const { min, max } = ranges[complexity];
  const sizes: number[] = [];
  let remainingCells = totalCells;

  for (let i = 0; i < numRegions - 1; i++) {
    const remainingRegions = numRegions - i;
    const avgRemaining = Math.floor(remainingCells / remainingRegions);

    const minSize = Math.max(min, avgRemaining - 2);
    const maxSize = Math.min(max, avgRemaining + 2);
    const maxPossible = remainingCells - (remainingRegions - 1) * min;

    const actualMax = Math.min(maxSize, maxPossible);
    const size =
      Math.floor(Math.random() * (actualMax - minSize + 1)) + minSize;

    sizes.push(size);
    remainingCells -= size;
  }

  sizes.push(Math.max(min, remainingCells));
  return sizes;
}

/**
 * Grows regions to target sizes
 */
function growRegions(
  regions: ColoredRegion[],
  targetSizes: number[],
  gridSize: number
): ColoredRegion[] {
  const workingRegions = regions.map((r) => ({ ...r, cells: [...r.cells] }));
  const occupiedPositions = new Set<string>();

  // Mark initial positions as occupied
  workingRegions.forEach((region) => {
    region.cells.forEach((cell) => {
      occupiedPositions.add(`${cell.row}-${cell.col}`);
    });
  });

  let maxIterations = gridSize * 3;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    let cellsAssigned = 0;

    for (let regionId = 0; regionId < workingRegions.length; regionId++) {
      const region = workingRegions[regionId];
      const targetSize = targetSizes[regionId];

      if (region.cells.length >= targetSize) continue;

      const candidates = getRegionExpansionCandidates(
        region,
        gridSize,
        occupiedPositions
      );

      if (candidates.length > 0) {
        // Choose closest candidate to the queen
        const queenPos = region.queenPosition!;
        candidates.sort(
          (a, b) =>
            manhattanDistance(a, queenPos) - manhattanDistance(b, queenPos)
        );

        const chosen = candidates[0];
        const key = `${chosen.row}-${chosen.col}`;

        region.cells.push(chosen);
        occupiedPositions.add(key);
        cellsAssigned++;
      }
    }

    if (cellsAssigned === 0) break;
  }

  // Assign remaining cells to closest regions
  const totalCells = gridSize * gridSize;
  const assignedCells = occupiedPositions.size;

  if (assignedCells < totalCells) {
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const key = `${row}-${col}`;
        if (!occupiedPositions.has(key)) {
          // Find closest region
          let closestRegion = workingRegions[0];
          let minDistance = Infinity;

          for (const region of workingRegions) {
            const distance = manhattanDistance(
              { row, col },
              region.queenPosition!
            );
            if (distance < minDistance) {
              minDistance = distance;
              closestRegion = region;
            }
          }

          closestRegion.cells.push({ row, col });
        }
      }
    }
  }

  return workingRegions;
}

/**
 * Creates a game board from regions
 */
function createBoardFromRegions(gridSize: number, regions: ColoredRegion[]) {
  const regionMap = new Map<string, ColoredRegion>();

  regions.forEach((region) => {
    region.cells.forEach((cell) => {
      regionMap.set(`${cell.row}-${cell.col}`, region);
    });
  });

  const board = [];
  for (let row = 0; row < gridSize; row++) {
    const boardRow = [];
    for (let col = 0; col < gridSize; col++) {
      const region = regionMap.get(`${row}-${col}`);

      if (!region) {
        throw new Error(`No region found for position ${row}-${col}`);
      }

      boardRow.push({
        row,
        col,
        regionId: region.id,
        regionColor: region.color,
        state: "empty" as const,
        isHighlighted: false,
        isConflict: false,
      });
    }
    board.push(boardRow);
  }

  return board;
}

/**
 * Main level generation function
 */
export function generateLevel(config: LevelConfig): GameState {
  const { gridSize, maxAttempts, complexity } = config;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`🎮 Generating level attempt ${attempt + 1}/${maxAttempts}`);

      // Step 1: Generate N-Queens solution
      const solution = generateNQueensSolution(gridSize);
      if (!solution) {
        console.warn(`⚠️ Failed to generate N-Queens solution`);
        continue;
      }

      // Step 2: Create initial regions
      const regions = createRegionsFromQueens(solution);

      // Step 3: Generate target sizes
      const totalCells = gridSize * gridSize;
      const targetSizes = generateTargetSizes(totalCells, gridSize, complexity);

      // Step 4: Grow regions
      const grownRegions = growRegions(regions, targetSizes, gridSize);

      // Step 5: Create board
      const board = createBoardFromRegions(gridSize, grownRegions);

      // Step 6: Reset queen states (player needs to place them)
      const finalRegions = grownRegions.map((region) => ({
        ...region,
        hasQueen: false,
        queenPosition: region.queenPosition, // Keep for solution
      }));

      const gameState: GameState = {
        board,
        regions: finalRegions,
        gridSize,
        queensPlaced: 0,
        queensRequired: gridSize,
        isCompleted: false,
        moveCount: 0,
        solution,
        isLoading: false,
      };

      console.log(`🎉 Level generated successfully!`);
      console.log(
        `📊 Region sizes: ${grownRegions.map((r) => r.cells.length).join(", ")}`
      );

      return gameState;
    } catch (error) {
      console.error(`❌ Attempt ${attempt + 1} failed:`, error);
    }
  }

  // Fallback: simple level
  console.warn(`⚠️ Using fallback level generation`);
  return generateFallbackLevel(gridSize);
}

/**
 * Generates a simple fallback level if main generation fails
 */
function generateFallbackLevel(gridSize: number): GameState {
  const solution = generateNQueensSolution(gridSize);
  if (!solution) {
    throw new Error("Cannot generate basic N-Queens solution");
  }

  const regions = createRegionsFromQueens(solution);

  // Simple expansion: each region gets 2-3 cells
  const cellsPerRegion = Math.ceil((gridSize * gridSize) / gridSize);

  for (const region of regions) {
    const queen = region.queenPosition!;
    const candidates = [];

    // Add orthogonal neighbors
    const neighbors = [
      { row: queen.row - 1, col: queen.col },
      { row: queen.row + 1, col: queen.col },
      { row: queen.row, col: queen.col - 1 },
      { row: queen.row, col: queen.col + 1 },
    ];

    for (const neighbor of neighbors) {
      if (
        neighbor.row >= 0 &&
        neighbor.row < gridSize &&
        neighbor.col >= 0 &&
        neighbor.col < gridSize &&
        region.cells.length < cellsPerRegion
      ) {
        candidates.push(neighbor);
      }
    }

    // Add candidates to region
    candidates.forEach((candidate) => {
      if (region.cells.length < cellsPerRegion) {
        region.cells.push(candidate);
      }
    });
  }

  // Fill remaining cells
  const usedCells = new Set<string>();
  regions.forEach((region) => {
    region.cells.forEach((cell) => {
      usedCells.add(`${cell.row}-${cell.col}`);
    });
  });

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const key = `${row}-${col}`;
      if (!usedCells.has(key)) {
        // Add to closest region
        let closestRegion = regions[0];
        let minDistance = Infinity;

        for (const region of regions) {
          const distance = manhattanDistance(
            { row, col },
            region.queenPosition!
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestRegion = region;
          }
        }

        closestRegion.cells.push({ row, col });
      }
    }
  }

  const board = createBoardFromRegions(gridSize, regions);

  // Reset queen states
  const finalRegions = regions.map((region) => ({
    ...region,
    hasQueen: false,
  }));

  return {
    board,
    regions: finalRegions,
    gridSize,
    queensPlaced: 0,
    queensRequired: gridSize,
    isCompleted: false,
    moveCount: 0,
    solution,
    isLoading: false,
  };
}

/**
 * Async version for React integration
 */
export async function generateLevelAsync(
  config: LevelConfig
): Promise<GameState> {
  return new Promise((resolve, reject) => {
    try {
      // Use setTimeout to make it non-blocking for React
      setTimeout(() => {
        const result = generateLevel(config);
        resolve(result);
      }, 0);
    } catch (error) {
      reject(error);
    }
  });
}
