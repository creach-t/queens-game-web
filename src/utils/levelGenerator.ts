import { ColoredRegion, GameCell, GameState } from "../types/game";
import { NQueensSolver } from "./nQueenSolver";
import { RegionBuilder } from "./regionBuilder";

const REGION_COLORS = [
  "#26A69A", "#BA68C8", "#81C784", "#FFB74D",
  "#F06292", "#D4E157", "#4DD0E1", "#F84343"
];

export function generateGameLevel(gridSize: number = 6): GameState {
  const solver = new NQueensSolver(gridSize);
  const solution = solver.solve();

  if (!solution) {
    throw new Error(`Cannot generate N-Queens solution for ${gridSize}x${gridSize}`);
  }

  const regionBuilder = new RegionBuilder(gridSize);
  const regions = regionBuilder.buildAroundQueens(solution);
  const board = initializeBoard(gridSize, regions);

  return {
    board,
    regions,
    gridSize,
    queensPlaced: 0,
    queensRequired: gridSize,
    isCompleted: false,
    moveCount: 0,
    solution,
  };
}

export function resetGameBoard(gameState: GameState): GameState {
  const newBoard = gameState.board.map(row =>
    row.map(cell => ({
      ...cell,
      state: "empty" as const,
      isHighlighted: false,
      isConflict: false,
    }))
  );

  const newRegions = gameState.regions.map(region => ({
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

function initializeBoard(gridSize: number, regions: ColoredRegion[]): GameCell[][] {
  const board: GameCell[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(null));

  const regionMap = new Map<string, { id: number; color: string }>();
  regions.forEach(region => {
    region.cells.forEach(cell => {
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