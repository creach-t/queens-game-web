import { GameCell, ColoredRegion, Position, SolverResult  } from '../types/game';

/**
 * Solver efficace pour vérifier l'unicité des solutions Queens Game
 */
export class QueensGameSolver {
  private gridSize: number;
  private regions: ColoredRegion[];
  private solutions: Position[][] = [];
  private maxSolutions: number;

  constructor(gridSize: number, regions: ColoredRegion[], maxSolutions: number = 2) {
    this.gridSize = gridSize;
    this.regions = regions;
    this.maxSolutions = maxSolutions;
  }

  /**
   * Vérifie si deux positions sont adjacentes (règle Queens Game)
   */
  private areAdjacent(pos1: Position, pos2: Position): boolean {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  }

  /**
   * Vérifie si une position est valide pour placer une reine
   */
  private isValidPosition(position: Position, currentQueens: Position[]): boolean {
    // Vérifier les conflits avec les reines existantes
    for (const queen of currentQueens) {
      // Même rangée ou colonne
      if (queen.row === position.row || queen.col === position.col) {
        return false;
      }

      // Adjacence (règle spéciale Queens Game)
      if (this.areAdjacent(position, queen)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obtient toutes les positions possibles dans une région
   */
  private getRegionPositions(regionId: number): Position[] {
    const region = this.regions.find(r => r.id === regionId);
    return region ? region.cells : [];
  }

  /**
   * Algorithme de backtracking pour trouver toutes les solutions
   */
  private solve(currentQueens: Position[] = [], regionIndex: number = 0): void {
    // Si on a déjà trouvé le maximum de solutions, arrêter
    if (this.solutions.length >= this.maxSolutions) {
      return;
    }

    // Si on a placé toutes les reines, on a une solution
    if (regionIndex >= this.regions.length) {
      if (currentQueens.length === this.gridSize) {
        this.solutions.push([...currentQueens]);
      }
      return;
    }

    // Essayer toutes les positions dans la région actuelle
    const regionPositions = this.getRegionPositions(regionIndex);

    for (const position of regionPositions) {
      if (this.isValidPosition(position, currentQueens)) {
        // Placer la reine
        currentQueens.push(position);

        // Continuer avec la région suivante
        this.solve(currentQueens, regionIndex + 1);

        // Backtrack
        currentQueens.pop();

        // Optimisation : si on a déjà trouvé assez de solutions, arrêter
        if (this.solutions.length >= this.maxSolutions) {
          return;
        }
      }
    }
  }

  /**
   * Résout le puzzle et retourne le résultat
   */
  public solvePuzzle(): SolverResult {
    this.solutions = [];
    this.solve();

    return {
      solutionCount: this.solutions.length,
      solutions: this.solutions,
      isUnique: this.solutions.length === 1
    };
  }

  /**
   * Vérifie rapidement si le puzzle a une solution unique
   * (s'arrête dès qu'il trouve 2 solutions)
   */
  public hasUniqueSolution(): boolean {
    this.solutions = [];
    this.solve();
    return this.solutions.length === 1;
  }

  /**
   * Méthode statique pour vérifier l'unicité rapidement
   */
  static hasUniqueSolution(gridSize: number, regions: ColoredRegion[]): boolean {
    const solver = new QueensGameSolver(gridSize, regions, 2);
    return solver.hasUniqueSolution();
  }
}

/**
 * Utilitaire pour tester si l'ajout d'une cellule à une région préserve l'unicité
 */
export function testRegionExtension(
  gridSize: number,
  regions: ColoredRegion[],
  regionId: number,
  newCell: Position
): boolean {
  // Créer une copie des régions avec la nouvelle cellule ajoutée
  const testRegions = regions.map(region => {
    if (region.id === regionId) {
      return {
        ...region,
        cells: [...region.cells, newCell]
      };
    }
    return { ...region };
  });

  // Tester l'unicité avec cette nouvelle configuration
  return QueensGameSolver.hasUniqueSolution(gridSize, testRegions);
}

/**
 * Valide qu'une région contient au moins une solution valide
 */
export function validateRegionContainsSolution(
  regions: ColoredRegion[],
  originalSolution: Position[]
): boolean {
  // Vérifier que chaque reine de la solution originale est toujours dans sa région
  for (const queen of originalSolution) {
    const region = regions.find(r =>
      r.cells.some(cell => cell.row === queen.row && cell.col === queen.col)
    );

    if (!region) {
      console.warn(`⚠️ Queen at ${queen.row + 1}${String.fromCharCode(65 + queen.col)} is not in any region!`);
      return false;
    }
  }

  return true;
}

/**
 * Optimisation : pré-filtrer les cellules candidates basées sur les contraintes
 */
export function getValidCandidatesForRegion(
  gridSize: number,
  regions: ColoredRegion[],
  regionId: number,
  originalSolution: Position[]
): Position[] {
  const region = regions.find(r => r.id === regionId);
  if (!region) return [];

  const regionQueen = originalSolution.find(queen =>
    region.cells.some(cell => cell.row === queen.row && cell.col === queen.col)
  );

  if (!regionQueen) return [];

  const candidates: Position[] = [];
  const perimeter = getRegionPerimeter(region.cells, gridSize);

  for (const candidate of perimeter) {
    // Vérifications rapides avant le test coûteux d'unicité

    // 1. La cellule ne doit pas être dans une autre région
    const existingRegion = regions.find(r =>
      r.id !== regionId &&
      r.cells.some(cell => cell.row === candidate.row && cell.col === candidate.col)
    );
    if (existingRegion) continue;

    // 2. La cellule ne doit pas violer les contraintes de base avec la reine de la région
    if (candidate.row === regionQueen.row || candidate.col === regionQueen.col) {
      continue; // Même ligne/colonne que la reine de la région
    }

    // 3. Distance raisonnable de la reine originale (heuristique)
    const distance = Math.abs(candidate.row - regionQueen.row) + Math.abs(candidate.col - regionQueen.col);
    if (distance > gridSize / 2) {
      continue; // Trop loin de la reine originale
    }

    candidates.push(candidate);
  }

  return candidates;
}

/**
 * Vérifie si une région est connectée orthogonalement
 */
export function isRegionConnected(cells: {row: number, col: number}[]): boolean {
  if (cells.length <= 1) return true;

  const cellSet = new Set(cells.map(cell => `${cell.row}-${cell.col}`));
  const visited = new Set<string>();
  const queue = [cells[0]];
  visited.add(`${cells[0].row}-${cells[0].col}`);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Vérifier les 4 directions orthogonales
    const neighbors = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 }
    ];

    for (const neighbor of neighbors) {
      const key = `${neighbor.row}-${neighbor.col}`;
      if (cellSet.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === cells.length;
}

/**
 * ✅ NOUVEAU: Fonction utilitaire pour vérifier la validité globale d'un état de jeu
 */
export function validateGameState(
  board: GameCell[][],
  regions: ColoredRegion[]
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const gridSize = board.length;

  // Vérifier la cohérence des régions
  const expectedCells = gridSize * gridSize;
  const actualCells = regions.reduce((total, region) => total + region.cells.length, 0);

  if (actualCells !== expectedCells) {
    issues.push(`Incohérence des régions: ${actualCells} cellules au lieu de ${expectedCells}`);
  }

  // Vérifier que chaque cellule appartient à exactement une région
  const cellRegionMap = new Map<string, number>();
  for (const region of regions) {
    for (const cell of region.cells) {
      const key = `${cell.row}-${cell.col}`;
      if (cellRegionMap.has(key)) {
        issues.push(`Cellule ${cell.row+1}${String.fromCharCode(65+cell.col)} appartient à plusieurs régions`);
      }
      cellRegionMap.set(key, region.id);
    }
  }

  // Vérifier la connectivité orthogonale de chaque région
  for (const region of regions) {
    if (!isRegionConnected(region.cells)) {
      issues.push(`Région ${region.id+1} (couleur ${region.color}) n'est pas connectée orthogonalement`);
    }
  }

  // Vérifier la cohérence du plateau avec les régions
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cell = board[row][col];
      const key = `${row}-${col}`;
      const expectedRegionId = cellRegionMap.get(key);

      if (expectedRegionId !== cell.regionId) {
        issues.push(`Cellule ${row+1}${String.fromCharCode(65+col)} a un regionId incorrect: ${cell.regionId} au lieu de ${expectedRegionId}`);
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Helper: Obtenir le périmètre d'une région
 */
function getRegionPerimeter(regionCells: Position[], gridSize: number): Position[] {
  const perimeter: Position[] = [];
  const regionSet = new Set(regionCells.map(cell => `${cell.row}-${cell.col}`));
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const cell of regionCells) {
    for (const [dr, dc] of directions) {
      const newRow = cell.row + dr;
      const newCol = cell.col + dc;

      if (
        newRow >= 0 && newRow < gridSize &&
        newCol >= 0 && newCol < gridSize &&
        !regionSet.has(`${newRow}-${newCol}`)
      ) {
        if (!perimeter.some(p => p.row === newRow && p.col === newCol)) {
          perimeter.push({ row: newRow, col: newCol });
        }
      }
    }
  }

  return perimeter;
}