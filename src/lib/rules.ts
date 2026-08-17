/**
 * Queens Game Rules Engine
 * Pure functions for game rule validation and enforcement
 * Optimisé avec des Map-based lookups pour O(Q + N) au lieu de O(Q×N)
 */

import {
  ColoredRegion,
  GameCell,
  Position,
  ValidationResult,
  ProgressiveHint,
} from "../types/game";

// Pénalités de temps par palier d'indice (secondes)
const HINT_PENALTIES = { error: 5, elimination: 5, deduction: 10, reveal: 15 } as const;

/**
 * Checks if two positions are adjacent (including diagonally)
 */
export function areAdjacent(pos1: Position, pos2: Position): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Gets all queens currently placed on the board
 */
export function getPlacedQueens(board: GameCell[][]): Position[] {
  const queens: Position[] = [];
  const gridSize = board.length;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col].state === "queen") {
        queens.push({ row, col });
      }
    }
  }

  return queens;
}

/**
 * Met à jour les conflits sur le plateau
 * Optimisé : pré-indexe les reines par ligne/colonne/région via Map
 */
export function updateConflicts(
  board: GameCell[][],
  regions: ColoredRegion[]
): GameCell[][] {
  const gridSize = board.length;
  const updatedBoard = board.map(row => row.map(cell => ({
    ...cell,
    isConflict: false,
    isInConflictLine: false,
    isInConflictColumn: false,
    isInConflictRegion: false,
    isAroundConflictQueen: false
  })));

  // Collecter toutes les reines
  const allQueens: Position[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (updatedBoard[row][col].state === 'queen') {
        allQueens.push({ row, col });
      }
    }
  }

  if (allQueens.length === 0) return updatedBoard;

  // Pré-indexer les reines par ligne et colonne (O(Q))
  const queensByRow = new Map<number, Position[]>();
  const queensByCol = new Map<number, Position[]>();
  for (const queen of allQueens) {
    if (!queensByRow.has(queen.row)) queensByRow.set(queen.row, []);
    queensByRow.get(queen.row)!.push(queen);
    if (!queensByCol.has(queen.col)) queensByCol.set(queen.col, []);
    queensByCol.get(queen.col)!.push(queen);
  }

  // Pré-indexer cellule → regionId (O(R×C))
  const cellToRegionId = new Map<string, number>();
  for (const region of regions) {
    for (const cell of region.cells) {
      cellToRegionId.set(`${cell.row}-${cell.col}`, region.id);
    }
  }

  // Grouper les reines par région (O(Q))
  const queensByRegion = new Map<number, Position[]>();
  for (const queen of allQueens) {
    const regionId = cellToRegionId.get(`${queen.row}-${queen.col}`);
    if (regionId !== undefined) {
      if (!queensByRegion.has(regionId)) queensByRegion.set(regionId, []);
      queensByRegion.get(regionId)!.push(queen);
    }
  }

  // RÈGLE 1: Conflit de ligne
  for (const [row, queensInRow] of queensByRow) {
    if (queensInRow.length > 1) {
      for (let col = 0; col < gridSize; col++) {
        updatedBoard[row][col].isInConflictLine = true;
      }
      for (const queen of queensInRow) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 2: Conflit de colonne
  for (const [col, queensInCol] of queensByCol) {
    if (queensInCol.length > 1) {
      for (let row = 0; row < gridSize; row++) {
        updatedBoard[row][col].isInConflictColumn = true;
      }
      for (const queen of queensInCol) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 3: Conflit de région
  for (const region of regions) {
    const queensInRegion = queensByRegion.get(region.id);
    if (queensInRegion && queensInRegion.length > 1) {
      for (const cell of region.cells) {
        updatedBoard[cell.row][cell.col].isInConflictRegion = true;
      }
      for (const queen of queensInRegion) {
        updatedBoard[queen.row][queen.col].isConflict = true;
      }
    }
  }

  // RÈGLE 4: Conflit d'adjacence
  for (let i = 0; i < allQueens.length; i++) {
    for (let j = i + 1; j < allQueens.length; j++) {
      const queen1 = allQueens[i];
      const queen2 = allQueens[j];

      if (areAdjacent(queen1, queen2)) {
        updatedBoard[queen1.row][queen1.col].isConflict = true;
        updatedBoard[queen2.row][queen2.col].isConflict = true;

        for (const queen of [queen1, queen2]) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = queen.row + dr;
              const newCol = queen.col + dc;
              if (newRow >= 0 && newRow < gridSize &&
                  newCol >= 0 && newCol < gridSize) {
                updatedBoard[newRow][newCol].isAroundConflictQueen = true;
              }
            }
          }
        }
      }
    }
  }

  return updatedBoard;
}

/**
 * Validates a complete game state against all rules
 */
export function validateCompleteGameState(
  queens: Position[],
  regions: ColoredRegion[],
  gridSize: number
): ValidationResult {
  const conflicts: string[] = [];

  // Rule 1: Exactly one queen per row
  const rowCounts = new Map<number, number>();
  queens.forEach((queen) => {
    rowCounts.set(queen.row, (rowCounts.get(queen.row) || 0) + 1);
  });

  for (let row = 0; row < gridSize; row++) {
    const count = rowCounts.get(row) || 0;
    if (count !== 1) {
      conflicts.push(`Row ${row + 1} has ${count} queens (should be 1)`);
    }
  }

  // Rule 2: Exactly one queen per column
  const colCounts = new Map<number, number>();
  queens.forEach((queen) => {
    colCounts.set(queen.col, (colCounts.get(queen.col) || 0) + 1);
  });

  for (let col = 0; col < gridSize; col++) {
    const count = colCounts.get(col) || 0;
    if (count !== 1) {
      conflicts.push(`Column ${col + 1} has ${count} queens (should be 1)`);
    }
  }

  // Rule 3: Exactly one queen per region (Map-based lookup)
  const cellToRegionId = new Map<string, number>();
  for (const region of regions) {
    for (const cell of region.cells) {
      cellToRegionId.set(`${cell.row}-${cell.col}`, region.id);
    }
  }

  const queensPerRegion = new Map<number, number>();
  for (const queen of queens) {
    const regionId = cellToRegionId.get(`${queen.row}-${queen.col}`);
    if (regionId !== undefined) {
      queensPerRegion.set(regionId, (queensPerRegion.get(regionId) || 0) + 1);
    }
  }

  for (const region of regions) {
    const count = queensPerRegion.get(region.id) || 0;
    if (count !== 1) {
      conflicts.push(`Region ${region.id + 1} has ${count} queens (should be 1)`);
    }
  }

  // Rule 4: No queens touching each other
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      if (areAdjacent(queens[i], queens[j])) {
        conflicts.push(`Queens at ${queens[i].row + 1},${queens[i].col + 1} and ${queens[j].row + 1},${queens[j].col + 1} are touching`);
      }
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Checks if a position is within grid bounds
 */
export function isPositionInBounds(
  position: Position,
  gridSize: number
): boolean {
  return (
    position.row >= 0 &&
    position.row < gridSize &&
    position.col >= 0 &&
    position.col < gridSize
  );
}

/**
 * Gets a hint for the next best move based on the solution
 */
export function getHint(
  board: GameCell[][],
  solution?: Position[]
): Position | null {
  if (solution) {
    const placedPositions = new Set(
      getPlacedQueens(board).map((pos) => `${pos.row}-${pos.col}`)
    );

    for (const solutionPos of solution) {
      const key = `${solutionPos.row}-${solutionPos.col}`;
      if (!placedPositions.has(key)) {
        return solutionPos;
      }
    }
  }

  return null;
}

/**
 * Construit une Map cellule → id de région.
 */
function buildCellToRegion(regions: ColoredRegion[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const region of regions) {
    for (const cell of region.cells) {
      map.set(`${cell.row}-${cell.col}`, region.id);
    }
  }
  return map;
}

/**
 * Ensemble des cases (non-reines) rendues IMPOSSIBLES par les reines déjà placées :
 * même ligne, même colonne, même région, ou case adjacente (diagonale incluse).
 */
function computeEliminated(
  board: GameCell[][],
  gridSize: number,
  cellToRegion: Map<string, number>
): Set<string> {
  const eliminated = new Set<string>();
  const queens = getPlacedQueens(board);
  if (queens.length === 0) return eliminated;

  const queenRows = new Set(queens.map((q) => q.row));
  const queenCols = new Set(queens.map((q) => q.col));
  const queenRegions = new Set(
    queens.map((q) => cellToRegion.get(`${q.row}-${q.col}`))
  );

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col].state === "queen") continue;
      const regionId = cellToRegion.get(`${row}-${col}`);
      let blocked =
        queenRows.has(row) ||
        queenCols.has(col) ||
        (regionId !== undefined && queenRegions.has(regionId));

      if (!blocked) {
        for (const q of queens) {
          if (areAdjacent({ row, col }, q)) {
            blocked = true;
            break;
          }
        }
      }

      if (blocked) eliminated.add(`${row}-${col}`);
    }
  }

  return eliminated;
}

/**
 * Indice progressif et pédagogique.
 * Ordre de priorité :
 *   1. error      → une contradiction PUREMENT LOGIQUE : une région, une ligne ou une
 *                   colonne dont toutes les cases sont barrées (❌) ou éliminées par une
 *                   reine, alors qu'une reine y est obligatoire (la solution n'est jamais
 *                   consultée à ce palier — on ne révèle donc aucun emplacement de reine).
 *   2. elimination→ zones interdites (une loi rend ces cases impossibles) + explication
 *   3. deduction  → une seule case reste possible dans une région / ligne / colonne
 *   4. reveal     → position d'une reine (dernier recours ; SEUL palier à lire `solution`)
 *
 * `stage` fait monter le niveau d'aide quand le joueur reste bloqué (0 → 1 → 2+).
 */
export function computeProgressiveHint(
  board: GameCell[][],
  regions: ColoredRegion[],
  gridSize: number,
  solution: Position[] | undefined,
  stage: number
): ProgressiveHint | null {
  const cellToRegion = buildCellToRegion(regions);
  const eliminated = computeEliminated(board, gridSize, cellToRegion);
  const isCandidate = (row: number, col: number): boolean =>
    board[row][col].state !== "queen" && !eliminated.has(`${row}-${col}`);

  // Une case est « jouable » si elle peut encore accueillir une reine :
  // vide (ni reine ni croix) ET non éliminée par une reine déjà placée.
  const isPlayable = (row: number, col: number): boolean =>
    board[row][col].state === "empty" && !eliminated.has(`${row}-${col}`);

  // --- PALIER 1 (prioritaire) : contradiction logique (sur-barrage du joueur) ---
  // Une région / ligne / colonne SANS reine mais dont plus aucune case n'est jouable
  // (toutes barrées ou éliminées) est insoluble : le joueur a forcément barré une
  // case indispensable. On surligne toute la zone SANS désigner de cible, et on lui
  // demande de retirer une croix — jamais on ne montre où va la reine.
  {
    // a) Par région
    for (const region of regions) {
      const hasQueen = region.cells.some(
        (c) => board[c.row][c.col].state === "queen"
      );
      if (hasQueen) continue;
      const hasPlayable = region.cells.some((c) => isPlayable(c.row, c.col));
      const hasMarked = region.cells.some(
        (c) => board[c.row][c.col].state === "marked"
      );
      if (!hasPlayable && hasMarked) {
        return {
          level: "error",
          forbidden: region.cells.map((c) => ({ row: c.row, col: c.col })),
          target: null,
          title: "Erreur : région sans issue",
          explanation:
            "Tu as barré toutes les cases possibles de cette région — une reine doit pourtant y aller. Retire une de tes croix.",
          penalty: HINT_PENALTIES.error,
        };
      }
    }

    // b) Par ligne
    for (let row = 0; row < gridSize; row++) {
      const hasQueen = board[row].some((cell) => cell.state === "queen");
      if (hasQueen) continue;
      let hasPlayable = false;
      let hasMarked = false;
      for (let col = 0; col < gridSize; col++) {
        if (isPlayable(row, col)) hasPlayable = true;
        if (board[row][col].state === "marked") hasMarked = true;
      }
      if (!hasPlayable && hasMarked) {
        return {
          level: "error",
          forbidden: Array.from({ length: gridSize }, (_, col) => ({ row, col })),
          target: null,
          title: "Erreur : ligne sans issue",
          explanation: `Tu as barré toutes les cases possibles de la ligne ${row + 1} — une reine doit pourtant y aller. Retire une de tes croix.`,
          penalty: HINT_PENALTIES.error,
        };
      }
    }

    // c) Par colonne
    for (let col = 0; col < gridSize; col++) {
      let hasQueen = false;
      let hasPlayable = false;
      let hasMarked = false;
      for (let row = 0; row < gridSize; row++) {
        if (board[row][col].state === "queen") hasQueen = true;
        if (isPlayable(row, col)) hasPlayable = true;
        if (board[row][col].state === "marked") hasMarked = true;
      }
      if (hasQueen) continue;
      if (!hasPlayable && hasMarked) {
        return {
          level: "error",
          forbidden: Array.from({ length: gridSize }, (_, row) => ({ row, col })),
          target: null,
          title: "Erreur : colonne sans issue",
          explanation: `Tu as barré toutes les cases possibles de la colonne ${col + 1} — une reine doit pourtant y aller. Retire une de tes croix.`,
          penalty: HINT_PENALTIES.error,
        };
      }
    }
  }

  // --- PALIER 2 : zones interdites (élimination) ---
  if (stage <= 0) {
    // a) Si des reines sont posées : montrer les cases qu'elles interdisent
    const forbiddenByQueens: Position[] = [];
    for (const key of eliminated) {
      const [r, c] = key.split("-").map(Number);
      if (board[r][c].state === "empty") forbiddenByQueens.push({ row: r, col: c });
    }
    if (forbiddenByQueens.length > 0) {
      return {
        level: "elimination",
        forbidden: forbiddenByQueens,
        target: null,
        title: "Zones interdites",
        explanation:
          "Chaque reine interdit toute sa ligne, toute sa colonne, toute sa région et les 8 cases qui la touchent. Les cases surlignées ne peuvent donc pas contenir de reine : tu peux les barrer (❌).",
        penalty: HINT_PENALTIES.elimination,
      };
    }

    // b) Aucune reine posée : montrer une région confinée à une seule ligne/colonne
    for (const region of regions) {
      if (region.cells.length < 2) continue;
      const rows = new Set(region.cells.map((c) => c.row));
      const cols = new Set(region.cells.map((c) => c.col));

      if (rows.size === 1) {
        const line = region.cells[0].row;
        const forbidden = region.cells.length
          ? Array.from({ length: gridSize }, (_, col) => ({ row: line, col }))
              .filter(
                (p) =>
                  cellToRegion.get(`${p.row}-${p.col}`) !== region.id &&
                  board[p.row][p.col].state === "empty"
              )
          : [];
        if (forbidden.length > 0) {
          return {
            level: "elimination",
            forbidden,
            target: null,
            title: "Région confinée à une ligne",
            explanation: `Une région tient entièrement sur la ligne ${line + 1} : sa reine y sera forcément. Aucune autre reine ne peut donc occuper cette ligne — barre (❌) les cases surlignées.`,
            penalty: HINT_PENALTIES.elimination,
          };
        }
      }

      if (cols.size === 1) {
        const line = region.cells[0].col;
        const forbidden = Array.from({ length: gridSize }, (_, row) => ({ row, col: line }))
          .filter(
            (p) =>
              cellToRegion.get(`${p.row}-${p.col}`) !== region.id &&
              board[p.row][p.col].state === "empty"
          );
        if (forbidden.length > 0) {
          return {
            level: "elimination",
            forbidden,
            target: null,
            title: "Région confinée à une colonne",
            explanation: `Une région tient entièrement sur la colonne ${line + 1} : sa reine y sera forcément. Aucune autre reine ne peut donc occuper cette colonne — barre (❌) les cases surlignées.`,
            penalty: HINT_PENALTIES.elimination,
          };
        }
      }
    }
  }

  // --- PALIER 3 : déduction (une seule case possible) ---
  if (stage <= 1) {
    const regionHasQueen = new Map<number, boolean>();
    for (const region of regions) {
      regionHasQueen.set(
        region.id,
        region.cells.some((c) => board[c.row][c.col].state === "queen")
      );
    }

    // Par région
    for (const region of regions) {
      if (regionHasQueen.get(region.id)) continue;
      const cands = region.cells.filter((c) => isCandidate(c.row, c.col));
      if (cands.length === 1) {
        return {
          level: "deduction",
          forbidden: region.cells
            .filter((c) => eliminated.has(`${c.row}-${c.col}`) && board[c.row][c.col].state === "empty")
            .map((c) => ({ row: c.row, col: c.col })),
          target: { row: cands[0].row, col: cands[0].col },
          title: "Déduction : case forcée",
          explanation:
            "Dans cette région, toutes les cases sauf une sont attaquées par une reine. La reine doit donc aller sur la case entourée en bleu.",
          penalty: HINT_PENALTIES.deduction,
        };
      }
    }

    // Par ligne / colonne
    const rowHasQueen = (r: number) =>
      board[r].some((cell) => cell.state === "queen");
    const colHasQueen = (c: number) => {
      for (let r = 0; r < gridSize; r++) if (board[r][c].state === "queen") return true;
      return false;
    };

    for (let r = 0; r < gridSize; r++) {
      if (rowHasQueen(r)) continue;
      const cands: Position[] = [];
      for (let c = 0; c < gridSize; c++) if (isCandidate(r, c)) cands.push({ row: r, col: c });
      if (cands.length === 1) {
        return {
          level: "deduction",
          forbidden: [],
          target: cands[0],
          title: "Déduction : ligne forcée",
          explanation: `Sur la ligne ${r + 1}, une seule case reste possible : la reine de cette ligne doit s'y placer.`,
          penalty: HINT_PENALTIES.deduction,
        };
      }
    }

    for (let c = 0; c < gridSize; c++) {
      if (colHasQueen(c)) continue;
      const cands: Position[] = [];
      for (let r = 0; r < gridSize; r++) if (isCandidate(r, c)) cands.push({ row: r, col: c });
      if (cands.length === 1) {
        return {
          level: "deduction",
          forbidden: [],
          target: cands[0],
          title: "Déduction : colonne forcée",
          explanation: `Sur la colonne ${c + 1}, une seule case reste possible : la reine de cette colonne doit s'y placer.`,
          penalty: HINT_PENALTIES.deduction,
        };
      }
    }
  }

  // --- PALIER 4 : révélation (dernier recours) ---
  const pos = getHint(board, solution);
  if (pos) {
    return {
      level: "reveal",
      forbidden: [],
      target: pos,
      title: "Dernier recours",
      explanation:
        "Aucune déduction simple n'est disponible : la prochaine reine se place sur la case entourée en bleu.",
      penalty: HINT_PENALTIES.reveal,
    };
  }

  return null;
}
