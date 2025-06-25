import { GameCell, ColoredRegion, GameState } from '../types/game';

/**
 * Couleurs pour les régions (reprises du projet original)
 */
const REGION_COLORS = [
  '#64B5F6', // Light Blue
  '#BA68C8', // Light Purple
  '#81C784', // Light Green
  '#FFB74D', // Light Orange
  '#F06292', // Light Pink
  '#D4E157', // Light Lime
  '#4DD0E1', // Light Cyan
  '#FFF176', // Light Yellow
  '#A1887F', // Light Brown
  '#7986CB', // Light Indigo
];

interface Position {
  row: number;
  col: number;
}

/**
 * Vérifie si deux positions sont adjacentes (y compris diagonales) - RÈGLE QUEENS GAME
 */
function areAdjacent(pos1: Position, pos2: Position): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Vérifie si deux positions sont adjacentes orthogonalement (pas diagonale)
 */
function areOrthogonallyAdjacent(pos1: Position, pos2: Position): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * ✅ CORRECTIF: Génère des régions garanties résolubles - stratégie améliorée
 */
function generateGuaranteedSolvableRegions(gridSize: number): ColoredRegion[] {
  console.log(`🎯 Generating guaranteed solvable regions for ${gridSize}×${gridSize} grid`);

  const regions: ColoredRegion[] = [];

  // Stratégie pour différentes tailles de grille
  if (gridSize <= 4) {
    // Petites grilles: une région par rangée (simple et toujours résolvable)
    return generateSimpleRowRegions(gridSize);
  } else if (gridSize <= 6) {
    // Grilles moyennes: mix de lignes et formes en L/T
    return generateMixedRegions(gridSize);
  } else {
    // Grandes grilles: combinaison de stratégies avec fallback
    return generateComplexRegions(gridSize);
  }
}

/**
 * ✅ Génère des régions simples (une région = une rangée)
 */
function generateSimpleRowRegions(gridSize: number): ColoredRegion[] {
  console.log(`🎯 Generating simple row regions for ${gridSize}×${gridSize} grid`);

  const regions: ColoredRegion[] = [];

  for (let row = 0; row < gridSize; row++) {
    const region: ColoredRegion = {
      id: row,
      color: REGION_COLORS[row % REGION_COLORS.length],
      cells: [],
      hasQueen: false,
    };

    for (let col = 0; col < gridSize; col++) {
      region.cells.push({ row, col });
    }

    regions.push(region);
  }

  console.log(`✅ Generated ${regions.length} simple row regions`);
  return regions;
}

/**
 * ✅ Génère des régions mixtes pour grilles moyennes
 */
function generateMixedRegions(gridSize: number): ColoredRegion[] {
  console.log(`🎲 Generating mixed regions for ${gridSize}×${gridSize} grid`);

  const regions: ColoredRegion[] = [];
  const usedCells = new Set<string>();
  let regionId = 0;

  // Ajouter 2-3 lignes complètes
  const numCompleteLines = Math.min(3, Math.floor(gridSize / 2));
  
  for (let i = 0; i < numCompleteLines && regionId < gridSize; i++) {
    // Alterner entre lignes horizontales et verticales
    const isHorizontal = (i % 2 === 0);
    
    if (isHorizontal) {
      // Chercher une ligne horizontale libre
      for (let row = 0; row < gridSize; row++) {
        const cells: Position[] = [];
        let available = true;
        
        for (let col = 0; col < gridSize; col++) {
          const key = `${row}-${col}`;
          if (usedCells.has(key)) {
            available = false;
            break;
          }
          cells.push({ row, col });
        }
        
        if (available) {
          const region: ColoredRegion = {
            id: regionId++,
            color: REGION_COLORS[regionId % REGION_COLORS.length],
            cells,
            hasQueen: false,
          };
          regions.push(region);
          cells.forEach(cell => usedCells.add(`${cell.row}-${cell.col}`));
          break;
        }
      }
    } else {
      // Chercher une ligne verticale libre
      for (let col = 0; col < gridSize; col++) {
        const cells: Position[] = [];
        let available = true;
        
        for (let row = 0; row < gridSize; row++) {
          const key = `${row}-${col}`;
          if (usedCells.has(key)) {
            available = false;
            break;
          }
          cells.push({ row, col });
        }
        
        if (available) {
          const region: ColoredRegion = {
            id: regionId++,
            color: REGION_COLORS[regionId % REGION_COLORS.length],
            cells,
            hasQueen: false,
          };
          regions.push(region);
          cells.forEach(cell => usedCells.add(`${cell.row}-${cell.col}`));
          break;
        }
      }
    }
  }

  // Remplir le reste avec des cellules individuelles ou petits groupes
  const remainingCells: Position[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const key = `${row}-${col}`;
      if (!usedCells.has(key)) {
        remainingCells.push({ row, col });
      }
    }
  }

  // Créer des régions avec les cellules restantes
  let cellIndex = 0;
  while (cellIndex < remainingCells.length && regionId < gridSize) {
    const regionCells: Position[] = [];
    const targetSize = Math.min(gridSize, remainingCells.length - cellIndex);
    
    for (let i = 0; i < targetSize && cellIndex < remainingCells.length; i++) {
      regionCells.push(remainingCells[cellIndex++]);
    }

    if (regionCells.length > 0) {
      const region: ColoredRegion = {
        id: regionId++,
        color: REGION_COLORS[regionId % REGION_COLORS.length],
        cells: regionCells,
        hasQueen: false,
      };
      regions.push(region);
    }
  }

  console.log(`✅ Generated ${regions.length} mixed regions`);
  return regions;
}

/**
 * ✅ Génère des régions complexes avec fallback
 */
function generateComplexRegions(gridSize: number): ColoredRegion[] {
  console.log(`🎲 Generating complex regions for ${gridSize}×${gridSize} grid`);
  
  // Pour les grandes grilles, commencer par les régions mixtes
  let regions = generateMixedRegions(gridSize);
  
  // Si pas assez de régions, compléter avec des rangées
  if (regions.length < gridSize) {
    console.log(`⚠️ Not enough regions (${regions.length}/${gridSize}), filling with rows`);
    regions = generateSimpleRowRegions(gridSize);
  }
  
  return regions;
}

/**
 * ✅ CORRECTIF: Résolveur amélioré avec timeout et validation
 */
function solvePuzzle(regions: ColoredRegion[], gridSize: number): Position[] | null {
  console.log(`🧠 Solving puzzle with Queens Game rules...`);

  const solution: Position[] = [];
  const usedRows = new Set<number>();
  const usedCols = new Set<number>();
  
  // ✅ Timeout pour éviter les boucles infinies
  const startTime = Date.now();
  const maxSolveTime = 5000; // 5 secondes max

  function isValidPlacement(pos: Position): boolean {
    // Timeout check
    if (Date.now() - startTime > maxSolveTime) {
      return false;
    }

    // Règle 1: Une seule reine par rangée
    if (usedRows.has(pos.row)) {
      return false;
    }

    // Règle 2: Une seule reine par colonne
    if (usedCols.has(pos.col)) {
      return false;
    }

    // Règle 3: Les reines ne peuvent pas se toucher (y compris diagonales)
    for (const placedPos of solution) {
      if (areAdjacent(pos, placedPos)) {
        return false;
      }
    }

    return true;
  }

  function backtrack(regionIndex: number): boolean {
    // Timeout check
    if (Date.now() - startTime > maxSolveTime) {
      console.log(`⏰ Solving timeout after ${maxSolveTime}ms`);
      return false;
    }

    if (regionIndex >= regions.length) {
      return true; // Solution trouvée
    }

    const region = regions[regionIndex];

    // ✅ Essayer les cellules dans un ordre optimal
    const sortedCells = [...region.cells].sort((a, b) => {
      // Préférer les cellules centrales d'abord
      const centerRow = Math.floor(gridSize / 2);
      const centerCol = Math.floor(gridSize / 2);
      
      const distA = Math.abs(a.row - centerRow) + Math.abs(a.col - centerCol);
      const distB = Math.abs(b.row - centerRow) + Math.abs(b.col - centerCol);
      
      return distA - distB;
    });

    // Essayer chaque cellule de cette région
    for (const cell of sortedCells) {
      if (isValidPlacement(cell)) {
        // Placer la reine
        solution.push(cell);
        usedRows.add(cell.row);
        usedCols.add(cell.col);

        // Continuer avec la région suivante
        if (backtrack(regionIndex + 1)) {
          return true;
        }

        // Backtrack
        solution.pop();
        usedRows.delete(cell.row);
        usedCols.delete(cell.col);
      }
    }

    return false;
  }

  const solved = backtrack(0);

  if (solved && solution.length === regions.length) {
    console.log(`✅ Puzzle solved! Solution found with ${solution.length} queens`);
    console.log('Solution positions:', solution.map(p => `${p.row+1}${String.fromCharCode(65+p.col)}`).join(', '));
    return solution;
  } else {
    console.log(`❌ No solution found for this configuration`);
    return null;
  }
}

/**
 * ✅ CORRECTIF: Validation complète d'une solution
 */
function validateSolution(solution: Position[], regions: ColoredRegion[], gridSize: number): boolean {
  // Vérifier qu'on a le bon nombre de reines
  if (solution.length !== gridSize || solution.length !== regions.length) {
    console.log(`❌ Wrong number of queens: ${solution.length}/${gridSize}`);
    return false;
  }

  // Vérifier une reine par rangée
  const rows = new Set(solution.map(p => p.row));
  if (rows.size !== gridSize) {
    console.log(`❌ Missing rows: ${rows.size}/${gridSize}`);
    return false;
  }

  // Vérifier une reine par colonne
  const cols = new Set(solution.map(p => p.col));
  if (cols.size !== gridSize) {
    console.log(`❌ Missing columns: ${cols.size}/${gridSize}`);
    return false;
  }

  // Vérifier une reine par région
  const regionIds = new Set();
  for (const pos of solution) {
    for (const region of regions) {
      if (region.cells.some(cell => cell.row === pos.row && cell.col === pos.col)) {
        if (regionIds.has(region.id)) {
          console.log(`❌ Multiple queens in region ${region.id}`);
          return false;
        }
        regionIds.add(region.id);
        break;
      }
    }
  }

  // Vérifier qu'aucune reine ne se touche
  for (let i = 0; i < solution.length; i++) {
    for (let j = i + 1; j < solution.length; j++) {
      if (areAdjacent(solution[i], solution[j])) {
        console.log(`❌ Queens touching: ${solution[i].row+1}${String.fromCharCode(65+solution[i].col)} and ${solution[j].row+1}${String.fromCharCode(65+solution[j].col)}`);
        return false;
      }
    }
  }

  console.log(`✅ Solution validation passed`);
  return true;
}

/**
 * Initialise un plateau vide avec les régions colorées
 */
function initializeBoard(gridSize: number, regions: ColoredRegion[]): GameCell[][] {
  const board: GameCell[][] = [];

  // Créer un mapping rapide région -> couleur
  const regionMap = new Map<string, { id: number; color: string }>();
  regions.forEach((region) => {
    region.cells.forEach((cell) => {
      regionMap.set(`${cell.row}-${cell.col}`, {
        id: region.id,
        color: region.color,
      });
    });
  });

  // Initialiser le plateau
  for (let row = 0; row < gridSize; row++) {
    board[row] = [];
    for (let col = 0; col < gridSize; col++) {
      const regionInfo = regionMap.get(`${row}-${col}`);

      board[row][col] = {
        row,
        col,
        regionId: regionInfo?.id ?? 0,
        regionColor: regionInfo?.color ?? REGION_COLORS[0],
        state: 'empty',
        isHighlighted: false,
        isConflict: false,
      };
    }
  }

  return board;
}

/**
 * ✅ CORRECTIF: Génère un plateau de jeu avec GARANTIE de résolution
 */
export function generateGameLevel(gridSize: number = 6): GameState {
  console.log(`🎯 Generating GUARANTEED solvable Queens Game level for ${gridSize}×${gridSize} grid`);

  let regions: ColoredRegion[];
  let solution: Position[] | null = null;
  let attempts = 0;
  const maxAttempts = 10; // Réduit car on utilise des stratégies plus intelligentes

  // ✅ Stratégie progressive pour garantir une solution
  while (attempts < maxAttempts && !solution) {
    attempts++;
    console.log(`🔄 Attempt ${attempts}/${maxAttempts}`);

    if (attempts <= 3) {
      // Essayer des régions guaranties résolvables
      regions = generateGuaranteedSolvableRegions(gridSize);
    } else if (attempts <= 6) {
      // Essayer des régions mixtes
      regions = generateMixedRegions(gridSize);
    } else {
      // Fallback vers des régions simples (toujours résolvable)
      console.log(`🔧 Using failsafe simple row regions`);
      regions = generateSimpleRowRegions(gridSize);
    }

    // Essayer de résoudre
    solution = solvePuzzle(regions, gridSize);

    // ✅ Validation supplémentaire de la solution
    if (solution && !validateSolution(solution, regions, gridSize)) {
      console.log(`❌ Solution validation failed, retrying...`);
      solution = null;
    }

    if (solution) {
      console.log(`🎉 Generated VERIFIED solvable puzzle in ${attempts} attempts!`);
      break;
    }
  }

  // ✅ SÉCURITÉ: Si toujours pas de solution, forcer les régions simples
  if (!solution) {
    console.log(`⚠️ Forcing guaranteed simple row regions as last resort`);
    regions = generateSimpleRowRegions(gridSize);
    solution = solvePuzzle(regions, gridSize);
    
    // ✅ Si même ça échoue, il y a un problème grave
    if (!solution) {
      console.error(`🚨 CRITICAL: Cannot generate solvable puzzle for ${gridSize}x${gridSize}!`);
      // Retourner un puzzle minimal résolvable
      regions = generateSimpleRowRegions(Math.min(4, gridSize));
      solution = solvePuzzle(regions, Math.min(4, gridSize));
    }
  }

  const board = initializeBoard(gridSize, regions!);

  const gameState: GameState = {
    board,
    regions: regions!,
    gridSize,
    queensPlaced: 0,
    queensRequired: gridSize,
    isCompleted: false,
    moveCount: 0,
    solution: solution || [],
  };

  console.log(`📊 Queens Game level generated:`);
  console.log(`   - ${regions!.length} regions`);
  console.log(`   - Solvable: ${solution ? 'YES ✅' : 'NO ❌'}`);
  console.log(`   - Solution: ${solution?.map(p => `${p.row+1}${String.fromCharCode(65+p.col)}`).join(', ') || 'NONE'}`);
  
  // ✅ Validation finale avant de retourner
  if (!solution || solution.length === 0) {
    console.error(`🚨 WARNING: Returning puzzle without verified solution!`);
  }

  return gameState;
}

/**
 * Réinitialise le plateau de jeu
 */
export function resetGameBoard(gameState: GameState): GameState {
  const newBoard = gameState.board.map(row => 
    row.map(cell => ({
      ...cell,
      state: 'empty' as const,
      isHighlighted: false,
      isConflict: false
    }))
  );
  
  const newRegions = gameState.regions.map(region => ({
    ...region,
    hasQueen: false,
    queenPosition: undefined
  }));
  
  return {
    ...gameState,
    board: newBoard,
    regions: newRegions,
    queensPlaced: 0,
    isCompleted: false,
    moveCount: 0
  };
}