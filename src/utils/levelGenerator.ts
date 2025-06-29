import { ColoredRegion, GameCell, GameState } from "../types/game";
import { levelStorage } from "./levelStorage"; // Import du système Firebase

interface Position {
  row: number;
  col: number;
}

export interface DifficultySettings {
  complexity: "simple" | "normal" | "complex";
}

const REGION_COLORS = [
  "#26A69A",
  "#BA68C8",
  "#81C784",
  "#FFB74D",
  "#F06292",
  "#D4E157",
  "#4DD0E1",
  "#F84343",
  "#FF7043",
];

class ProceduralLevelGenerator {
  private gridSize: number;
  private difficulty: DifficultySettings;
  private solution: Position[] | null = null;
  private regions: ColoredRegion[] = [];
  private board: GameCell[][] = [];
  private ownership: number[][] = [];
  levelStorage: any;

  constructor(gridSize: number, difficulty: DifficultySettings) {
    this.gridSize = gridSize;
    this.difficulty = difficulty;
    this.ownership = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(-1));
  }

  async generateLevel(): Promise<GameState> {
    console.log(
      `🎯 Generating creative level ${this.gridSize}×${this.gridSize}`
    );

    let attempts = 0;
    let validLevel = false;
    const maxAttempts = 3000;
    const batchSize = 50; // Traiter par batches de 50 tentatives
    let nextLogPercent = 10;

    while (!validLevel && attempts < maxAttempts) {
      // Traiter un batch de tentatives
      for (let batchCount = 0; batchCount < batchSize && attempts < maxAttempts && !validLevel; batchCount++) {
        attempts++;

        const currentPercent = Math.floor((attempts / maxAttempts) * 100);
        if (currentPercent >= nextLogPercent) {
          console.log(`${nextLogPercent}%`);
          nextLogPercent += 10;
        }

        this.solution = this.generateNQueensSolution();
        if (!this.solution) continue;

        this.regions = [];
        this.ownership = Array(this.gridSize)
          .fill(null)
          .map(() => Array(this.gridSize).fill(-1));

        this.createCreativeRegions();
        validLevel = this.verifySolutionUniqueness();

        if (!validLevel && attempts < 5) {
          this.adjustRegionsForUniqueness();
          validLevel = this.verifySolutionUniqueness();
        }
      }

      // Céder le contrôle au navigateur entre les batches
      if (!validLevel && attempts < maxAttempts) {
        await this.yieldToMainThread();
      }
    }

    if (!validLevel) {
      console.warn(
        "⚠️ Could not generate unique level after max attempts. Loading from Firebase..."
      );

      const fallback = await this.levelStorage.getRandomLevel(this.gridSize);
      if (fallback) {
        console.log("📦 Niveau chargé depuis Firebase en secours");
        return this.levelStorage.convertToGameState(fallback);
      }

      throw new Error("❌ Impossible de générer ou de charger un niveau.");
    }

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
   * Céder le contrôle au thread principal pour éviter de bloquer l'UI
   */
  private async yieldToMainThread(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }

  /**
   * Version alternative avec requestAnimationFrame (plus smooth)
   */
  private async yieldToMainThreadRAF(): Promise<void> {
    return new Promise(resolve => {
      requestAnimationFrame(() => resolve());
    });
  }

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

  // Version asynchrone de growCreativeRegions si nécessaire
  private async growCreativeRegionsAsync(
    targetSizes: number[],
    shapeStrategies: string[]
  ): Promise<void> {
    const maxIterations = this.gridSize * this.gridSize * 3;
    let iteration = 0;
    let yieldCounter = 0;

    while (iteration < maxIterations) {
      iteration++;
      yieldCounter++;
      let grew = false;

      for (let i = 0; i < this.regions.length; i++) {
        const region = this.regions[i];
        if (region.cells.length >= targetSizes[i]) continue;

        const candidates = this.getGrowthCandidates(region);
        if (candidates.length === 0) continue;

        const newCell = this.selectCreativeGrowthCell(
          candidates,
          region,
          shapeStrategies[i]
        );

        if (newCell) {
          this.ownership[newCell.row][newCell.col] = i;
          region.cells.push(newCell);
          grew = true;
        }
      }

      // Céder le contrôle tous les 100 itérations
      if (yieldCounter >= 100) {
        await this.yieldToMainThread();
        yieldCounter = 0;
      }

      if (!grew) break;
    }
  }

  private createCreativeRegions(): void {
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

    // Calculer les tailles avec plus de variété
    const targetSizes = this.calculateCreativeTargetSizes();

    // Assigner des stratégies de forme différentes à chaque région
    const shapeStrategies = this.assignShapeStrategies();

    // Faire croître avec les nouvelles stratégies
    this.growCreativeRegions(targetSizes, shapeStrategies);
    this.assignRemainingCells();
  }

  private calculateCreativeTargetSizes(): number[] {
    const totalCells = this.gridSize * this.gridSize;
    const numRegions = this.gridSize;
    const sizes: number[] = [];
    let remainingCells = totalCells;

    // Complexité selon les paramètres
    const complexity = this.difficulty.complexity;

    // Très rarement des régions de 1 case (5% max)
    const numSingle = Math.random() < 0.8 ? 0 : Math.floor(numRegions * 0.05);
    for (let i = 0; i < numSingle; i++) {
      sizes.push(1);
      remainingCells -= 1;
    }

    // 30-50% de petites régions (2-3 cellules) selon complexité
    const smallRatio =
      this.gridSize >= 9
        ? 0.55 // 55% au lieu de 50% (léger boost)
        : complexity === "simple"
        ? 0.5
        : complexity === "normal"
        ? 0.4
        : 0.3;
    const numSmall = Math.floor((numRegions - numSingle) * smallRatio);
    for (let i = 0; i < numSmall; i++) {
      const rand = Math.random();
      const size = rand < 0.3 ? 2 : rand < 0.7 ? 3 : 4;
      sizes.push(size);
      remainingCells -= size;
    }

    // Quelques grandes régions pour formes créatives
    const largeRatio =
      this.gridSize >= 9
        ? 0.15 // 15%
        : complexity === "complex"
        ? 0.3
        : 0.2;
    const numLarge = Math.floor((numRegions - sizes.length) * largeRatio);
    for (let i = 0; i < numLarge && sizes.length < numRegions - 1; i++) {
      const maxSize = Math.min(
        this.gridSize >= 9 ? 6 : 8,
        Math.floor(remainingCells * 0.3)
      ); // Limiter à 6 pour 9x9
      const size = Math.max(5, maxSize);
      if (size <= remainingCells - (numRegions - sizes.length - 1)) {
        sizes.push(size);
        remainingCells -= size;
      }
    }

    // Remplir le reste avec tailles moyennes
    while (sizes.length < numRegions - 1) {
      const remainingRegions = numRegions - sizes.length;
      const avgSize = Math.floor(remainingCells / remainingRegions);
      const variance = this.gridSize >= 9 ? 2 : 3;
      const size = Math.max(
        2,
        avgSize + Math.floor(Math.random() * variance * 2) - variance
      );
      sizes.push(size);
      remainingCells -= size;
    }

    sizes.push(Math.max(2, remainingCells));
    this.shuffleArray(sizes);
    return sizes;
  }

  private assignShapeStrategies(): string[] {
    const assignments: string[] = [];
    const complexity = this.difficulty.complexity;

    // Stratégies selon complexité
    const strategies =
      this.gridSize >= 9
        ? ["compact", "mixed", "cross", "elongated"] // Enlever spiral et snake seulement
        : complexity === "simple"
        ? ["compact", "mixed"]
        : complexity === "normal"
        ? ["compact", "mixed", "cross", "elongated"]
        : ["compact", "mixed", "cross", "elongated", "spiral", "snake"];

    for (let i = 0; i < this.regions.length; i++) {
      assignments.push(
        strategies[Math.floor(Math.random() * strategies.length)]
      );
    }

    return assignments;
  }

  private growCreativeRegions(
    targetSizes: number[],
    shapeStrategies: string[]
  ): void {
    const maxIterations = this.gridSize * this.gridSize * 3;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      let grew = false;

      for (let i = 0; i < this.regions.length; i++) {
        const region = this.regions[i];
        if (region.cells.length >= targetSizes[i]) continue;

        const candidates = this.getGrowthCandidates(region);
        if (candidates.length === 0) continue;

        const newCell = this.selectCreativeGrowthCell(
          candidates,
          region,
          shapeStrategies[i]
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

  private selectCreativeGrowthCell(
    candidates: Position[],
    region: ColoredRegion,
    strategy: string
  ): Position | null {
    if (candidates.length === 0) return null;

    const queen = region.queenPosition!;
    const regionCells = region.cells;

    switch (strategy) {
      case "spiral":
        return this.selectSpiralCell(candidates, queen);

      case "cross":
        return this.selectCrossCell(candidates, queen);

      case "snake":
        return this.selectSnakeCell(candidates, regionCells);

      case "elongated":
        return this.selectElongatedCell(candidates, regionCells);

      case "compact":
        candidates.sort((a, b) => {
          const distA =
            Math.abs(a.row - queen.row) + Math.abs(a.col - queen.col);
          const distB =
            Math.abs(b.row - queen.row) + Math.abs(b.col - queen.col);
          return distA - distB;
        });
        break;

      case "mixed":
      default:
        this.shuffleArray(candidates);
        break;
    }

    return candidates[0];
  }

  private selectSpiralCell(candidates: Position[], queen: Position): Position {
    // Privilégier les cellules qui créent un mouvement spiralé autour de la reine
    candidates.sort((a, b) => {
      const angleA = Math.atan2(a.row - queen.row, a.col - queen.col);
      const angleB = Math.atan2(b.row - queen.row, b.col - queen.col);
      const distA = Math.abs(a.row - queen.row) + Math.abs(a.col - queen.col);
      const distB = Math.abs(b.row - queen.row) + Math.abs(b.col - queen.col);

      // Favoriser un équilibre entre angle et distance
      return angleA + distA * 0.1 - (angleB + distB * 0.1);
    });

    return candidates[0];
  }

  private selectCrossCell(candidates: Position[], queen: Position): Position {
    // Privilégier les cellules alignées horizontalement ou verticalement avec la reine
    candidates.sort((a, b) => {
      const alignmentA =
        (a.row === queen.row ? 0 : 1) + (a.col === queen.col ? 0 : 1);
      const alignmentB =
        (b.row === queen.row ? 0 : 1) + (b.col === queen.col ? 0 : 1);

      if (alignmentA !== alignmentB) return alignmentA - alignmentB;

      const distA = Math.abs(a.row - queen.row) + Math.abs(a.col - queen.col);
      const distB = Math.abs(b.row - queen.row) + Math.abs(b.col - queen.col);
      return distA - distB;
    });

    return candidates[0];
  }

  private selectSnakeCell(
    candidates: Position[],
    regionCells: Position[]
  ): Position {
    // Créer des formes serpentines en évitant les formes trop compactes
    if (regionCells.length <= 1) return candidates[0];

    candidates.sort((a, b) => {
      // Privilégier les cellules qui continuent dans la même direction
      const connections = this.countRegionConnections(a, regionCells);
      const connectionsB = this.countRegionConnections(b, regionCells);

      // Préférer 1 connexion (continue la ligne) plutôt que multiple (forme compacte)
      if (connections === 1 && connectionsB !== 1) return -1;
      if (connectionsB === 1 && connections !== 1) return 1;

      return Math.random() - 0.5;
    });

    return candidates[0];
  }

  private selectElongatedCell(
    candidates: Position[],
    regionCells: Position[]
  ): Position {
    candidates.sort((a, b) => {
      const compactnessA = this.calculateCompactnessIfAdded(regionCells, a);
      const compactnessB = this.calculateCompactnessIfAdded(regionCells, b);
      return compactnessA - compactnessB; // Moins compact = plus allongé
    });

    return candidates[0];
  }

  private countRegionConnections(
    cell: Position,
    regionCells: Position[]
  ): number {
    const cellSet = new Set(regionCells.map((c) => `${c.row}-${c.col}`));
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    let connections = 0;
    for (const [dr, dc] of directions) {
      const key = `${cell.row + dr}-${cell.col + dc}`;
      if (cellSet.has(key)) connections++;
    }

    return connections;
  }

  private calculateCompactnessIfAdded(
    regionCells: Position[],
    newCell: Position
  ): number {
    const allCells = [...regionCells, newCell];
    const perimeter = this.calculatePerimeter(allCells);
    return perimeter / allCells.length;
  }

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
        if (!cellSet.has(key)) perimeter++;
      }
    }

    return perimeter;
  }

  private getGrowthCandidates(region: ColoredRegion): Position[] {
    const candidates: Position[] = [];
    const visited = new Set<string>();

    for (const cell of region.cells) {
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

  private assignRemainingCells(): void {
    const unassigned: Position[] = [];

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.ownership[row][col] === -1) {
          unassigned.push({ row, col });
        }
      }
    }

    for (const cell of unassigned) {
      const adjacentRegions = this.getAdjacentRegions(cell);

      if (adjacentRegions.length > 0) {
        adjacentRegions.sort(
          (a, b) => this.regions[a].cells.length - this.regions[b].cells.length
        );
        const chosenRegion = adjacentRegions[0];
        this.ownership[cell.row][cell.col] = chosenRegion;
        this.regions[chosenRegion].cells.push(cell);
      } else {
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

  private verifySolutionUniqueness(): boolean {
    const solver = new QueensSolver(this.regions);
    const solutions = solver.findAllSolutions(2);
    return solutions.length === 1;
  }

  private adjustRegionsForUniqueness(): void {
    for (const region of this.regions) {
      if (region.cells.length > this.gridSize * 1.2) {
        const peripheralCells = region.cells.filter((cell) => {
          const isPeripheral = this.getAdjacentRegions(cell).length > 0;
          const isNotQueen = !(
            cell.row === region.queenPosition!.row &&
            cell.col === region.queenPosition!.col
          );
          return isPeripheral && isNotQueen;
        });
        const toRemove =
          this.gridSize >= 9
            ? Math.floor(peripheralCells.length * 0.3) // De 0.2 à 0.3 (léger boost)
            : Math.floor(peripheralCells.length * 0.2);
        for (let i = 0; i < toRemove && region.cells.length > 2; i++) {
          const cell = peripheralCells[i];
          region.cells = region.cells.filter(
            (c) => !(c.row === cell.row && c.col === cell.col)
          );
          this.ownership[cell.row][cell.col] = -1;
        }
      }
    }

    this.assignRemainingCells();
  }

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

// Interface avec callback de progression
export interface GenerationProgress {
  attempts: number;
  maxAttempts: number;
  percentage: number;
  status: string;
}

export async function generateGameLevel(
  gridSize: number = 6,
  complexity: "simple" | "normal" | "complex" = "normal",
  onProgress?: (progress: GenerationProgress) => void
): Promise<GameState> {
  console.log(`🎯 Génération niveau ${gridSize}x${gridSize}`);

  try {
    // Essayer de générer normalement
    const settings: DifficultySettings = { complexity };
    const generator = new ProceduralLevelGenerator(gridSize, settings);

    // Wrapper pour les callbacks de progression si fournis
    if (onProgress) {
      // Vous pouvez modifier la classe pour supporter les callbacks
      onProgress({
        attempts: 0,
        maxAttempts: 2000,
        percentage: 0,
        status: "Génération en cours..."
      });
    }

    const level = await generator.generateLevel();

    // Sauvegarder en arrière-plan (ignore les erreurs)
    if (levelStorage) {
      levelStorage
        .saveLevel(gridSize, complexity, level.regions)
        .catch(() => {});
    }

    return level;
  } catch (error) {
    console.log("⚠️ Échec génération, tentative fallback Firebase...");

    try {
      // Fallback Firebase
      if (levelStorage) {
        const storedLevel = await levelStorage.getRandomLevel(
          gridSize,
          complexity
        );

        if (storedLevel) {
          console.log("📦 Niveau récupéré depuis Firebase");
          return levelStorage.convertToGameState(storedLevel);
        }

        // Essayer sans contrainte de complexité
        const anyLevel = await levelStorage.getRandomLevel(gridSize);
        if (anyLevel) {
          console.log("📦 Niveau récupéré (complexité différente)");
          return levelStorage.convertToGameState(anyLevel);
        }
      }
    } catch (firebaseError) {
      console.warn("Firebase fallback échoué:", firebaseError);
    }

    // Dernier recours: génération basique SYNCHRONE
    console.log("🔄 Génération de secours...");
    return generateBasicLevel(gridSize);
  }
}

/**
 * Générateur de secours simple (synchrone, sans validation d'unicité)
 */
function generateBasicLevel(gridSize: number): GameState {
  // Version simplifiée qui marche toujours
  const solution = generateSimpleNQueens(gridSize);
  const regions = createBasicRegions(solution, gridSize);
  const board = createBoard(regions, gridSize);

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

/**
 * N-Queens simple qui marche toujours
 */
function generateSimpleNQueens(gridSize: number): Position[] {
  const solution: Position[] = [];

  // Placement simple en diagonal décalé (marche pour la plupart des tailles)
  for (let i = 0; i < gridSize; i++) {
    const col = (i * 2 + 1) % gridSize;
    solution.push({ row: i, col });
  }

  return solution;
}

/**
 * Régions basiques autour des reines
 */
function createBasicRegions(
  solution: Position[],
  gridSize: number
): ColoredRegion[] {
  const regions: ColoredRegion[] = solution.map((queen, index) => ({
    id: index,
    color: REGION_COLORS[index % REGION_COLORS.length],
    cells: [queen],
    hasQueen: true,
    queenPosition: queen,
  }));

  // Ajouter quelques cellules autour de chaque reine
  const ownership = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(-1));

  // Marquer les reines
  solution.forEach((queen, index) => {
    ownership[queen.row][queen.col] = index;
  });

  // Ajouter des cellules adjacentes
  for (let regionIndex = 0; regionIndex < regions.length; regionIndex++) {
    const region = regions[regionIndex];
    const queen = region.queenPosition!;

    // Directions autour de la reine
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];

    for (const [dr, dc] of directions) {
      const newRow = queen.row + dr;
      const newCol = queen.col + dc;

      if (
        newRow >= 0 &&
        newRow < gridSize &&
        newCol >= 0 &&
        newCol < gridSize &&
        ownership[newRow][newCol] === -1
      ) {
        ownership[newRow][newCol] = regionIndex;
        region.cells.push({ row: newRow, col: newCol });
      }
    }
  }

  // Assigner les cellules restantes
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (ownership[row][col] === -1) {
        // Assigner à la région la plus proche
        let minDist = Infinity;
        let closestRegion = 0;

        for (let i = 0; i < regions.length; i++) {
          const queen = regions[i].queenPosition!;
          const dist = Math.abs(row - queen.row) + Math.abs(col - queen.col);
          if (dist < minDist) {
            minDist = dist;
            closestRegion = i;
          }
        }

        ownership[row][col] = closestRegion;
        regions[closestRegion].cells.push({ row, col });
      }
    }
  }

  return regions;
}

/**
 * Créer le board depuis les régions
 */
function createBoard(regions: ColoredRegion[], gridSize: number): GameCell[][] {
  const board: GameCell[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(null));

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const region = regions.find((r) =>
        r.cells.some((cell) => cell.row === row && cell.col === col)
      );

      board[row][col] = {
        row,
        col,
        regionId: region?.id || 0,
        regionColor: region?.color || "#26A69A",
        state: "empty",
        isHighlighted: false,
        isConflict: false,
      };
    }
  }

  return board;
}

export async function generateLevelWithDifficulty(
  gridSize: number,
  difficulty: "easy" | "medium" | "hard" | "expert",
  onProgress?: (progress: GenerationProgress) => void
): Promise<GameState> {
  const complexityMap = {
    easy: "simple" as const,
    medium: "normal" as const,
    hard: "complex" as const,
    expert: "complex" as const,
  };

  return generateGameLevel(gridSize, complexityMap[difficulty], onProgress);
}

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