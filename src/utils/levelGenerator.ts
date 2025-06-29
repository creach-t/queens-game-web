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
    const maxAttempts = 100000;
    const batchSize = 50; // Traiter par batches de 50 tentatives
    let nextLogPercent = 10;

    while (!validLevel && attempts < maxAttempts) {
      // Traiter un batch de tentatives
      for (
        let batchCount = 0;
        batchCount < batchSize && attempts < maxAttempts && !validLevel;
        batchCount++
      ) {
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
    return new Promise((resolve) => {
      setTimeout(resolve, 0);
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

  // Nouvelles stratégies plus créatives
  const strategies = [
    "compact",     // Rond autour de la reine
    "cross",       // Forme en croix
    "elongated",   // Forme allongée
    "L_shape",     // Forme en L
    "spiral",      // Forme spirale
    "diamond",     // Forme diamant
    "snake",       // Forme serpentine
    "cluster",     // Plusieurs petits clusters
    "corner",      // Forme dans un coin
    "bridge"       // Forme pont entre zones
  ];

  // Distribution plus créative selon la complexité
  const distributions = {
    simple: ["compact", "cross", "elongated"],
    normal: ["compact", "cross", "elongated", "L_shape", "diamond"],
    complex: strategies // Toutes les stratégies
  };

  const availableStrategies = distributions[complexity];

  // Assurer une bonne variété dans chaque niveau
  for (let i = 0; i < this.regions.length; i++) {
    // Forcer au moins une de chaque type principal pour la variété
    if (i < 3) {
      assignments.push(["compact", "cross", "elongated"][i]);
    } else {
      assignments.push(
        availableStrategies[Math.floor(Math.random() * availableStrategies.length)]
      );
    }
  }

  this.shuffleArray(assignments);
  return assignments;
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
    case "cross":
      return this.selectCrossCell(candidates, queen);

    case "elongated":
      return this.selectElongatedCell(candidates, regionCells);

    case "L_shape":
      return this.selectLShapeCell(candidates, queen, regionCells);

    case "spiral":
      return this.selectSpiralCell(candidates, queen, regionCells);

    case "diamond":
      return this.selectDiamondCell(candidates, queen);

    case "snake":
      return this.selectSnakeCell(candidates, regionCells);

    case "cluster":
      return this.selectClusterCell(candidates, regionCells);

    case "corner":
      return this.selectCornerCell(candidates, queen);

    case "bridge":
      return this.selectBridgeCell(candidates, regionCells);

    case "compact":
      candidates.sort((a, b) => {
        const distA = Math.abs(a.row - queen.row) + Math.abs(a.col - queen.col);
        const distB = Math.abs(b.row - queen.row) + Math.abs(b.col - queen.col);
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

// Nouvelles fonctions pour les formes créatives

private selectLShapeCell(candidates: Position[], queen: Position, regionCells: Position[]): Position {
  // Privilégier les formes en L depuis la reine
  candidates.sort((a, b) => {
    const aScore = this.calculateLShapeScore(a, queen, regionCells);
    const bScore = this.calculateLShapeScore(b, queen, regionCells);
    return bScore - aScore;
  });

  return candidates[0];
}

private calculateLShapeScore(pos: Position, queen: Position, regionCells: Position[]): number {
  // Favoriser les positions qui créent des angles droits
  let score = 0;

  // Bonus si on forme un angle droit avec la reine et une autre cellule
  for (const cell of regionCells) {
    if (cell.row === queen.row && cell.col === queen.col) continue;

    // Vérifier si pos forme un angle droit entre queen et cell
    const vec1 = { x: cell.row - queen.row, y: cell.col - queen.col };
    const vec2 = { x: pos.row - queen.row, y: pos.col - queen.col };

    // Produit scalaire proche de 0 = angle droit
    const dotProduct = vec1.x * vec2.x + vec1.y * vec2.y;
    if (Math.abs(dotProduct) < 0.1) {
      score += 10;
    }
  }

  return score;
}

private selectSpiralCell(candidates: Position[], queen: Position, regionCells: Position[]): Position {
  // Créer une spirale autour de la reine
  candidates.sort((a, b) => {
    const aAngle = Math.atan2(a.row - queen.row, a.col - queen.col);
    const bAngle = Math.atan2(b.row - queen.row, b.col - queen.col);

    // Calculer l'angle moyen des cellules existantes
    let avgAngle = 0;
    let validCells = 0;
    for (const cell of regionCells) {
      if (cell.row === queen.row && cell.col === queen.col) continue;
      avgAngle += Math.atan2(cell.row - queen.row, cell.col - queen.col);
      validCells++;
    }

    if (validCells > 0) {
      avgAngle /= validCells;
      // Privilégier la cellule qui continue la spirale
      const aDeviation = Math.abs(aAngle - avgAngle - Math.PI/4);
      const bDeviation = Math.abs(bAngle - avgAngle - Math.PI/4);
      return aDeviation - bDeviation;
    }

    return 0;
  });

  return candidates[0];
}

private selectDiamondCell(candidates: Position[], queen: Position): Position {
  // Créer une forme de diamant (losange)
  candidates.sort((a, b) => {
    // Distance Manhattan pour forme diamant
    const aManhattan = Math.abs(a.row - queen.row) + Math.abs(a.col - queen.col);
    const bManhattan = Math.abs(b.row - queen.row) + Math.abs(b.col - queen.col);

    // Privilégier distance égale mais éviter les diagonales
    const aDiagonal = Math.abs(Math.abs(a.row - queen.row) - Math.abs(a.col - queen.col));
    const bDiagonal = Math.abs(Math.abs(b.row - queen.row) - Math.abs(b.col - queen.col));

    if (aManhattan !== bManhattan) {
      return aManhattan - bManhattan;
    }

    return aDiagonal - bDiagonal;
  });

  return candidates[0];
}

private selectSnakeCell(candidates: Position[], regionCells: Position[]): Position {
  // Créer une forme serpentine - éviter les branches
  candidates.sort((a, b) => {
    const aNeighbors = this.countRegionNeighbors(a, regionCells);
    const bNeighbors = this.countRegionNeighbors(b, regionCells);

    // Privilégier les cellules qui ont exactement 1 voisin (continuent la chaîne)
    const aScore = aNeighbors === 1 ? 10 : (aNeighbors === 2 ? 5 : 0);
    const bScore = bNeighbors === 1 ? 10 : (bNeighbors === 2 ? 5 : 0);

    return bScore - aScore;
  });

  return candidates[0];
}

private selectClusterCell(candidates: Position[], regionCells: Position[]): Position {
  // Créer des petits clusters denses
  candidates.sort((a, b) => {
    const aNeighbors = this.countRegionNeighbors(a, regionCells);
    const bNeighbors = this.countRegionNeighbors(b, regionCells);

    // Privilégier les cellules avec le plus de voisins (densité)
    return bNeighbors - aNeighbors;
  });

  return candidates[0];
}

private selectCornerCell(candidates: Position[], queen: Position): Position {
  // Créer des formes dans les coins de la grille
  candidates.sort((a, b) => {
    // Distance aux coins de la grille
    const corners = [
      {row: 0, col: 0},
      {row: 0, col: this.gridSize - 1},
      {row: this.gridSize - 1, col: 0},
      {row: this.gridSize - 1, col: this.gridSize - 1}
    ];

    const aMinCornerDist = Math.min(...corners.map(corner =>
      Math.abs(a.row - corner.row) + Math.abs(a.col - corner.col)
    ));
    const bMinCornerDist = Math.min(...corners.map(corner =>
      Math.abs(b.row - corner.row) + Math.abs(b.col - corner.col)
    ));

    return aMinCornerDist - bMinCornerDist;
  });

  return candidates[0];
}

private selectBridgeCell(candidates: Position[], regionCells: Position[]): Position {
  // Créer des formes "pont" qui connectent des zones
  candidates.sort((a, b) => {
    const aConnectivity = this.calculateConnectivity(a, regionCells);
    const bConnectivity = this.calculateConnectivity(b, regionCells);

    return bConnectivity - aConnectivity;
  });

  return candidates[0];
}

private countRegionNeighbors(pos: Position, regionCells: Position[]): number {
  let count = 0;
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [dr, dc] of directions) {
    const neighborPos = { row: pos.row + dr, col: pos.col + dc };
    if (regionCells.some(cell => cell.row === neighborPos.row && cell.col === neighborPos.col)) {
      count++;
    }
  }

  return count;
}

private calculateConnectivity(pos: Position, regionCells: Position[]): number {
  // Mesure combien cette position "connecte" des parties séparées
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const neighborGroups: Position[][] = [];

  for (const [dr, dc] of directions) {
    const neighborPos = { row: pos.row + dr, col: pos.col + dc };
    const existingCell = regionCells.find(cell =>
      cell.row === neighborPos.row && cell.col === neighborPos.col
    );

    if (existingCell) {
      // Vérifier si ce voisin appartient à un groupe déjà identifié
      let addedToExisting = false;
      for (const group of neighborGroups) {
        if (this.isConnectedToGroup(existingCell, group, regionCells)) {
          group.push(existingCell);
          addedToExisting = true;
          break;
        }
      }

      if (!addedToExisting) {
        neighborGroups.push([existingCell]);
      }
    }
  }

  // Plus il y a de groupes séparés, plus cette position est "connectrice"
  return neighborGroups.length;
}

private isConnectedToGroup(cell: Position, group: Position[], allCells: Position[]): boolean {
  // Vérification simplifiée de connectivité
  return group.some(groupCell => {
    const distance = Math.abs(cell.row - groupCell.row) + Math.abs(cell.col - groupCell.col);
    return distance <= 2; // Connexion via maximum 2 cases
  });
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
      case "cross":
        return this.selectCrossCell(candidates, queen);

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
  const solver = new OptimizedQueensSolver(this.regions);
  return solver.hasUniqueSolution();
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
class OptimizedQueensSolver {
  private regions: ColoredRegion[];
  private domains: Position[][]; // Domaines valides pour chaque région
  private solutionCount: number = 0;

  constructor(regions: ColoredRegion[]) {
    this.regions = regions;
    this.domains = regions.map(region => [...region.cells]);
  }

  hasUniqueSolution(): boolean {
    this.solutionCount = 0;
    const assignment: Position[] = new Array(this.regions.length);
    const domains = this.domains.map(domain => [...domain]); // Copie des domaines

    this.backtrackWithForwardChecking(assignment, domains, 0);
    return this.solutionCount === 1;
  }

  private backtrackWithForwardChecking(
    assignment: Position[],
    domains: Position[][],
    level: number
  ): boolean {
    // Arrêt précoce si on a déjà trouvé plus d'une solution
    if (this.solutionCount > 1) return false;

    if (level === this.regions.length) {
      this.solutionCount++;
      return this.solutionCount <= 1; // Continue seulement si <= 1 solution
    }

    // MCV Heuristic : choisir la variable avec le plus petit domaine
    const nextVar = this.selectMostConstrainedVariable(domains, assignment, level);
    if (nextVar === -1) return true; // Aucune variable disponible

    // Échanger avec la position actuelle pour maintenir l'ordre
    if (nextVar !== level) {
      [domains[level], domains[nextVar]] = [domains[nextVar], domains[level]];
      [assignment[level], assignment[nextVar]] = [assignment[nextVar], assignment[level]];
    }

    const currentDomain = [...domains[level]]; // Copie du domaine

    for (const position of currentDomain) {
      if (this.solutionCount > 1) break;

      assignment[level] = position;

      // Forward Checking : propager les contraintes
      const newDomains = this.forwardCheck(domains, assignment, level);
      if (newDomains !== null) {
        this.backtrackWithForwardChecking(assignment, newDomains, level + 1);
      }
    }

    // Remettre en place si on avait échangé
    if (nextVar !== level) {
      [domains[level], domains[nextVar]] = [domains[nextVar], domains[level]];
      [assignment[level], assignment[nextVar]] = [assignment[nextVar], assignment[level]];
    }

    return true;
  }

  /**
   * MCV (Most Constrained Variable) : technique éprouvée de CSP
   */
  private selectMostConstrainedVariable(
    domains: Position[][],
    assignment: Position[],
    startFrom: number
  ): number {
    let minDomainSize = Infinity;
    let bestVar = -1;

    for (let i = startFrom; i < domains.length; i++) {
      if (assignment[i] !== undefined) continue; // Déjà assignée

      const domainSize = domains[i].length;
      if (domainSize === 0) return -1; // Domaine vide = échec

      if (domainSize < minDomainSize) {
        minDomainSize = domainSize;
        bestVar = i;
      }

      // Si domaine de taille 1, on peut s'arrêter (optimal)
      if (domainSize === 1) break;
    }

    return bestVar;
  }

  /**
   * Forward Checking : technique éprouvée pour éliminer les valeurs inconsistantes
   */
  private forwardCheck(
    domains: Position[][],
    assignment: Position[],
    lastAssigned: number
  ): Position[][] | null {
    const newDomains = domains.map(domain => [...domain]);
    const assignedPosition = assignment[lastAssigned];

    // Propager les contraintes sur toutes les variables non assignées
    for (let i = lastAssigned + 1; i < newDomains.length; i++) {
      if (assignment[i] !== undefined) continue;

      newDomains[i] = newDomains[i].filter(pos =>
        this.isConsistent(pos, assignedPosition)
      );

      // Si un domaine devient vide, c'est un échec
      if (newDomains[i].length === 0) {
        return null;
      }
    }

    return newDomains;
  }

  /**
   * Vérification de consistance entre deux positions
   */
  private isConsistent(pos1: Position, pos2: Position): boolean {
    // Même ligne ou colonne
    if (pos1.row === pos2.row || pos1.col === pos2.col) return false;

    // Adjacence (contrainte spécifique Queens Game)
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    if (rowDiff <= 1 && colDiff <= 1) return false;

    return true;
  }
}
class QueensSolver {
  private regions: ColoredRegion[];
  private solutions: Position[][] = [];
  private maxSolutions: number;
  private bestFirstOrder: number[]; // Ordre optimisé des régions

  constructor(regions: ColoredRegion[]) {
    this.regions = regions;
    this.maxSolutions = 2;
    // Trier les régions par nombre de positions valides (contraintes d'abord)
    this.bestFirstOrder = this.calculateBestOrder();
  }

  private calculateBestOrder(): number[] {
    const regionConstraints = this.regions.map((region, index) => ({
      index,
      validPositions: region.cells.length, // Simplification pour le test
    }));

    // Trier par nombre croissant de positions (plus contraint d'abord)
    regionConstraints.sort((a, b) => a.validPositions - b.validPositions);

    return regionConstraints.map((r) => r.index);
  }

  findAllSolutions(maxSolutions: number = 2): Position[][] {
    this.solutions = [];
    this.maxSolutions = maxSolutions;
    this.solve(0, []);
    return this.solutions;
  }

  private solve(orderIndex: number, currentSolution: Position[]): void {
    if (this.solutions.length >= this.maxSolutions) return;

    if (orderIndex >= this.regions.length) {
      this.solutions.push([...currentSolution]);
      return;
    }

    const regionIndex = this.bestFirstOrder[orderIndex];
    const region = this.regions[regionIndex];

    for (const cell of region.cells) {
      if (this.isValidPlacement(cell, currentSolution)) {
        currentSolution.push(cell);
        this.solve(orderIndex + 1, currentSolution);
        currentSolution.pop();

        // Early termination si on a déjà trouvé assez de solutions
        if (this.solutions.length >= this.maxSolutions) return;
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
        status: "Génération en cours...",
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
