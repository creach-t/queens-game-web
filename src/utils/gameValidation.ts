import { ColoredRegion, GameCell } from "../types/game";

/**
 * Vérifie si deux cellules sont adjacentes (y compris diagonales) - RÈGLE QUEENS GAME
 */
export function areAdjacent(
  cell1: { row: number; col: number },
  cell2: { row: number; col: number }
): boolean {
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * ✅ Vérifie si placer une reine à cette position viole les règles du Queens Game
 */
export function validateQueenPlacement(
  board: GameCell[][],
  regions: ColoredRegion[],
  row: number,
  col: number
): { isValid: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  const gridSize = board.length;

  // ✅ Vérification des limites
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
    conflicts.push("Position hors limites");
    return { isValid: false, conflicts };
  }

  // Règle 1: Une seule reine par rangée
  for (let c = 0; c < gridSize; c++) {
    if (c !== col && board[row][c].state === "queen") {
      conflicts.push(`Reine dans la même rangée (colonne ${c + 1})`);
      break;
    }
  }

  // Règle 2: Une seule reine par colonne
  for (let r = 0; r < gridSize; r++) {
    if (r !== row && board[r][col].state === "queen") {
      conflicts.push(`Reine dans la même colonne (rangée ${r + 1})`);
      break;
    }
  }

  // Règle 3: Les reines ne peuvent pas se toucher (y compris diagonales)
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (
        board[r][c].state === "queen" &&
        areAdjacent({ row, col }, { row: r, col: c })
      ) {
        conflicts.push(
          `Reine adjacente en ${r + 1}${String.fromCharCode(
            65 + c
          )} (se touchent)`
        );
        break;
      }
    }
  }

  // Règle 4: Une seule reine par région colorée
  const cellRegion = regions.find((region) =>
    region.cells.some((cell) => cell.row === row && cell.col === col)
  );

  if (cellRegion && cellRegion.hasQueen) {
    const existingQueen = cellRegion.queenPosition;
    if (existingQueen) {
      conflicts.push(
        `Reine dans la même région colorée (${
          existingQueen.row + 1
        }${String.fromCharCode(65 + existingQueen.col)})`
      );
    } else {
      conflicts.push("Reine dans la même région colorée");
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * ✅ NOUVELLE VERSION: Met à jour les conflits avec hachures spécifiques par règle
 */
export function updateConflicts(
  board: GameCell[][],
  regions: ColoredRegion[]
): GameCell[][] {
  const gridSize = board.length;
  const updatedBoard = board.map((row) =>
    row.map((cell) => ({
      ...cell,
      isConflict: false,
      isInConflictLine: false,
      isInConflictColumn: false,
      isInConflictRegion: false,
      isAroundConflictQueen: false,
    }))
  );

  // Collecter toutes les reines
  const allQueens: { row: number; col: number }[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (updatedBoard[row][col].state === "queen") {
        allQueens.push({ row, col });
      }
    }
  }

  console.log(`🔍 Vérification des conflits pour ${allQueens.length} reines`);

  // RÈGLE 1: Conflit de ligne - hachurer toute la ligne
  for (let row = 0; row < gridSize; row++) {
    const queensInRow = allQueens.filter((q) => q.row === row);
    if (queensInRow.length > 1) {
      console.log(`⚠️ Conflit ligne ${row + 1}: ${queensInRow.length} reines`);

      // Marquer toute la ligne
      for (let col = 0; col < gridSize; col++) {
        updatedBoard[row][col].isInConflictLine = true;
      }

      // Marquer les reines en conflit
      for (const queen of queensInRow) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 2: Conflit de colonne - hachurer toute la colonne
  for (let col = 0; col < gridSize; col++) {
    const queensInCol = allQueens.filter((q) => q.col === col);
    if (queensInCol.length > 1) {
      console.log(
        `⚠️ Conflit colonne ${col + 1}: ${queensInCol.length} reines`
      );

      // Marquer toute la colonne
      for (let row = 0; row < gridSize; row++) {
        updatedBoard[row][col].isInConflictColumn = true;
      }

      // Marquer les reines en conflit
      for (const queen of queensInCol) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 3: Conflit de région - hachurer toute la région
  for (const region of regions) {
    const queensInRegion = allQueens.filter((q) =>
      region.cells.some((cell) => cell.row === q.row && cell.col === q.col)
    );

    if (queensInRegion.length > 1) {
      console.log(
        `⚠️ Conflit région ${region.id + 1}: ${queensInRegion.length} reines`
      );

      // Marquer toute la région
      for (const cell of region.cells) {
        updatedBoard[cell.row][cell.col].isInConflictRegion = true;
      }

      // Marquer les reines en conflit
      for (const queen of queensInRegion) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 4: Conflit d'adjacence - hachurer autour de la reine existante
  for (let i = 0; i < allQueens.length; i++) {
    for (let j = i + 1; j < allQueens.length; j++) {
      const queen1 = allQueens[i];
      const queen2 = allQueens[j];

      if (areAdjacent(queen1, queen2)) {
        console.log(
          `⚠️ Conflit adjacence: ${queen1.row + 1}${String.fromCharCode(
            65 + queen1.col
          )} et ${queen2.row + 1}${String.fromCharCode(65 + queen2.col)}`
        );

        // Marquer les deux reines en conflit
        updatedBoard[queen1.row][queen1.col].isConflict = true;
        updatedBoard[queen2.row][queen2.col].isConflict = true;

        // Hachurer autour de chaque reine
        for (const queen of [queen1, queen2]) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = queen.row + dr;
              const newCol = queen.col + dc;

              if (
                newRow >= 0 &&
                newRow < gridSize &&
                newCol >= 0 &&
                newCol < gridSize
              ) {
                updatedBoard[newRow][newCol].isAroundConflictQueen = true;
              }
            }
          }
        }
      }
    }
  }

  // Compter les conflits
  const conflictCount = allQueens.filter(
    (queen) => updatedBoard[queen.row][queen.col].isConflict
  ).length;

  if (conflictCount > 0) {
    console.log(`⚠️ Total: ${conflictCount} reines en conflit`);
  }

  return updatedBoard;
}

/**
 * ✅ Vérifie si le puzzle est complètement résolu avec logging détaillé
 */
export function isPuzzleCompleted(
  board: GameCell[][],
  regions: ColoredRegion[]
): boolean {
  const gridSize = board.length;
  let isValid = true;

  // Collecter toutes les reines
  const queens: { row: number; col: number }[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col].state === "queen") {
        queens.push({ row, col });
      }
    }
  }

  console.log(`🔍 Validating puzzle completion with ${queens.length} queens:`);
  console.log(
    `   Queens positions: ${queens
      .map((q) => `${q.row + 1}${String.fromCharCode(65 + q.col)}`)
      .join(", ")}`
  );

  // Règle 1: Il doit y avoir exactement une reine par rangée
  for (let row = 0; row < gridSize; row++) {
    const queensInRow = board[row].filter(
      (cell) => cell.state === "queen"
    ).length;
    if (queensInRow !== 1) {
      console.log(`❌ Row ${row + 1} has ${queensInRow} queens (should be 1)`);
      isValid = false;
    }
  }

  // Règle 2: Il doit y avoir exactement une reine par colonne
  for (let col = 0; col < gridSize; col++) {
    const queensInCol = board
      .map((row) => row[col])
      .filter((cell) => cell.state === "queen").length;
    if (queensInCol !== 1) {
      console.log(
        `❌ Column ${col + 1} has ${queensInCol} queens (should be 1)`
      );
      isValid = false;
    }
  }

  // Règle 3: Il doit y avoir exactement une reine par région colorée
  for (const region of regions) {
    if (!region.hasQueen) {
      console.log(
        `❌ Region ${region.id + 1} (color ${region.color}) has no queen`
      );
      isValid = false;
    }
  }

  // Règle 4: Aucune reine ne doit se toucher
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      if (areAdjacent(queens[i], queens[j])) {
        console.log(
          `❌ Queens at ${queens[i].row + 1}${String.fromCharCode(
            65 + queens[i].col
          )} and ${queens[j].row + 1}${String.fromCharCode(
            65 + queens[j].col
          )} are touching`
        );
        isValid = false;
      }
    }
  }

  // ✅ Vérification bonus: Nombre total de reines
  if (queens.length !== gridSize) {
    console.log(
      `❌ Wrong total number of queens: ${queens.length}/${gridSize}`
    );
    isValid = false;
  }

  if (isValid) {
    console.log(
      `✅ Puzzle completed! All ${queens.length} queens placed correctly`
    );
    console.log(
      `🎉 BRAVO! Solution: ${queens
        .map((q) => `${q.row + 1}${String.fromCharCode(65 + q.col)}`)
        .join(", ")}`
    );
  } else {
    console.log(`❌ Puzzle not yet completed - validation failed`);
  }

  return isValid;
}

/**
 * ✅ Fonction utilitaire pour vérifier la validité globale d'un état de jeu
 */
export function validateGameState(
  board: GameCell[][],
  regions: ColoredRegion[]
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const gridSize = board.length;

  // Vérifier la cohérence des régions
  const expectedCells = gridSize * gridSize;
  const actualCells = regions.reduce(
    (total, region) => total + region.cells.length,
    0
  );

  if (actualCells !== expectedCells) {
    issues.push(
      `Incohérence des régions: ${actualCells} cellules au lieu de ${expectedCells}`
    );
  }

  // Vérifier que chaque cellule appartient à exactement une région
  const cellRegionMap = new Map<string, number>();
  for (const region of regions) {
    for (const cell of region.cells) {
      const key = `${cell.row}-${cell.col}`;
      if (cellRegionMap.has(key)) {
        issues.push(
          `Cellule ${cell.row + 1}${String.fromCharCode(
            65 + cell.col
          )} appartient à plusieurs régions`
        );
      }
      cellRegionMap.set(key, region.id);
    }
  }

  // Vérifier la cohérence du plateau avec les régions
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cell = board[row][col];
      const key = `${row}-${col}`;
      const expectedRegionId = cellRegionMap.get(key);

      if (expectedRegionId !== cell.regionId) {
        issues.push(
          `Cellule ${row + 1}${String.fromCharCode(
            65 + col
          )} a un regionId incorrect: ${
            cell.regionId
          } au lieu de ${expectedRegionId}`
        );
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
