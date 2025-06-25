import { ColoredRegion, GameCell, GameState } from "../types/game";

/**
 * Couleurs pour les régions
 */
const REGION_COLORS = [
  "#26A69A", // bleu
  "#BA68C8", // violet
  "#81C784", // vert doux
  "#FFB74D", // orange clair
  "#F06292", // rose
  "#D4E157", // jaune-vert
  "#4DD0E1", // cyan
  "#F84343", // jaune plus chaud (remplace#f84343)
];

interface Position {
  row: number;
  col: number;
}

/**
 * ÉTAPE 1: Génère une solution N-Queens valide
 */
function generateNQueensSolution(gridSize: number): Position[] | null {
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
    console.log(
      `✅ N-Queens solution: ${solution
        .map((p) => `${p.row + 1}${String.fromCharCode(65 + p.col)}`)
        .join(", ")}`
    );
    return solution;
  }

  return null;
}

/**
 * ÉTAPE 2: Construire des régions autour de CHAQUE reine de la solution
 * C'EST LA PARTIE CRITIQUE QUE J'AVAIS FOIRÉE !
 */
function buildRegionsAroundQueens(
  queens: Position[],
  gridSize: number
): ColoredRegion[] {
  console.log(
    `🏗️ Building regions around ${queens.length} queens (CORRECTLY this time!)`
  );

  // Initialiser les régions avec chaque reine
  const regions: ColoredRegion[] = queens.map((queen, index) => ({
    id: index,
    color: REGION_COLORS[index % REGION_COLORS.length],
    cells: [queen], // Chaque région COMMENCE avec sa reine
    hasQueen: true,
    queenPosition: queen,
  }));

  // Grille d'appartenance (-1 = libre)
  const ownership: number[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(-1));

  // Marquer les reines
  queens.forEach((queen, index) => {
    ownership[queen.row][queen.col] = index;
  });

  // TECHNIQUE SOPHISTIQUÉE: Croissance par vagues avec plusieurs stratégies
  let strategy = 0;
  const strategies = [
    "weighted_distance", // Distance pondérée par variété
    "random_growth", // Croissance aléatoire
    "size_balancing", // Équilibrage des tailles
  ];

  for (let wave = 0; wave < gridSize * 2; wave++) {
    const currentStrategy = strategies[strategy % strategies.length];
    let cellsAssigned = 0;

    console.log(`   Wave ${wave + 1}: using ${currentStrategy} strategy`);

    // Collecter toutes les cellules libres adjacentes aux régions existantes
    const candidates: Array<{
      pos: Position;
      regionId: number;
      priority: number;
    }> = [];

    for (let regionId = 0; regionId < regions.length; regionId++) {
      const region = regions[regionId];
      const regionQueen = queens[regionId];

      // Parcourir le périmètre de la région
      const perimeter = getRegionPerimeter(region.cells, gridSize);

      for (const cell of perimeter) {
        if (ownership[cell.row][cell.col] === -1) {
          let priority = 0;

          switch (currentStrategy) {
            case "weighted_distance":
              // Priorité basée sur distance à la reine + facteur aléatoire
              const distance = Math.sqrt(
                Math.pow(cell.row - regionQueen.row, 2) +
                  Math.pow(cell.col - regionQueen.col, 2)
              );
              priority = 100 - distance + Math.random() * 20;
              break;

            case "random_growth":
              // Croissance plus aléatoire pour formes organiques
              priority = Math.random() * 100;
              break;

            case "size_balancing":
              // Favoriser les petites régions
              const targetSize = Math.floor(
                (gridSize * gridSize) / queens.length
              );
              const sizeDiff = targetSize - region.cells.length;
              priority = Math.max(0, sizeDiff * 10) + Math.random() * 30;
              break;
          }

          candidates.push({
            pos: cell,
            regionId,
            priority,
          });
        }
      }
    }

    if (candidates.length === 0) break;

    // Trier par priorité et assigner
    candidates.sort((a, b) => b.priority - a.priority);

    // Assigner les meilleures cellules (pas toutes d'un coup pour plus de variété)
    const cellsToAssign = Math.min(
      candidates.length,
      Math.max(1, Math.floor(candidates.length / 3))
    );

    for (let i = 0; i < cellsToAssign; i++) {
      const candidate = candidates[i];

      // Double-check que la cellule est encore libre
      if (ownership[candidate.pos.row][candidate.pos.col] === -1) {
        ownership[candidate.pos.row][candidate.pos.col] = candidate.regionId;
        regions[candidate.regionId].cells.push(candidate.pos);
        cellsAssigned++;
      }
    }

    console.log(`      Assigned ${cellsAssigned} cells`);

    if (cellsAssigned === 0) break;

    // Changer de stratégie toutes les 3 vagues
    if ((wave + 1) % 3 === 0) {
      strategy++;
    }
  }

  // Assigner les cellules restantes à la région la plus proche
  let remainingCells = 0;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (ownership[row][col] === -1) {
        let closestRegion = 0;
        let minDistance = Infinity;

        for (let regionId = 0; regionId < queens.length; regionId++) {
          const queen = queens[regionId];
          const distance =
            Math.abs(row - queen.row) + Math.abs(col - queen.col);
          if (distance < minDistance) {
            minDistance = distance;
            closestRegion = regionId;
          }
        }

        ownership[row][col] = closestRegion;
        regions[closestRegion].cells.push({ row, col });
        remainingCells++;
      }
    }
  }

  if (remainingCells > 0) {
    console.log(
      `   Assigned ${remainingCells} remaining cells to closest regions`
    );
  }

  // Validation finale
  const totalCells = regions.reduce(
    (sum, region) => sum + region.cells.length,
    0
  );
  const regionSizes = regions.map((r) => r.cells.length);

  console.log(
    `✅ Regions built: sizes [${regionSizes.join(
      ", "
    )}], total: ${totalCells}/${gridSize * gridSize}`
  );

  return regions;
}

/**
 * Helper: Obtenir le périmètre d'une région (cellules adjacentes libres)
 */
function getRegionPerimeter(
  regionCells: Position[],
  gridSize: number
): Position[] {
  const perimeter: Position[] = [];
  const regionSet = new Set(
    regionCells.map((cell) => `${cell.row}-${cell.col}`)
  );
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const cell of regionCells) {
    for (const [dr, dc] of directions) {
      const newRow = cell.row + dr;
      const newCol = cell.col + dc;

      if (
        newRow >= 0 &&
        newRow < gridSize &&
        newCol >= 0 &&
        newCol < gridSize &&
        !regionSet.has(`${newRow}-${newCol}`)
      ) {
        // Éviter les doublons
        if (!perimeter.some((p) => p.row === newRow && p.col === newCol)) {
          perimeter.push({ row: newRow, col: newCol });
        }
      }
    }
  }

  return perimeter;
}

/**
 * ÉTAPE 3: Beautification optionnelle des formes
 */
function beautifyRegions(
  regions: ColoredRegion[],
  gridSize: number
): ColoredRegion[] {
  console.log(`🎨 Beautifying region shapes...`);

  // Pour l'instant, on garde les régions telles qu'elles sont
  // On pourrait ajouter ici :
  // - Lissage des frontières
  // - Élimination des enclaves
  // - Échanges de cellules pour améliorer les formes

  // Validation que chaque région contient bien sa reine
  for (const region of regions) {
    if (!region.queenPosition) {
      console.error(`❌ Region ${region.id} has no queen!`);
      continue;
    }

    const hasQueen = region.cells.some(
      (cell) =>
        cell.row === region.queenPosition!.row &&
        cell.col === region.queenPosition!.col
    );

    if (!hasQueen) {
      console.error(
        `❌ Region ${region.id} doesn't contain its queen at ${
          region.queenPosition.row + 1
        }${String.fromCharCode(65 + region.queenPosition.col)}!`
      );
    }
  }

  return regions;
}

/**
 * Initialise le plateau de jeu
 */
function initializeBoard(
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
 * GÉNÉRATEUR PRINCIPAL - VERSION RÉELLEMENT CORRECTE
 */
export function generateGameLevel(gridSize: number = 6): GameState {
  console.log(
    `🎯 Generating ACTUALLY CORRECT Queens Game level for ${gridSize}×${gridSize}`
  );

  // ÉTAPE 1: Générer une solution N-Queens valide
  const solution = generateNQueensSolution(gridSize);
  if (!solution) {
    throw new Error(
      `Cannot generate N-Queens solution for ${gridSize}x${gridSize}`
    );
  }

  // ÉTAPE 2: Construire les régions autour des reines de la solution
  let regions = buildRegionsAroundQueens(solution, gridSize);

  // ÉTAPE 3: Beautification optionnelle
  regions = beautifyRegions(regions, gridSize);

  // ÉTAPE 4: Créer le plateau
  const board = initializeBoard(gridSize, regions);

  const gameState: GameState = {
    board,
    regions,
    gridSize,
    queensPlaced: 0,
    queensRequired: gridSize,
    isCompleted: false,
    moveCount: 0,
    solution,
  };

  // Validation finale
  console.log(`📊 CORRECT level generated:`);
  console.log(
    `   - ${regions.length} regions, each containing exactly 1 queen`
  );
  console.log(
    `   - Solution: ${solution
      .map((p) => `${p.row + 1}${String.fromCharCode(65 + p.col)}`)
      .join(", ")}`
  );
  console.log(
    `   - Region sizes: ${regions.map((r) => r.cells.length).join(", ")}`
  );
  console.log(
    `   - GUARANTEED SOLVABLE because regions built around solution!`
  );

  return gameState;
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
