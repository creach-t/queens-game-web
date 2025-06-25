import { GameCell, ColoredRegion } from '../types/game';

/**
 * Vérifie si deux cellules sont adjacentes (y compris diagonales)
 */
export function areAdjacent(cell1: {row: number, col: number}, cell2: {row: number, col: number}): boolean {
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Vérifie si placer une reine à cette position viole les règles
 */
export function validateQueenPlacement(
  board: GameCell[][],
  regions: ColoredRegion[],
  row: number,
  col: number
): { isValid: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  const gridSize = board.length;
  
  // Vérifier qu'aucune autre reine n'est dans la même rangée
  for (let c = 0; c < gridSize; c++) {
    if (c !== col && board[row][c].state === 'queen') {
      conflicts.push('Reine dans la même rangée');
      break;
    }
  }
  
  // Vérifier qu'aucune autre reine n'est dans la même colonne
  for (let r = 0; r < gridSize; r++) {
    if (r !== row && board[r][col].state === 'queen') {
      conflicts.push('Reine dans la même colonne');
      break;
    }
  }
  
  // Vérifier qu'aucune reine n'est adjacente (y compris diagonales)
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (board[r][c].state === 'queen' && areAdjacent({row, col}, {row: r, col: c})) {
        conflicts.push('Reine adjacente');
        break;
      }
    }
  }
  
  // Vérifier qu'aucune autre reine n'est dans la même région colorée
  const cellRegion = regions.find(region => 
    region.cells.some(cell => cell.row === row && cell.col === col)
  );
  
  if (cellRegion && cellRegion.hasQueen) {
    conflicts.push('Reine dans la même région colorée');
  }
  
  return {
    isValid: conflicts.length === 0,
    conflicts
  };
}

/**
 * Vérifie si le puzzle est complètement résolu
 */
export function isPuzzleCompleted(
  board: GameCell[][],
  regions: ColoredRegion[]
): boolean {
  const gridSize = board.length;
  
  // Vérifier qu'il y a exactement une reine par rangée
  for (let row = 0; row < gridSize; row++) {
    const queensInRow = board[row].filter(cell => cell.state === 'queen').length;
    if (queensInRow !== 1) return false;
  }
  
  // Vérifier qu'il y a exactement une reine par colonne
  for (let col = 0; col < gridSize; col++) {
    const queensInCol = board.map(row => row[col]).filter(cell => cell.state === 'queen').length;
    if (queensInCol !== 1) return false;
  }
  
  // Vérifier qu'il y a exactement une reine par région colorée
  for (const region of regions) {
    if (!region.hasQueen) return false;
  }
  
  return true;
}

/**
 * Met à jour les conflits sur le plateau
 */
export function updateConflicts(
  board: GameCell[][],
  regions: ColoredRegion[]
): GameCell[][] {
  const gridSize = board.length;
  const updatedBoard = board.map(row => row.map(cell => ({...cell, isConflict: false})));
  
  // Marquer toutes les reines en conflit
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (updatedBoard[row][col].state === 'queen') {
        const validation = validateQueenPlacement(board, regions, row, col);
        if (!validation.isValid) {
          updatedBoard[row][col].isConflict = true;
        }
      }
    }
  }
  
  return updatedBoard;
}
