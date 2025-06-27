import { ColoredRegion, GameCell, GameState } from "../types/game";

/**
 * Générateur de niveaux avancé avec génération procédurale
 */

interface Position {
  row: number;
  col: number;
}

export interface DifficultySettings {
  targetDifficulty: number; // 0-100
  regionSizeVariance: "low" | "medium" | "high";
  growthStrategy: "compact" | "mixed" | "elongated";
  symmetry: boolean;
  minRegionSize: number;
  maxRegionSize: number;
}

// Couleurs pour les régions
const REGION_COLORS = [
  "#26A69A",
  "#BA68C8",
  "#81C784",
  "#FFB74D",
  "#F06292",
  "#D4E157",
  "#4DD0E1",
  "#F84343",
];

/**
 * Classe principale du générateur procédural
 */
class ProceduralLevelGenerator {
  private gridSize: number;
  private difficulty: DifficultySettings;
  private solution: Position[] | null = null;
  private regions: ColoredRegion[] = [];
  private board: GameCell[][] = [];
  private ownership: number[][] = [];

  constructor(gridSize: number, difficulty: DifficultySettings) {
    this.gridSize = gridSize;
    this.difficulty = difficulty;
    this.ownership = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(-1));
  }

  /**
   * Génère un niveau complet
   */
  generateLevel(): GameState {
    console.log(
      `🎯 Generating procedural level ${this.gridSize}×${this.gridSize}`
    );

    let attempts = 0;
    let validLevel = false;

    while (!validLevel && attempts < 200000) {
      attempts++;

      // 1. Générer une solution N-Queens
      this.solution = this.generateNQueensSolution();
      if (!this.solution) continue;

      // 2. Réinitialiser
      this.regions = [];
      this.ownership = Array(this.gridSize)
        .fill(null)
        .map(() => Array(this.gridSize).fill(-1));

      // 3. Créer les régions procéduralement
      this.createRegions();

      // 4. Vérifier l'unicité
      validLevel = this.verifySolutionUniqueness();

      if (!validLevel && attempts < 10) {
        // Essayer d'ajuster les régions pour forcer l'unicité
        this.adjustRegionsForUniqueness();
        validLevel = this.verifySolutionUniqueness();
      }
    }

    if (!validLevel) {
      console.warn("Could not generate unique solution, using last attempt");
    }

    // 5. Créer le plateau
    this.board = this.initializeBoard();

    console.log(`✅ Level generated after ${attempts} attempts`);

    return {
      board: this.board,
      regions: this.regions,
      gridSize: this.gridSize,
      queensPlaced: 0,
      queensRequired: this.gridSize,
      isCompleted: false,
      moveCount: 0,
      solution: this.solution ?? undefined,
    };
  }

  /**
   * Génère une solution N-Queens
   */
  private generateNQueensSolution(): Position[] | null {
    const solution: Position[] = [];
    const usedCols = new Set<number>();

    const isValidPosition = (row: number, col: number): boolean => {
      if (usedCols.has(col)) return false;

      for (const queen of solution) {
        if (this.areAdjacent({ row, col }, queen)) return false;
      }

      return true;
    };

    const backtrack = (row: number): boolean => {
      if (row >= this.gridSize) return true;

      const cols = Array.from({ length: this.gridSize }, (_, i) => i);
      this.shuffleArray(cols);

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
    };

    return backtrack(0) ? solution : null;
  }

  /**
   * Crée les régions de manière procédurale
   */
  private createRegions(): void {
    // Initialiser une région pour chaque reine
    this.solution!.forEach((queen, index) => {
      this.ownership[queen.row][queen.col] = index;
      this.regions.push({
        id: index,
        color: REGION_COLORS[index % REGION_COLORS.length],
        cells: [queen],
        hasQueen: true,
        queenPosition: queen,
      });
    });

    // Déterminer les tailles cibles pour chaque région
    const targetSizes = this.calculateTargetSizes();

    // Faire croître les régions
    this.growRegions(targetSizes);

    // Assigner les cellules restantes
    this.assignRemainingCells();
  }

  /**
   * Calcule les tailles cibles pour chaque région selon la difficulté
   */
  private calculateTargetSizes(): number[] {
    const totalCells = this.gridSize * this.gridSize;
    const numRegions = this.gridSize;

    // ✅ NOUVEAU: Stratégie de variabilité intentionnelle
    const sizes: number[] = [];
    let remainingCells = totalCells;

    // ✅ Créer quelques petites régions (1-3 cellules)
    const numSmallRegions = Math.floor(numRegions * 0.3); // 30% de petites
    for (let i = 0; i < numSmallRegions; i++) {
      const size = Math.floor(Math.random() * 3) + 1; // 1-3 cellules
      sizes.push(size);
      remainingCells -= size;
    }

    // ✅ Créer quelques grandes régions si il reste de la place
    const numLargeRegions = Math.floor(numRegions * 0.2); // 20% de grandes
    const avgRemaining = Math.floor(
      remainingCells / (numRegions - sizes.length)
    );

    for (let i = 0; i < numLargeRegions && sizes.length < numRegions - 1; i++) {
      const size =
        Math.floor(avgRemaining * 1.5) + Math.floor(Math.random() * 3);
      if (size <= remainingCells - (numRegions - sizes.length - 1)) {
        sizes.push(size);
        remainingCells -= size;
      }
    }

    // ✅ Remplir le reste avec des tailles moyennes
    while (sizes.length < numRegions - 1) {
      const remainingRegions = numRegions - sizes.length;
      const avgSize = Math.floor(remainingCells / remainingRegions);
      const variance = Math.floor(Math.random() * 4) - 2; // ±2
      const size = Math.max(1, avgSize + variance);

      sizes.push(size);
      remainingCells -= size;
    }

    // Dernière région = ce qui reste
    sizes.push(remainingCells);

    this.shuffleArray(sizes);
    return sizes;
  }

  /**
   * Fait croître les régions selon différentes stratégies
   */
  private growRegions(targetSizes: number[]): void {
    const maxIterations = this.gridSize * this.gridSize * 2;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      let grew = false;

      // Essayer de faire croître chaque région
      for (let i = 0; i < this.regions.length; i++) {
        const region = this.regions[i];
        if (region.cells.length >= targetSizes[i]) continue;

        const candidates = this.getGrowthCandidates(region);
        if (candidates.length === 0) continue;

        // Choisir une cellule selon la stratégie
        const newCell = this.selectGrowthCell(
          candidates,
          region,
          this.difficulty.growthStrategy
        );

        if (newCell) {
          this.ownership[newCell.row][newCell.col] = i;
          region.cells.push(newCell);
          grew = true;
        }
      }

      if (!grew) break;
    }
  }

  /**
   * Obtient les cellules candidates pour la croissance d'une région
   */
  private getGrowthCandidates(region: ColoredRegion): Position[] {
    const candidates: Position[] = [];
    const visited = new Set<string>();

    for (const cell of region.cells) {
      // Vérifier les 4 directions orthogonales seulement
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];

      for (const [dr, dc] of directions) {
        const newRow = cell.row + dr;
        const newCol = cell.col + dc;
        const key = `${newRow}-${newCol}`;

        if (
          newRow >= 0 &&
          newRow < this.gridSize &&
          newCol >= 0 &&
          newCol < this.gridSize &&
          this.ownership[newRow][newCol] === -1 &&
          !visited.has(key)
        ) {
          candidates.push({ row: newRow, col: newCol });
          visited.add(key);
        }
      }
    }

    return candidates;
  }

  /**
   * Sélectionne une cellule de croissance selon la stratégie
   */
  private selectGrowthCell(
    candidates: Position[],
    region: ColoredRegion,
    strategy: string
  ): Position | null {
    if (candidates.length === 0) return null;

    const queen = region.queenPosition!;

    switch (strategy) {
      case "compact":
        // Préférer les cellules proches de la reine
        candidates.sort((a, b) => {
          const distA =
            Math.abs(a.row - queen.row) + Math.abs(a.col - queen.col);
          const distB =
            Math.abs(b.row - queen.row) + Math.abs(b.col - queen.col);
          return distA - distB;
        });
        break;

      case "elongated":
        // Préférer les cellules qui allongent la région
        candidates.sort((a, b) => {
          const compactnessA = this.calculateCompactnessIfAdded(region, a);
          const compactnessB = this.calculateCompactnessIfAdded(region, b);
          return compactnessA - compactnessB; // Moins compact = plus allongé
        });
        break;

      case "mixed":
      default:
        // Mélange aléatoire avec biais léger vers la compacité
        candidates.sort(() => Math.random() - 0.3);
        break;
    }

    // Ajouter du hasard pour éviter les patterns trop réguliers
    const topCandidates = candidates.slice(
      0,
      Math.max(1, Math.floor(candidates.length * 0.3))
    );
    return topCandidates[Math.floor(Math.random() * topCandidates.length)];
  }

  /**
   * Calcule la compacité d'une région si on ajoute une cellule
   */
  private calculateCompactnessIfAdded(
    region: ColoredRegion,
    newCell: Position
  ): number {
    const allCells = [...region.cells, newCell];
    const perimeter = this.calculatePerimeter(allCells);
    return perimeter / allCells.length;
  }

  /**
   * Calcule le périmètre d'un ensemble de cellules
   */
  private calculatePerimeter(cells: Position[]): number {
    const cellSet = new Set(cells.map((c) => `${c.row}-${c.col}`));
    let perimeter = 0;

    for (const cell of cells) {
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dr, dc] of directions) {
        const key = `${cell.row + dr}-${cell.col + dc}`;
        if (!cellSet.has(key)) {
          perimeter++;
        }
      }
    }

    return perimeter;
  }

  /**
   * Assigne les cellules restantes
   */
  private assignRemainingCells(): void {
    const unassigned: Position[] = [];

    // Collecter les cellules non assignées
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.ownership[row][col] === -1) {
          unassigned.push({ row, col });
        }
      }
    }

    // Les assigner aux régions adjacentes ou les plus proches
    for (const cell of unassigned) {
      const adjacentRegions = this.getAdjacentRegions(cell);

      if (adjacentRegions.length > 0) {
        // Choisir la région adjacente la plus petite
        adjacentRegions.sort(
          (a, b) => this.regions[a].cells.length - this.regions[b].cells.length
        );
        const chosenRegion = adjacentRegions[0];
        this.ownership[cell.row][cell.col] = chosenRegion;
        this.regions[chosenRegion].cells.push(cell);
      } else {
        // Assigner à la région la plus proche
        let minDist = Infinity;
        let closestRegion = 0;

        for (let i = 0; i < this.regions.length; i++) {
          const queen = this.regions[i].queenPosition!;
          const dist =
            Math.abs(cell.row - queen.row) + Math.abs(cell.col - queen.col);
          if (dist < minDist) {
            minDist = dist;
            closestRegion = i;
          }
        }

        this.ownership[cell.row][cell.col] = closestRegion;
        this.regions[closestRegion].cells.push(cell);
      }
    }
  }

  /**
   * Trouve les régions adjacentes à une cellule
   */
  private getAdjacentRegions(cell: Position): number[] {
    const adjacent = new Set<number>();
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dr, dc] of directions) {
      const row = cell.row + dr;
      const col = cell.col + dc;

      if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
        const regionId = this.ownership[row][col];
        if (regionId !== -1) {
          adjacent.add(regionId);
        }
      }
    }

    return Array.from(adjacent);
  }

  /**
   * Vérifie l'unicité de la solution
   */
  private verifySolutionUniqueness(): boolean {
    const solver = new QueensSolver(this.regions);
    const solutions = solver.findAllSolutions(2); // On cherche juste 2 solutions max
    return solutions.length === 1;
  }

  /**
   * Ajuste les régions pour forcer l'unicité
   */
  private adjustRegionsForUniqueness(): void {
    // Stratégie 1: Réduire les grandes régions qui offrent trop de choix
    const avgSize = this.gridSize;

    for (const region of this.regions) {
      if (region.cells.length > avgSize * 1.5) {
        // Identifier les cellules périphériques
        const peripheralCells = region.cells.filter((cell) => {
          const isPeripheral = this.getAdjacentRegions(cell).length > 0;
          const isNotQueen = !(
            cell.row === region.queenPosition!.row &&
            cell.col === region.queenPosition!.col
          );
          return isPeripheral && isNotQueen;
        });

        // Retirer quelques cellules périphériques
        const toRemove = Math.floor(peripheralCells.length * 0.3);
        for (let i = 0; i < toRemove && region.cells.length > 3; i++) {
          const cell = peripheralCells[i];
          region.cells = region.cells.filter(
            (c) => !(c.row === cell.row && c.col === cell.col)
          );
          this.ownership[cell.row][cell.col] = -1;
        }
      }
    }

    // Réassigner les cellules libérées
    this.assignRemainingCells();
  }

  /**
   * Utilitaires
   */
  private areAdjacent(pos1: Position, pos2: Position): boolean {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private initializeBoard(): GameCell[][] {
    const board: GameCell[][] = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(null));

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const regionId = this.ownership[row][col];
        const region = this.regions[regionId];

        board[row][col] = {
          row,
          col,
          regionId: regionId,
          regionColor: region.color,
          state: "empty",
          isHighlighted: false,
          isConflict: false,
        };
      }
    }

    return board;
  }
}

/**
 * Solveur pour vérifier l'unicité
 */
class QueensSolver {
  private regions: ColoredRegion[];
  private solutions: Position[][] = [];
  private maxSolutions: number;

  constructor(regions: ColoredRegion[]) {
    this.regions = regions;
    this.maxSolutions = 2;
  }

  findAllSolutions(maxSolutions: number = 2): Position[][] {
    this.solutions = [];
    this.maxSolutions = maxSolutions;
    this.solve(0, []);
    return this.solutions;
  }

  private solve(regionIndex: number, currentSolution: Position[]): void {
    if (this.solutions.length >= this.maxSolutions) return;

    if (regionIndex >= this.regions.length) {
      this.solutions.push([...currentSolution]);
      return;
    }

    const region = this.regions[regionIndex];

    for (const cell of region.cells) {
      if (this.isValidPlacement(cell, currentSolution)) {
        currentSolution.push(cell);
        this.solve(regionIndex + 1, currentSolution);
        currentSolution.pop();
      }
    }
  }

  private isValidPlacement(
    pos: Position,
    currentSolution: Position[]
  ): boolean {
    for (const queen of currentSolution) {
      if (queen.row === pos.row || queen.col === pos.col) return false;

      if (
        Math.abs(queen.row - pos.row) <= 1 &&
        Math.abs(queen.col - pos.col) <= 1
      )
        return false;
    }

    return true;
  }
}

/**
 * Fonction principale d'export
 */
export function generateGameLevel(
  gridSize: number = 6,
  difficultySettings?: Partial<DifficultySettings>
): GameState {
  const defaultSettings: DifficultySettings = {
    targetDifficulty: 50,
    regionSizeVariance: "medium",
    growthStrategy: "mixed",
    symmetry: false,
    minRegionSize: Math.max(3, Math.floor(gridSize * 0.5)),
    maxRegionSize: Math.ceil(gridSize * 2),
  };

  const settings = { ...defaultSettings, ...difficultySettings };
  const generator = new ProceduralLevelGenerator(gridSize, settings);

  return generator.generateLevel();
}

/**
 * Génération avec preset de difficulté
 */
export function generateLevelWithDifficulty(
  gridSize: number,
  difficulty: "easy" | "medium" | "hard" | "expert"
): GameState {
  const difficultyMap: Record<string, Partial<DifficultySettings>> = {
    easy: {
      targetDifficulty: 20,
      regionSizeVariance: "low",
      growthStrategy: "compact",
      symmetry: true,
      minRegionSize: Math.max(3, Math.floor(gridSize * 0.7)),
      maxRegionSize: Math.ceil(gridSize * 1.3),
    },
    medium: {
      targetDifficulty: 50,
      regionSizeVariance: "medium",
      growthStrategy: "mixed",
      symmetry: false,
      minRegionSize: Math.max(3, Math.floor(gridSize * 0.5)),
      maxRegionSize: Math.ceil(gridSize * 1.8),
    },
    hard: {
      targetDifficulty: 75,
      regionSizeVariance: "high",
      growthStrategy: "elongated",
      symmetry: false,
      minRegionSize: 3,
      maxRegionSize: Math.ceil(gridSize * 2.5),
    },
    expert: {
      targetDifficulty: 90,
      regionSizeVariance: "high",
      growthStrategy: "mixed",
      symmetry: false,
      minRegionSize: 2,
      maxRegionSize: Math.ceil(gridSize * 3),
    },
  };

  return generateGameLevel(gridSize, difficultyMap[difficulty]);
}

/**
 * Réinitialise le plateau de jeu
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
