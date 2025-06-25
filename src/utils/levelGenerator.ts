import { GameCell, ColoredRegion, GameState } from '../types/game';

/**
 * Couleurs prédéfinies pour les régions
 */
const REGION_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', 
  '#fab1a0', '#fd79a8', '#a29bfe', '#74b9ff', '#00cec9',
  '#fdcb6e', '#e17055', '#ff7675', '#6c5ce7', '#00b894'
];

/**
 * Génère un plateau de jeu avec des régions colorées
 */
export function generateGameLevel(gridSize: number = 6): GameState {
  // Créer le plateau vide
  const board: GameCell[][] = [];
  for (let row = 0; row < gridSize; row++) {
    board[row] = [];
    for (let col = 0; col < gridSize; col++) {
      board[row][col] = {
        row,
        col,
        regionId: 0,
        regionColor: '#ffffff',
        state: 'empty',
        isHighlighted: false,
        isConflict: false
      };
    }
  }

  // Générer les régions colorées de manière simple mais fonctionnelle
  const regions = generateSimpleRegions(gridSize);
  
  // Assigner les régions aux cellules
  regions.forEach((region, index) => {
    region.cells.forEach(cell => {
      if (cell.row < gridSize && cell.col < gridSize) {
        board[cell.row][cell.col].regionId = region.id;
        board[cell.row][cell.col].regionColor = region.color;
      }
    });
  });

  return {
    board,
    regions,
    gridSize,
    queensPlaced: 0,
    queensRequired: gridSize,
    isCompleted: false,
    moveCount: 0
  };
}

/**
 * Génère des régions colorées simples mais valides
 */
function generateSimpleRegions(gridSize: number): ColoredRegion[] {
  const regions: ColoredRegion[] = [];
  const usedCells = new Set<string>();
  
  // Créer des régions de taille variable
  let regionId = 1;
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cellKey = `${row}-${col}`;
      
      if (!usedCells.has(cellKey)) {
        const region = createRegionFromSeed(row, col, gridSize, usedCells, regionId);
        if (region.cells.length > 0) {
          region.color = REGION_COLORS[(regionId - 1) % REGION_COLORS.length];
          regions.push(region);
          regionId++;
        }
      }
    }
  }
  
  return regions;
}

/**
 * Crée une région à partir d'une cellule seed
 */
function createRegionFromSeed(
  startRow: number,
  startCol: number,
  gridSize: number,
  usedCells: Set<string>,
  regionId: number
): ColoredRegion {
  const region: ColoredRegion = {
    id: regionId,
    color: '#ffffff',
    cells: [],
    hasQueen: false
  };
  
  const cellsToProcess = [{row: startRow, col: startCol}];
  const regionSize = Math.floor(Math.random() * 3) + 2; // Régions de 2 à 4 cellules
  
  while (cellsToProcess.length > 0 && region.cells.length < regionSize) {
    const currentCell = cellsToProcess.shift()!;
    const cellKey = `${currentCell.row}-${currentCell.col}`;
    
    if (!usedCells.has(cellKey) && 
        currentCell.row >= 0 && currentCell.row < gridSize &&
        currentCell.col >= 0 && currentCell.col < gridSize) {
      
      usedCells.add(cellKey);
      region.cells.push(currentCell);
      
      // Ajouter les cellules adjacentes (pas en diagonale)
      const neighbors = [
        {row: currentCell.row - 1, col: currentCell.col},
        {row: currentCell.row + 1, col: currentCell.col},
        {row: currentCell.row, col: currentCell.col - 1},
        {row: currentCell.row, col: currentCell.col + 1}
      ];
      
      // Mélanger les voisins pour plus de variété
      neighbors.sort(() => Math.random() - 0.5);
      cellsToProcess.push(...neighbors);
    }
  }
  
  return region;
}

/**
 * Génère une solution valide pour le niveau (pour les hints)
 */
export function generateSolution(board: GameCell[][], regions: ColoredRegion[]): {row: number, col: number}[] {
  // Pour maintenant, retourne une solution vide
  // TODO: Implémenter un solveur complet
  return [];
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
