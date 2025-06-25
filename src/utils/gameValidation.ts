import { GameCell, ColoredRegion } from '../types/game';

/**
 * Vérifie si deux cellules sont adjacentes (y compris diagonales) - RÈGLE QUEENS GAME
 */
export function areAdjacent(cell1: {row: number, col: number}, cell2: {row: number, col: number}): boolean {
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Vérifie si placer une reine à cette position viole les règles du Queens Game
 */
export function validateQueenPlacement(
  board: GameCell[][],
  regions: ColoredRegion[],
  row: number,
  col: number
): { isValid: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  const gridSize = board.length;
  
  // Règle 1: Une seule reine par rangée
  for (let c = 0; c < gridSize; c++) {
    if (c !== col && board[row][c].state === 'queen') {
      conflicts.push('Reine dans la même rangée');
      break;
    }
  }
  
  // Règle 2: Une seule reine par colonne
  for (let r = 0; r < gridSize; r++) {
    if (r !== row && board[r][col].state === 'queen') {
      conflicts.push('Reine dans la même colonne');
      break;
    }
  }
  
  // Règle 3: Les reines ne peuvent pas se toucher (y compris diagonales)
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (board[r][c].state === 'queen' && areAdjacent({row, col}, {row: r, col: c})) {
        conflicts.push('Reine adjacente (se touchent)');
        break;
      }
    }
  }
  
  // Règle 4: Une seule reine par région colorée
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
 * Vérifie si le puzzle est complètement résolu selon les règles Queens Game
 */
export function isPuzzleCompleted(
  board: GameCell[][],
  regions: ColoredRegion[]
): boolean {
  const gridSize = board.length;
  
  // Règle 1: Il doit y avoir exactement une reine par rangée
  for (let row = 0; row < gridSize; row++) {
    const queensInRow = board[row].filter(cell => cell.state === 'queen').length;
    if (queensInRow !== 1) {
      console.log(`❌ Row ${row+1} has ${queensInRow} queens (should be 1)`);
      return false;
    }
  }
  
  // Règle 2: Il doit y avoir exactement une reine par colonne
  for (let col = 0; col < gridSize; col++) {
    const queensInCol = board.map(row => row[col]).filter(cell => cell.state === 'queen').length;
    if (queensInCol !== 1) {
      console.log(`❌ Column ${col+1} has ${queensInCol} queens (should be 1)`);
      return false;
    }
  }
  
  // Règle 3: Il doit y avoir exactement une reine par région colorée
  for (const region of regions) {
    if (!region.hasQueen) {
      console.log(`❌ Region ${region.id+1} has no queen`);
      return false;
    }
  }
  
  // Règle 4: Aucune reine ne doit se toucher
  const queens: {row: number, col: number}[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col].state === 'queen') {
        queens.push({row, col});
      }
    }
  }
  
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      if (areAdjacent(queens[i], queens[j])) {
        console.log(`❌ Queens at ${queens[i].row+1}${String.fromCharCode(65+queens[i].col)} and ${queens[j].row+1}${String.fromCharCode(65+queens[j].col)} are touching`);
        return false;
      }
    }
  }
  
  console.log(`✅ Puzzle completed! All ${queens.length} queens placed correctly`);
  return true;
}

/**
 * Met à jour les conflits sur le plateau selon les règles Queens Game
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
