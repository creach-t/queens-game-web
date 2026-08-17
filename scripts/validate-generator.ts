/**
 * Validation du générateur client-side.
 * Tire N niveaux par taille de grille et vérifie l'invariant complet :
 *   - solution unique (exactement 1 placement valide)
 *   - solution de base soluble et cohérente
 *   - régions contiguës
 *   - pavage complet (chaque case appartient à exactement une région)
 *   - n régions, 1 reine par région
 * Mesure aussi le temps de génération (worst-case mobile).
 *
 * Lancement :  npx esbuild scripts/validate-generator.ts --bundle --platform=node --format=esm | node -
 */
import { generateLevel, __test } from "../src/utils/levelGenerator";

const SIZES = [5, 6, 7, 8, 9, 10, 11, 12];
// Échantillons adaptés au coût : les grandes grilles sont plus lentes à générer.
const samplesFor = (n: number): number => (n <= 9 ? 300 : n === 10 ? 150 : 50);

type Problem = { size: number; seed: number; reason: string };

function check(size: number, seed: number): string | null {
  const gs = generateLevel(size, seed);
  const n = gs.gridSize;

  if (gs.regions.length !== n) return `nb régions ${gs.regions.length} ≠ ${n}`;

  // Reconstruire owner + vérifier pavage exact
  const owner = Array.from({ length: n }, () => new Array<number>(n).fill(-1));
  let covered = 0;
  for (const region of gs.regions) {
    for (const cell of region.cells) {
      if (owner[cell.row][cell.col] !== -1) return `case ${cell.row}-${cell.col} dans 2 régions`;
      owner[cell.row][cell.col] = region.id;
      covered++;
    }
  }
  if (covered !== n * n) return `pavage incomplet (${covered}/${n * n})`;

  // Contiguïté
  for (let id = 0; id < n; id++) {
    if (!__test.isRegionContiguous(owner, n, id)) return `région ${id} non contiguë`;
  }

  // Unicité (le solveur s'arrête à 2)
  const sols = __test.findSolutions(owner, n, 2);
  if (sols.length === 0) return `insoluble`;
  if (sols.length > 1) return `solution non unique`;

  // La solution renvoyée doit correspondre à l'unique solution trouvée
  const found = sols[0];
  const declared = gs.solution!;
  for (let r = 0; r < n; r++) {
    if (found[r] !== declared[r].col) return `solution déclarée ≠ solution réelle (ligne ${r})`;
  }

  // 1 reine par région dans la solution
  const regionsHit = new Set<number>();
  for (let r = 0; r < n; r++) regionsHit.add(owner[r][found[r]]);
  if (regionsHit.size !== n) return `solution ne couvre pas toutes les régions`;

  return null;
}

console.log(`Validation générateur\n`);
const problems: Problem[] = [];

for (const size of SIZES) {
  const perSize = samplesFor(size);
  const t0 = performance.now();
  let worst = 0;
  let worstSeed = 0;
  for (let i = 0; i < perSize; i++) {
    const seed = size * 1_000_000 + i;
    const g0 = performance.now();
    const reason = check(size, seed);
    const dt = performance.now() - g0;
    if (dt > worst) {
      worst = dt;
      worstSeed = seed;
    }
    if (reason) problems.push({ size, seed, reason });
  }
  const total = performance.now() - t0;
  const avg = total / perSize;
  const fails = problems.filter((p) => p.size === size).length;
  const status = fails === 0 ? "OK  " : "FAIL";
  console.log(
    `${status} ${size}×${size}  ${perSize - fails}/${perSize} valides` +
      `  | moy ${avg.toFixed(2)}ms  worst ${worst.toFixed(1)}ms (seed ${worstSeed})`
  );
}

if (problems.length === 0) {
  console.log("\n✅ TOUS LES NIVEAUX SONT VALIDES (unique + soluble + contigus + pavage complet)");
} else {
  console.log(`\n❌ ${problems.length} problème(s) :`);
  for (const p of problems.slice(0, 20)) {
    console.log(`   ${p.size}×${p.size} seed=${p.seed} → ${p.reason}`);
  }
  process.exitCode = 1;
}
