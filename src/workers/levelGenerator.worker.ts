/// <reference lib="webworker" />
/**
 * Web Worker de génération de niveaux : exécute le générateur hors du thread principal
 * pour que l'UI ne gèle jamais, même sur les grandes grilles (11-12) qui peuvent
 * demander plusieurs centaines de ms. Renvoie `level: null` si le budget est dépassé
 * → le thread principal se replie sur Firebase.
 */
import { generateLevelWithinBudget } from "../utils/levelGenerator";
import { GameState } from "../types/game";

export interface GenerateRequest {
  requestId: number;
  gridSize: number;
  timeBudgetMs: number;
  seed?: number;
}

export interface GenerateResponse {
  requestId: number;
  level: GameState | null;
}

self.onmessage = (e: MessageEvent<GenerateRequest>) => {
  const { requestId, gridSize, timeBudgetMs, seed } = e.data;
  let level: GameState | null = null;
  try {
    level = generateLevelWithinBudget(gridSize, timeBudgetMs, seed);
  } catch {
    level = null; // toute erreur → repli côté appelant
  }
  const response: GenerateResponse = { requestId, level };
  (self as unknown as Worker).postMessage(response);
};
