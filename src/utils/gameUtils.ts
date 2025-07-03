import { ColoredRegion, GameCell, GameState } from "../types/game";

/**
 * Couleurs pour les régions
 */
export const REGION_COLORS = [
  "#26A69A",
  "#BA68C8",
  "#81C784",
  "#FFB74D",
  "#F06292",
  "#D4E157",
  "#4DD0E1",
  "#fa6464",
  "#b0a997",
  "#615f87",
  "#995d36",
  "#02f760",
];

export interface Position {
  row: number;
  col: number;
}

/**
 * Représente une composante connectée de cellules
 */
export interface ConnectedComponent {
  cells: Position[];
  connectedToRegion: number | null;
}

/**
 * Génère une solution N-Queens valide (fonction stable)
 */
export function generateNQueensSolution(gridSize: number): Position[] | null {
  const solution: Position[] = [];
  const usedCols = new Set<number>();

  function areAdjacent(pos1: Position, pos2: Position): boolean {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  }

  function isValidPosition(row: number, col: number): boolean {
    if (usedCols.has(col)) return false;

    for (const queen of solution) {
      if (areAdjacent({ row, col }, queen)) return false;
    }

    return true;
  }

  function backtrack(row: number): boolean {
    if (row >= gridSize) return true;

    const cols = Array.from({ length: gridSize }, (_, i) => i);
    // Mélanger pour plus de variété
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

  if (backtrack(0)) {
    // console.log(
    //   `✅ N-Queens solution: ${solution
    //     .map((p) => `${p.row + 1}${String.fromCharCode(65 + p.col)}`)
    //     .join(", ")}`
    // );
    return solution;
  }

  return null;
}

/**
 * Trouve les composantes connectées dans un ensemble de cellules (fonction stable)
 */
export function findConnectedComponents(
  cells: Position[]
): ConnectedComponent[] {
  if (cells.length === 0) return [];

  const visited = new Set<string>();
  const components: ConnectedComponent[] = [];

  for (const cell of cells) {
    const key = `${cell.row}-${cell.col}`;
    if (visited.has(key)) continue;

    // Nouvelle composante
    const component: Position[] = [];
    const queue = [cell];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      // Vérifier les voisins orthogonaux
      const neighbors = [
        { row: current.row - 1, col: current.col },
        { row: current.row + 1, col: current.col },
        { row: current.row, col: current.col - 1 },
        { row: current.row, col: current.col + 1 },
      ];

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.row}-${neighbor.col}`;
        if (
          !visited.has(neighborKey) &&
          cells.some((c) => c.row === neighbor.row && c.col === neighbor.col)
        ) {
          visited.add(neighborKey);
          queue.push(neighbor);
        }
      }
    }

    components.push({
      cells: component,
      connectedToRegion: null,
    });
  }

  return components;
}

/**
 * Initialise le plateau de jeu (fonction stable)
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
 * Réinitialise le plateau de jeu (fonction stable)
 */
export function resetGameBoard(gameState: GameState): GameState {
  const newBoard = gameState.board.map((row) =>
    row.map((cell) => ({
      ...cell,
      state: "empty" as const,
      isHighlighted: false,
      isConflict: false,
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
 * Utilitaires mathématiques
 */
export function manhattanDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

export function euclideanDistance(pos1: Position, pos2: Position): number {
  return Math.sqrt(
    Math.pow(pos1.row - pos2.row, 2) + Math.pow(pos1.col - pos2.col, 2)
  );
}

/**
 * Vérifie si deux positions sont orthogonalement adjacentes
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
 * Obtient les positions voisines orthogonales d'une position
 */
export function getOrthogonalNeighbors(
  pos: Position,
  gridSize: number
): Position[] {
  const neighbors: Position[] = [];
  const directions = [
    { row: -1, col: 0 }, // Haut
    { row: 1, col: 0 }, // Bas
    { row: 0, col: -1 }, // Gauche
    { row: 0, col: 1 }, // Droite
  ];

  for (const dir of directions) {
    const newRow = pos.row + dir.row;
    const newCol = pos.col + dir.col;

    if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
      neighbors.push({ row: newRow, col: newCol });
    }
  }

  return neighbors;
}

/**
 * Convertit une position en clé string unique
 */
export function positionToKey(pos: Position): string {
  return `${pos.row}-${pos.col}`;
}

/**
 * Convertit une clé string en position
 */
export function keyToPosition(key: string): Position {
  const [row, col] = key.split("-").map(Number);
  return { row, col };
}

/**
 * Formats une position pour l'affichage (ex: "3B")
 */
export function formatPosition(pos: Position): string {
  return `${pos.row + 1}${String.fromCharCode(65 + pos.col)}`;
}

/**
 * Formats une liste de positions pour l'affichage
 */
export function formatPositionList(positions: Position[]): string {
  return positions.map(formatPosition).join(", ");
}
