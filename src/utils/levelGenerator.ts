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
 * Vérifie si une région est connexe
 */
function isRegionConnected(cells: Position[]): boolean {
  if (cells.length <= 1) return true;

  const visited = new Set<string>();
  const queue = [cells[0]];
  visited.add(`${cells[0].row}-${cells[0].col}`);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Chercher tous les voisins orthogonaux dans la région
    for (const cell of cells) {
      const key = `${cell.row}-${cell.col}`;
      if (!visited.has(key) && areOrthogonallyAdjacent(current, cell)) {
        visited.add(key);
        queue.push(cell);
      }
    }
  }

  return visited.size === cells.length;
}

/**
 * Génère une région connexe à partir d'une position de départ
 */
function generateConnectedRegion(
  startRow: number,
  startCol: number,
  targetSize: number,
  gridSize: number,
  usedCells: Set<string>
): Position[] {
  const region: Position[] = [];
  const queue: Position[] = [{ row: startRow, col: startCol }];
  const regionSet = new Set<string>();

  // Directions orthogonales : haut, bas, gauche, droite
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0 && region.length < targetSize) {
    // Choisir aléatoirement dans la queue pour plus de variété
    const randomIndex = Math.floor(Math.random() * queue.length);
    const current = queue.splice(randomIndex, 1)[0];

    const key = `${current.row}-${current.col}`;

    if (usedCells.has(key) || regionSet.has(key)) {
      continue;
    }

    // Ajouter la cellule à la région
    region.push(current);
    regionSet.add(key);

    // Ajouter les voisins valides à la queue
    for (const [dr, dc] of directions) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;
      const newKey = `${newRow}-${newCol}`;

      if (
        newRow >= 0 &&
        newRow < gridSize &&
        newCol >= 0 &&
        newCol < gridSize &&
        !usedCells.has(newKey) &&
        !regionSet.has(newKey)
      ) {
        // Éviter d'ajouter si déjà dans la queue
        const alreadyInQueue = queue.some(
          (pos) => pos.row === newRow && pos.col === newCol
        );
        if (!alreadyInQueue) {
          queue.push({ row: newRow, col: newCol });
        }
      }
    }
  }

  return region;
}

/**
 * Génère des régions colorées simples (fallback) - UNE RÉGION = UNE RANGÉE
 */
function generateSimpleRegions(gridSize: number): ColoredRegion[] {
  console.log(`🎯 Generating simple row regions for ${gridSize}×${gridSize} grid`);

  const regions: ColoredRegion[] = [];

  // Chaque région est une rangée horizontale complète
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
 * Résolveur de puzzle avec backtracking - RÈGLES QUEENS GAME CORRECTES
 */
function solvePuzzle(regions: ColoredRegion[], gridSize: number): Position[] | null {
  console.log(`🧠 Solving puzzle with Queens Game rules...`);

  const solution: Position[] = [];
  const usedRows = new Set<number>();
  const usedCols = new Set<number>();

  function isValidPlacement(pos: Position): boolean {
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
    if (regionIndex >= regions.length) {
      return true; // Solution trouvée
    }

    const region = regions[regionIndex];

    // Mélanger les cellules pour plus de variété
    const shuffledCells = [...region.cells].sort(() => Math.random() - 0.5);

    // Essayer chaque cellule de cette région
    for (const cell of shuffledCells) {
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

  if (solved) {
    console.log(`✅ Puzzle solved! Solution found with ${solution.length} queens`);
    console.log('Solution positions:', solution);
    return solution;
  } else {
    console.log(`❌ No solution found for this configuration`);
    return null;
  }
}

/**
 * Génère des régions plus variées mais résolvables
 */
function generateVariedRegions(gridSize: number): ColoredRegion[] {
  console.log(`🎲 Generating varied regions for ${gridSize}×${gridSize} grid`);

  // Pour les petites grilles, utiliser des régions simples
  if (gridSize <= 4) {
    return generateSimpleRegions(gridSize);
  }

  const regions: ColoredRegion[] = [];
  const usedCells = new Set<string>();

  // Stratégie mixte: quelques lignes/colonnes + formes connexes
  let regionId = 0;

  // 1. Ajouter 1-2 lignes complètes
  const numCompleteLines = Math.min(2, Math.floor(gridSize / 3));
  for (let i = 0; i < numCompleteLines && regionId < gridSize; i++) {
    const isHorizontal = Math.random() < 0.5;
    
    if (isHorizontal) {
      // Ligne horizontale
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
      // Ligne verticale
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

  // 2. Remplir le reste avec des formes connexes
  while (regionId < gridSize) {
    // Trouver une cellule libre
    let startPos: Position | null = null;
    for (let row = 0; row < gridSize && !startPos; row++) {
      for (let col = 0; col < gridSize; col++) {
        const key = `${row}-${col}`;
        if (!usedCells.has(key)) {
          startPos = { row, col };
          break;
        }
      }
    }

    if (!startPos) break;

    // Générer une région connexe
    const regionCells = generateConnectedRegion(
      startPos.row,
      startPos.col,
      gridSize,
      gridSize,
      usedCells
    );

    if (regionCells.length > 0) {
      const region: ColoredRegion = {
        id: regionId++,
        color: REGION_COLORS[regionId % REGION_COLORS.length],
        cells: regionCells,
        hasQueen: false,
      };
      regions.push(region);
      regionCells.forEach(cell => usedCells.add(`${cell.row}-${cell.col}`));
    } else {
      // Si impossible, remplir avec cellules restantes
      const remainingCells: Position[] = [];
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const key = `${row}-${col}`;
          if (!usedCells.has(key)) {
            remainingCells.push({ row, col });
          }
        }
      }
      
      if (remainingCells.length > 0) {
        const region: ColoredRegion = {
          id: regionId++,
          color: REGION_COLORS[regionId % REGION_COLORS.length],
          cells: remainingCells,
          hasQueen: false,
        };
        regions.push(region);
        remainingCells.forEach(cell => usedCells.add(`${cell.row}-${cell.col}`));
      }
      break;
    }
  }

  console.log(`✅ Generated ${regions.length} varied regions`);
  return regions;
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
 * Génère un plateau de jeu avec des régions colorées et solution garantie
 */
export function generateGameLevel(gridSize: number = 6): GameState {
  console.log(`🎯 Generating solvable Queens Game level for ${gridSize}×${gridSize} grid`);

  let regions: ColoredRegion[];
  let solution: Position[] | null = null;
  let attempts = 0;
  const maxAttempts = 20;

  // Essayer de générer un puzzle résolvable
  while (attempts < maxAttempts && !solution) {
    attempts++;
    console.log(`🔄 Attempt ${attempts}/${maxAttempts}`);

    if (attempts <= 10) {
      // Essayer des régions variées
      regions = generateVariedRegions(gridSize);
    } else {
      // Fallback vers des régions simples (lignes)
      console.log(`🔧 Using simple row regions`);
      regions = generateSimpleRegions(gridSize);
    }

    solution = solvePuzzle(regions, gridSize);

    if (solution) {
      console.log(`🎉 Generated solvable Queens Game puzzle in ${attempts} attempts!`);
      break;
    }
  }

  // Si aucune solution trouvée, forcer les régions simples
  if (!solution) {
    console.log(`⚠️ Forcing simple row regions`);
    regions = generateSimpleRegions(gridSize);
    solution = solvePuzzle(regions, gridSize);
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
  console.log(`   - Solvable: ${solution ? 'YES' : 'NO'}`);
  console.log(`   - Solution: ${solution?.map(p => `${p.row+1}${String.fromCharCode(65+p.col)}`).join(', ') || 'NONE'}`);

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
