/**
 * Client du Web Worker de génération. Gère un worker unique réutilisé, l'anti-course
 * entre requêtes rapides (requestId), et un garde-fou de timeout côté thread principal.
 *
 * `requestClientLevel` renvoie un GameState si la génération client a réussi dans le
 * budget, ou `null` si l'appelant doit se replier (ex. Firebase).
 */
import { GameState } from "../types/game";
import type { GenerateRequest, GenerateResponse } from "../workers/levelGenerator.worker";

/** Budget par défaut : ≤10 réussit en quelques ms, 11-12 souvent < 1,2 s, sinon repli. */
export const DEFAULT_BUDGET_MS = 1200;

let worker: Worker | null = null;
let nextRequestId = 1;
const pending = new Map<number, (level: GameState | null) => void>();

function getWorker(): Worker | null {
  if (typeof Worker === "undefined") return null; // environnement sans Worker
  if (worker) return worker;
  try {
    worker = new Worker(
      new URL("../workers/levelGenerator.worker.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (e: MessageEvent<GenerateResponse>) => {
      const { requestId, level } = e.data;
      const resolve = pending.get(requestId);
      if (resolve) {
        pending.delete(requestId);
        resolve(level);
      }
    };
    worker.onerror = () => {
      // Worker cassé : rejeter toutes les requêtes en attente (repli) et le recréer au besoin.
      for (const resolve of pending.values()) resolve(null);
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

export function requestClientLevel(
  gridSize: number,
  budgetMs: number = DEFAULT_BUDGET_MS
): Promise<GameState | null> {
  const w = getWorker();

  // Repli synchrone si les Workers sont indisponibles (tests/SSR) : import dynamique
  // pour ne pas charger le générateur dans le worker deux fois côté prod.
  if (!w) {
    return import("./levelGenerator").then(({ generateLevelWithinBudget }) =>
      generateLevelWithinBudget(gridSize, budgetMs)
    );
  }

  const requestId = nextRequestId++;
  const request: GenerateRequest = { requestId, gridSize, timeBudgetMs: budgetMs };

  return new Promise((resolve) => {
    // Garde-fou : si le worker ne répond pas (hang), on se replie après budget + marge.
    const guard = setTimeout(() => {
      if (pending.delete(requestId)) resolve(null);
    }, budgetMs + 500);

    pending.set(requestId, (level) => {
      clearTimeout(guard);
      resolve(level);
    });

    w.postMessage(request);
  });
}
