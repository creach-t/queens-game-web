import { ColoredRegion, GameState } from "../types/game";
import {
  QueensGameSolver,
  testRegionExtension,
  getValidCandidatesForRegion,
  isRegionConnected
} from "./queensSolver";
import {
  REGION_COLORS,
  Position,
  generateNQueensSolution,
  findConnectedComponents,
  initializeBoard,
  manhattanDistance,
  areOrthogonallyAdjacent,
  getOrthogonalNeighbors,
  positionToKey,
  formatPositionList
} from "./gameUtils";
import { levelStorage } from "./levelStorage";

/**
 * STRATÉGIES DE GÉNÉRATION - Facilement modifiables
 */

/**
 * Construit des régions avec variété de tailles (2-8 cellules)
 */
function buildVariedRegions(
  queens: Position[],
  gridSize: number
): ColoredRegion[] {
  console.log(`🎨 Building varied regions for ${queens.length} queens`);

  // Initialiser les régions avec chaque reine
  const regions: ColoredRegion[] = queens.map((queen, index) => ({
    id: index,
    color: REGION_COLORS[index % REGION_COLORS.length],
    cells: [queen],
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

  // Définir des tailles cibles variées pour chaque région
  const targetSizes = generateVariedTargetSizes(gridSize * gridSize, queens.length);
  console.log(`   🎯 Target sizes: [${targetSizes.join(", ")}]`);

  let waveCount = 0;
  let totalAttempts = 0;
  let rejectedForUniqueness = 0;

  // Croissance avec vérification d'unicité ACTIVE
  while (waveCount < gridSize * 3) {
    waveCount++;
    let cellsAssignedThisWave = 0;

    console.log(`   🌊 Wave ${waveCount}: Varied growth with uniqueness checks...`);

    const allCandidates: Array<{
      pos: Position;
      regionId: number;
      priority: number;
    }> = [];

    for (let regionId = 0; regionId < regions.length; regionId++) {
      const region = regions[regionId];
      const targetSize = targetSizes[regionId];

      // Arrêter la croissance si la région a atteint sa taille cible
      if (region.cells.length >= targetSize) continue;

      const validCandidates = getValidCandidatesForRegion(gridSize, regions, regionId, queens);

      for (const candidate of validCandidates) {
        if (ownership[candidate.row][candidate.col] === -1) {
          const queen = queens[regionId];
          const distance = manhattanDistance(candidate, queen);
          const currentSize = region.cells.length;

          // Priorité basée sur la proximité et l'urgence de croissance
          const urgency = Math.max(0, targetSize - currentSize) * 50;
          const proximity = Math.max(0, 10 - distance) * 10;
          const randomness = Math.random() * 20;

          const priority = urgency + proximity + randomness;

          allCandidates.push({
            pos: candidate,
            regionId,
            priority
          });
        }
      }
    }

    if (allCandidates.length === 0) {
      console.log(`   🛑 No more candidates available`);
      break;
    }

    allCandidates.sort((a, b) => b.priority - a.priority);

    // Traiter les candidats avec vérification d'unicité
    const candidatesToProcess = Math.min(
      allCandidates.length,
      Math.max(3, Math.floor(allCandidates.length * 0.3))
    );

    for (let i = 0; i < candidatesToProcess; i++) {
      const candidate = allCandidates[i];
      totalAttempts++;

      if (ownership[candidate.pos.row][candidate.pos.col] !== -1) continue;

      // ✅ VÉRIFICATION D'UNICITÉ À CHAQUE ÉTAPE
      const preservesUniqueness = testRegionExtension(
        gridSize,
        regions,
        candidate.regionId,
        candidate.pos
      );

      if (preservesUniqueness) {
        ownership[candidate.pos.row][candidate.pos.col] = candidate.regionId;
        regions[candidate.regionId].cells.push(candidate.pos);
        cellsAssignedThisWave++;

        console.log(`     ✅ Added ${candidate.pos.row + 1}${String.fromCharCode(65 + candidate.pos.col)} to region ${candidate.regionId} (${regions[candidate.regionId].cells.length}/${targetSizes[candidate.regionId]})`);
      } else {
        rejectedForUniqueness++;
        console.log(`     ❌ Rejected ${candidate.pos.row + 1}${String.fromCharCode(65 + candidate.pos.col)} (would break uniqueness)`);
      }
    }

    console.log(`   📊 Wave ${waveCount}: ${cellsAssignedThisWave} cells added, ${rejectedForUniqueness} rejected`);

    if (cellsAssignedThisWave === 0) {
      console.log(`   🏁 No more valid expansions`);
      break;
    }

    // Afficher les tailles actuelles
    const currentSizes = regions.map(r => r.cells.length);
    console.log(`   📐 Current sizes: [${currentSizes.join(", ")}]`);
  }

  // Assigner les cellules restantes intelligemment
  const remainingCells = assignRemainingCellsVaried(ownership, regions, queens, gridSize, targetSizes);

  // Réparer les problèmes de connectivité si nécessaire
  repairDisconnectedRegions(regions, queens);

  // Statistiques finales
  const finalSizes = regions.map(r => r.cells.length);
  const totalCells = regions.reduce((sum, region) => sum + region.cells.length, 0);

  console.log(`🎨 VARIED regions built:`);
  console.log(`   📊 Total attempts: ${totalAttempts}, Rejected for uniqueness: ${rejectedForUniqueness}`);
  console.log(`   📐 Final sizes: [${finalSizes.join(", ")}], Total: ${totalCells}/${gridSize * gridSize}`);
  console.log(`   🎯 Target vs Actual: ${targetSizes.map((target, i) => `${target}→${finalSizes[i]}`).join(", ")}`);
  console.log(`   ✨ Remaining cells: ${remainingCells}`);

  return regions;
}

/**
 * Génère des tailles cibles variées (2-8 cellules) qui totalisent le bon nombre
 */
function generateVariedTargetSizes(totalCells: number, numRegions: number): number[] {
  const minSize = 2;
  const maxSize = 8;
  const targets: number[] = [];

  // Générer des tailles aléatoires dans la plage
  let remainingCells = totalCells;

  for (let i = 0; i < numRegions - 1; i++) {
    const remainingRegions = numRegions - i;
    const avgRemaining = Math.floor(remainingCells / remainingRegions);

    // Taille entre min et max, mais proche de la moyenne
    const minForThisRegion = Math.max(minSize, avgRemaining - 2);
    const maxForThisRegion = Math.min(maxSize, avgRemaining + 2);

    const size = Math.floor(Math.random() * (maxForThisRegion - minForThisRegion + 1)) + minForThisRegion;
    targets.push(size);
    remainingCells -= size;
  }

  // La dernière région prend ce qui reste
  targets.push(Math.max(minSize, remainingCells));

  // Ajuster si nécessaire pour respecter les contraintes
  for (let i = 0; i < targets.length; i++) {
    if (targets[i] > maxSize) {
      const excess = targets[i] - maxSize;
      targets[i] = maxSize;

      // Redistribuer l'excès
      for (let j = 0; j < targets.length && excess > 0; j++) {
        if (j !== i && targets[j] < maxSize) {
          const canTake = Math.min(excess, maxSize - targets[j]);
          targets[j] += canTake;
        }
      }
    }
  }

  return targets;
}

/**
 * Assigne les cellules restantes en respectant l'unicité
 */
function assignRemainingCellsVaried(
  ownership: number[][],
  regions: ColoredRegion[],
  queens: Position[],
  gridSize: number,
  targetSizes: number[]
): number {
  console.log(`🔧 Assigning remaining cells with uniqueness checks...`);

  const unassigned: Position[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (ownership[row][col] === -1) {
        unassigned.push({ row, col });
      }
    }
  }

  if (unassigned.length === 0) return 0;

  console.log(`   📊 ${unassigned.length} cells to assign with uniqueness checks`);

  let assignedCount = 0;
  let maxIterations = unassigned.length * 3; // Éviter les boucles infinies
  let iteration = 0;

  while (unassigned.length > 0 && iteration < maxIterations) {
    iteration++;
    let cellAssignedThisIteration = false;

    for (let i = unassigned.length - 1; i >= 0; i--) {
      const cell = unassigned[i];
      let bestRegion = -1;
      let bestScore = -Infinity;

      // Tester chaque région pour cette cellule
      for (let regionId = 0; regionId < regions.length; regionId++) {
        const region = regions[regionId];
        const queen = queens[regionId];
        const targetSize = targetSizes[regionId];

        // Vérifier la connectivité orthogonale
        const canConnect = region.cells.some(regionCell =>
          areOrthogonallyAdjacent(cell, regionCell)
        );

        if (canConnect) {
          // 🔧 CRITIQUE: Tester l'unicité avant l'assignation
          const preservesUniqueness = testRegionExtension(
            gridSize,
            regions,
            regionId,
            cell
          );

          if (preservesUniqueness) {
            const distance = manhattanDistance(cell, queen);
            const deficit = Math.max(0, targetSize - region.cells.length);

            // Score favorisant les régions sous leur cible
            const deficitBonus = deficit * 100;
            const proximityBonus = Math.max(0, 8 - distance) * 5;
            const score = deficitBonus + proximityBonus + Math.random() * 10;

            if (score > bestScore) {
              bestScore = score;
              bestRegion = regionId;
            }
          }
        }
      }

      if (bestRegion !== -1) {
        // Assigner la cellule
        ownership[cell.row][cell.col] = bestRegion;
        regions[bestRegion].cells.push(cell);
        unassigned.splice(i, 1); // Retirer de la liste
        assignedCount++;
        cellAssignedThisIteration = true;

       // console.log(`     ✅ Assigned ${cell.row + 1}${String.fromCharCode(65 + cell.col)} to region ${bestRegion} (preserves uniqueness)`);
      }
    }

    // Si aucune cellule n'a pu être assignée cette itération, arrêter
    if (!cellAssignedThisIteration) {
      console.log(`     ⚠️ No more cells can be assigned while preserving uniqueness`);
      break;
    }
  }

  // S'il reste des cellules, les assigner en dernier recours (peut casser l'unicité)
  if (unassigned.length > 0) {
    console.log(`   ⚠️ ${unassigned.length} cells cannot preserve uniqueness, force-assigning...`);

    for (const cell of unassigned) {
      // Trouver la région qui peut connecter cette cellule
      let bestRegion = -1;
      let bestScore = -Infinity;

      for (let regionId = 0; regionId < regions.length; regionId++) {
        const region = regions[regionId];
        const queen = queens[regionId];

        const canConnect = region.cells.some(regionCell =>
          areOrthogonallyAdjacent(cell, regionCell)
        );

        if (canConnect) {
          const distance = manhattanDistance(cell, queen);
          const score = 100 - distance + Math.random() * 10;

          if (score > bestScore) {
            bestScore = score;
            bestRegion = regionId;
          }
        }
      }

      if (bestRegion !== -1) {
        ownership[cell.row][cell.col] = bestRegion;
        regions[bestRegion].cells.push(cell);
        assignedCount++;
      } else {
        // En très dernier recours, assigner à la région la plus proche
        let closestRegion = 0;
        let minDistance = Infinity;

        for (let regionId = 0; regionId < queens.length; regionId++) {
          const distance = manhattanDistance(cell, queens[regionId]);
          if (distance < minDistance) {
            minDistance = distance;
            closestRegion = regionId;
          }
        }

        ownership[cell.row][cell.col] = closestRegion;
        regions[closestRegion].cells.push(cell);
        assignedCount++;
        console.log(`     ❌ Force-assigned ${cell.row + 1}${String.fromCharCode(65 + cell.col)} to closest region ${closestRegion} (may break uniqueness)`);
      }
    }
  }

  console.log(`   ✅ Assigned ${assignedCount} cells (${assignedCount - unassigned.length} with uniqueness preservation)`);
  return assignedCount;
}

/**
 * Répare les régions déconnectées (fonction simplifiée)
 */
function repairDisconnectedRegions(
  regions: ColoredRegion[],
  queens: Position[],
): void {
  console.log(`🔧 Checking and repairing disconnected regions...`);

  let repairsMade = 0;

  for (let regionId = 0; regionId < regions.length; regionId++) {
    const region = regions[regionId];

    if (!isRegionConnected(region.cells)) {
      console.log(`   🔍 Region ${regionId} is disconnected, repairing...`);

      const components = findConnectedComponents(region.cells);
      const queen = queens[regionId];

      // Garder la composante avec la reine
      let mainComponentIndex = -1;
      for (let i = 0; i < components.length; i++) {
        if (components[i].cells.some(cell =>
          cell.row === queen.row && cell.col === queen.col)) {
          mainComponentIndex = i;
          break;
        }
      }

      if (mainComponentIndex !== -1) {
        region.cells = components[mainComponentIndex].cells;

        // Redistribuer les cellules orphelines vers les régions voisines
        for (let i = 0; i < components.length; i++) {
          if (i === mainComponentIndex) continue;

          for (const orphanCell of components[i].cells) {
            // Trouver la région voisine la plus proche
            let bestNeighbor = -1;
            let minDistance = Infinity;

            for (let targetId = 0; targetId < regions.length; targetId++) {
              if (targetId === regionId) continue;

              const targetQueen = queens[targetId];
              const distance = manhattanDistance(orphanCell, targetQueen);
              if (distance < minDistance) {
                minDistance = distance;
                bestNeighbor = targetId;
              }
            }

            if (bestNeighbor !== -1) {
              regions[bestNeighbor].cells.push(orphanCell);
            }
          }
        }

        repairsMade++;
      }
    }
  }

  console.log(`   🔧 Made ${repairsMade} connectivity repairs`);
}

/**
 * Validation rapide pour les tests
 */
function quickValidation(
  regions: ColoredRegion[],
  gridSize: number,
): boolean {
  // Vérifier la connectivité
  for (const region of regions) {
    if (!isRegionConnected(region.cells)) {
      console.warn(`   ⚠️ Region ${region.id} not connected`);
      return false;
    }
  }

  // Vérifier l'unicité de la solution
  const hasUniqueSolution = QueensGameSolver.hasUniqueSolution(gridSize, regions);
  if (!hasUniqueSolution) {
    console.warn(`   ⚠️ Solution not unique`);
    return false;
  }

  return true;
}

/**
 * GÉNÉRATEUR PRINCIPAL avec régions variées
 */
export async function generateGameLevel(gridSize: number = 6): Promise<GameState> {
  console.log(`🎨 Generating VARIED Queens Game level for ${gridSize}×${gridSize}`);

  const maxAttempts = 50; // Moins d'essais pour aller plus vite
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}`);

    try {
      // ÉTAPE 1: Générer une solution N-Queens valide
      const solution = generateNQueensSolution(gridSize);
      if (!solution) {
        console.warn(`   ⚠️ Failed to generate N-Queens solution, retrying...`);
        continue;
      }

      // ÉTAPE 2: Construire les régions variées avec vérification d'unicité
      const regions = buildVariedRegions(solution, gridSize);

      // ÉTAPE 3: Validation
      const isValid = quickValidation(regions, gridSize);
      if (!isValid) {
        console.warn(`   ⚠️ Validation failed, retrying...`);
        continue;
      }

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
        elapsedTime: 0,
        isTimerRunning: false,
      };

      const finalSizes = regions.map(r => r.cells.length);
      console.log(`\n🎉 SUCCESS! Varied level generated on attempt ${attempt}`);
      console.log(`   🎯 Solution: ${formatPositionList(solution)}`);
      console.log(`   📐 Region sizes: [${finalSizes.join(", ")}] (range: ${Math.min(...finalSizes)}-${Math.max(...finalSizes)})`);
      console.log(`   🎨 Varied generation complete`);
const saveResult = await levelStorage.saveLevel(gridSize, "medium", regions);
console.log(`🔄 Sauvegarde result: ${saveResult}`);

return gameState;

    } catch (error) {
      console.error(`   ❌ Attempt ${attempt} failed:`, error);
      continue;
    }
  }

  // Fallback simple
  console.warn(`⚠️ Using simple fallback generation...`);
  return await generateFallbackWithFirebase(gridSize);
}

/**
 * Fallback intelligent : Firebase d'abord, puis génération simple
 */
async function generateFallbackWithFirebase(gridSize: number): Promise<GameState> {
  console.log(`🔧 Attempting Firebase fallback for ${gridSize}×${gridSize}...`);

  try {
    // Essayer de récupérer un niveau depuis Firebase
    const storedLevel = await levelStorage.getRandomLevel(gridSize);

    if (storedLevel) {
      console.log(`📦 Using stored level from Firebase`);
      const gameState = levelStorage.convertToGameState(storedLevel);

      // Ajouter les propriétés manquantes pour un GameState complet
      return {
        ...gameState,
        elapsedTime: 0,
        isTimerRunning: false,
      };
    }
  } catch (error) {
    console.warn(`⚠️ Firebase fallback failed:`, error);
  }

  // Si Firebase échoue ou n'a pas de niveau, utiliser la génération simple
  console.log(`🔧 No Firebase level available, using simple generation...`);
  return generateSimpleFallback(gridSize);
}

/**
 * Générateur de secours simple et fiable
 */
function generateSimpleFallback(gridSize: number): GameState {
  console.log(`🔧 Generating simple fallback level`);

  const solution = generateNQueensSolution(gridSize);
  if (!solution) {
    throw new Error("Cannot generate basic N-Queens solution");
  }

  // Créer des régions simples de 3-4 cellules chacune
  const regions: ColoredRegion[] = solution.map((queen, index) => ({
    id: index,
    color: REGION_COLORS[index % REGION_COLORS.length],
    cells: [queen],
    hasQueen: true,
    queenPosition: queen,
  }));

  // Expansion simple par couches
  const cellsPerRegion = Math.floor((gridSize * gridSize) / gridSize);

  for (let regionId = 0; regionId < regions.length; regionId++) {
    const queen = solution[regionId];
    const region = regions[regionId];

    // Ajouter des voisins orthogonaux
    const neighbors = getOrthogonalNeighbors(queen, gridSize);
    for (const neighbor of neighbors) {
      if (region.cells.length < cellsPerRegion) {
        region.cells.push(neighbor);
      }
    }
  }

  // Compléter avec les cellules restantes
  const usedCells = new Set<string>();
  regions.forEach(region => {
    region.cells.forEach(cell => {
      usedCells.add(positionToKey(cell));
    });
  });

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const key = positionToKey({ row, col });
      if (!usedCells.has(key)) {
        // Assigner à la région la plus proche
        let closestRegion = 0;
        let minDistance = Infinity;

        for (let regionId = 0; regionId < solution.length; regionId++) {
          const distance = manhattanDistance({ row, col }, solution[regionId]);
          if (distance < minDistance) {
            minDistance = distance;
            closestRegion = regionId;
          }
        }

        regions[closestRegion].cells.push({ row, col });
      }
    }
  }

  const board = initializeBoard(gridSize, regions);

  console.log(`✅ Simple fallback generated`);

  return {
    board,
    regions,
    gridSize,
    queensPlaced: 0,
    queensRequired: gridSize,
    isCompleted: false,
    moveCount: 0,
    solution,
    elapsedTime: 0,
    isTimerRunning: false,
  };
}

// Réexporter les fonctions stables
export { resetGameBoard } from "./gameUtils";