import { REGION_COLORS } from "../constants";
import { ColoredRegion, GameCell, GameState, Position } from "../types/game";

/**
 * Générateur de niveaux Queens 100 % côté client.
 *
 * Stratégie « seed-and-repair » (rapide, déterministe et sûr) :
 *   1. Tirer une solution N-Queens aléatoire (1 reine par ligne/colonne, aucune adjacence).
 *   2. Découper la grille en régions contiguës par flood aléatoire multi-source
 *      (chaque région contient exactement une reine). La contiguïté est garantie
 *      par construction : chaque case reçoit sa couleur d'une case voisine déjà colorée.
 *   3. Vérifier l'unicité avec un solveur bitmask exact (s'arrête à 2 solutions → µs).
 *   4. Si une 2ᵉ solution existe, la « casser » chirurgicalement en déplaçant UNE case
 *      vers une région voisine, sans jamais invalider la solution de base ni la contiguïté.
 *
 * Aucune dépendance Firebase : le module est autonome et testable seul.
 * Complexité pratique : quelques millisecondes même en 12×12 → OK mobile.
 */

const MIN_SIZE = 5;
const MAX_SIZE = 12;

type Rng = () => number;

/** PRNG déterministe (mulberry32) — permet de reproduire un niveau via une graine. */
function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: Rng): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Solution N-Queens « jeu » : permutation ligne→colonne sans deux reines adjacentes.
 * Comme il y a une reine par ligne, la seule adjacence possible est entre lignes
 * consécutives → il suffit d'imposer |col[r] - col[r-1]| > 1.
 * Renvoie le tableau des colonnes indexé par ligne, ou null si le tirage échoue.
 */
function randomSolution(n: number, rng: Rng): number[] | null {
  const col = new Array<number>(n).fill(-1);
  const usedCol = new Array<boolean>(n).fill(false);

  const place = (row: number): boolean => {
    if (row === n) return true;
    const cols = Array.from({ length: n }, (_, i) => i);
    shuffle(cols, rng);
    for (const c of cols) {
      if (usedCol[c]) continue;
      if (row > 0 && Math.abs(c - col[row - 1]) <= 1) continue;
      col[row] = c;
      usedCol[c] = true;
      if (place(row + 1)) return true;
      col[row] = -1;
      usedCol[c] = false;
    }
    return false;
  };

  return place(0) ? col : null;
}

/**
 * Découpe la grille en `n` régions contiguës par flood aléatoire multi-source.
 * `owner[r][c]` = id de région (0..n-1). La région `i` est amorcée sur la reine `i`.
 * Contiguïté garantie : chaque case reçoit sa couleur d'une case voisine déjà colorée.
 */
function partitionRegions(n: number, sol: number[], rng: Rng): number[][] {
  const owner = Array.from({ length: n }, () => new Array<number>(n).fill(-1));

  type Frontier = { row: number; col: number; region: number };
  const frontier: Frontier[] = [];

  const pushNeighbors = (row: number, col: number, region: number): void => {
    for (const [dr, dc] of DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (owner[nr][nc] !== -1) continue;
      frontier.push({ row: nr, col: nc, region });
    }
  };

  for (let i = 0; i < n; i++) {
    owner[i][sol[i]] = i;
    pushNeighbors(i, sol[i], i);
  }

  let remaining = n * n - n;
  while (remaining > 0 && frontier.length > 0) {
    const idx = Math.floor(rng() * frontier.length);
    const f = frontier[idx];
    frontier[idx] = frontier[frontier.length - 1];
    frontier.pop();
    if (owner[f.row][f.col] !== -1) continue; // déjà pris entre-temps
    owner[f.row][f.col] = f.region;
    remaining--;
    pushNeighbors(f.row, f.col, f.region);
  }

  return owner;
}

/**
 * Solveur bitmask exact (parcours ligne par ligne). Renvoie jusqu'à `cap` solutions.
 * Contraintes : 1 reine/ligne (implicite), colonnes distinctes, régions distinctes,
 * pas d'adjacence entre lignes voisines. n ≤ 12 → masques sur 12 bits.
 * Coût par nœud volontairement minimal (O(n)) : c'est le facteur dominant quand on
 * ne compte que jusqu'à 2 solutions.
 */
function findSolutions(owner: number[][], n: number, cap: number): number[][] {
  const results: number[][] = [];
  const col = new Array<number>(n);

  const place = (
    row: number,
    usedCols: number,
    usedRegions: number,
    prevCol: number
  ): void => {
    if (results.length >= cap) return;
    if (row === n) {
      results.push(col.slice());
      return;
    }
    for (let c = 0; c < n; c++) {
      if (usedCols & (1 << c)) continue;
      if (row > 0 && Math.abs(c - prevCol) <= 1) continue;
      const g = owner[row][c];
      if (usedRegions & (1 << g)) continue;
      col[row] = c;
      place(row + 1, usedCols | (1 << c), usedRegions | (1 << g), c);
      if (results.length >= cap) return;
    }
  };

  place(0, 0, 0, -2);
  return results;
}

/** Une région donnée est-elle d'un seul tenant ? (BFS sur ses cases) */
function isRegionContiguous(owner: number[][], n: number, region: number): boolean {
  let start: Position | null = null;
  let total = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (owner[r][c] === region) {
        total++;
        if (!start) start = { row: r, col: c };
      }
    }
  }
  if (!start || total === 0) return true;

  const seen = new Set<string>([`${start.row}-${start.col}`]);
  const stack: Position[] = [start];
  while (stack.length > 0) {
    const { row, col } = stack.pop()!;
    for (const [dr, dc] of DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (owner[nr][nc] !== region) continue;
      const key = `${nr}-${nc}`;
      if (seen.has(key)) continue;
      seen.add(key);
      stack.push({ row: nr, col: nc });
    }
  }
  return seen.size === total;
}

/**
 * Rend le découpage à solution unique en cassant les solutions alternatives une à une.
 * Déplace une case (jamais une case-reine) vers une région voisine tant que la
 * contiguïté de la région d'origine est préservée. La solution de base reste toujours
 * valide (on ne touche jamais aux cases-reines), donc « unique » ⇔ exactement 1 solution.
 * Renvoie true si unique, false si bloqué (l'appelant relancera un nouveau découpage).
 */
function repairToUnique(owner: number[][], n: number, sol: number[], rng: Rng): boolean {
  // Plafond réglé empiriquement (~4·n) : au-delà, un découpage qui ne converge pas
  // vite ne convergera jamais → mieux vaut l'abandonner et repartir d'un neuf.
  const maxIterations = 4 * n;

  for (let iter = 0; iter < maxIterations; iter++) {
    const sols = findSolutions(owner, n, 2);
    if (sols.length <= 1) return true; // la base est toujours valide → exactement 1

    // Choisir une solution alternative (différente de la base)
    const alt =
      sols.find((s) => s.some((c, r) => c !== sol[r])) ?? sols[1];

    const diffRows: number[] = [];
    for (let r = 0; r < n; r++) if (alt[r] !== sol[r]) diffRows.push(r);
    shuffle(diffRows, rng);

    let moved = false;
    for (const r of diffRows) {
      const cr = r;
      const cc = alt[r];
      const g = owner[cr][cc];

      const neighborRegions: number[] = [];
      for (const [dr, dc] of DIRS) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
        const h = owner[nr][nc];
        if (h !== g) neighborRegions.push(h);
      }
      shuffle(neighborRegions, rng);

      for (const h of neighborRegions) {
        owner[cr][cc] = h; // déplacement tentatif
        if (isRegionContiguous(owner, n, g)) {
          moved = true;
          break;
        }
        owner[cr][cc] = g; // annuler
      }
      if (moved) break;
    }

    if (!moved) return false; // bloqué → re-découpage
  }

  return findSolutions(owner, n, 2).length === 1;
}

/** Construit le GameState prêt à jouer à partir de la solution et du découpage. */
function buildGameState(n: number, sol: number[], owner: number[][]): GameState {
  const regions: ColoredRegion[] = [];
  for (let id = 0; id < n; id++) {
    regions.push({
      id,
      color: REGION_COLORS[id % REGION_COLORS.length],
      cells: [],
      hasQueen: false,
      queenPosition: { row: id, col: sol[id] },
    });
  }

  const board: GameCell[][] = Array.from({ length: n }, () =>
    new Array<GameCell>(n)
  );

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const id = owner[row][col];
      regions[id].cells.push({ row, col });
      board[row][col] = {
        row,
        col,
        regionId: id,
        regionColor: REGION_COLORS[id % REGION_COLORS.length],
        state: "empty",
        isHighlighted: false,
        isConflict: false,
      };
    }
  }

  return {
    board,
    regions,
    gridSize: n,
    queensPlaced: 0,
    queensRequired: n,
    isCompleted: false,
    moveCount: 0,
    solution: sol.map((col, row) => ({ row, col })),
  };
}

const clampSize = (size: number): number =>
  Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.floor(size)));

const MAX_ATTEMPTS = 400;

/**
 * Cherche un découpage à solution unique. S'arrête si `deadline` (timestamp
 * `performance.now()`) est dépassée → renvoie null pour signaler un repli à l'appelant.
 */
function attemptUnique(
  n: number,
  rng: Rng,
  deadline?: number
): { sol: number[]; owner: number[][] } | null {
  let checkCounter = 0;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Vérifier le budget toutes les quelques tentatives (performance.now() n'est pas gratuit)
    if (deadline !== undefined && (checkCounter++ & 3) === 0 && performance.now() > deadline) {
      return null;
    }

    let sol: number[] | null = null;
    for (let k = 0; k < 60 && !sol; k++) sol = randomSolution(n, rng);
    if (!sol) continue;

    const owner = partitionRegions(n, sol, rng);
    if (repairToUnique(owner, n, sol, rng)) {
      return { sol, owner };
    }
  }
  return null;
}

/**
 * Génère un niveau Queens à solution unique, prêt à jouer.
 * Renvoie toujours un niveau (repli soluble en cas d'échec extrêmement improbable).
 * @param gridSize taille de grille (bornée à 5..12)
 * @param seed graine optionnelle pour reproduire exactement un niveau (debug/tests)
 */
export function generateLevel(gridSize: number, seed?: number): GameState {
  const n = clampSize(gridSize);
  const rng = mulberry32(seed ?? (Math.random() * 0x100000000) >>> 0);

  const res = attemptUnique(n, rng);
  if (res) return buildGameState(n, res.sol, res.owner);

  // Ultime secours (ne devrait jamais arriver) : un découpage soluble, base valide.
  const fallbackSol =
    (function () {
      for (let k = 0; k < 200; k++) {
        const s = randomSolution(n, rng);
        if (s) return s;
      }
      return Array.from({ length: n }, (_, r) => (r * 2 + 1) % n);
    })();
  const owner = partitionRegions(n, fallbackSol, rng);
  return buildGameState(n, fallbackSol, owner);
}

/**
 * Génère un niveau unique dans un budget de temps donné.
 * Renvoie null si l'unicité n'a pas pu être atteinte à temps → l'appelant se replie
 * (ex. chargement Firebase). Utilisé par le Web Worker pour les grandes grilles.
 */
export function generateLevelWithinBudget(
  gridSize: number,
  timeBudgetMs: number,
  seed?: number
): GameState | null {
  const n = clampSize(gridSize);
  const rng = mulberry32(seed ?? (Math.random() * 0x100000000) >>> 0);
  const res = attemptUnique(n, rng, performance.now() + timeBudgetMs);
  return res ? buildGameState(n, res.sol, res.owner) : null;
}

// ---------------------------------------------------------------------------
// Outils de test (utilisés par scripts/validate-generator.ts). Non importés par l'app.
// ---------------------------------------------------------------------------

export const __test = {
  findSolutions,
  isRegionContiguous,
  randomSolution,
  partitionRegions,
  mulberry32,
};
