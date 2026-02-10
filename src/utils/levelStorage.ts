import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { get, getDatabase, ref } from "firebase/database";
import { REGION_COLORS } from "../constants";
import { StoredLevel, GameState } from "../types/game";

class LevelStorage {
  private db: any = null;
  private auth: any = null;
  private isAvailable: boolean = false;
  private isAuthenticated: boolean = false;
  private authPromise: Promise<void> | null = null;

  constructor(firebaseConfig: any) {
    try {
      if (!firebaseConfig.databaseURL) {
        throw new Error("Configuration Firebase invalide : databaseURL manquant");
      }

      const app = initializeApp(firebaseConfig);
      this.db = getDatabase(app);
      this.auth = getAuth(app);
      this.isAvailable = true;

      this.authPromise = this.initAuth();
    } catch (error) {
      console.error("Erreur initialisation Firebase:", error);
      this.isAvailable = false;
    }
  }

  private async initAuth(): Promise<void> {
    if (!this.auth) return;

    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          this.isAuthenticated = true;
          resolve();
        } else {
          try {
            await signInAnonymously(this.auth);
          } catch (error) {
            console.error("Erreur authentification anonyme:", error);
            resolve();
          }
        }
      });
    });
  }

  private async waitForAuth(): Promise<boolean> {
    if (!this.isAvailable || !this.authPromise) {
      return false;
    }

    try {
      await this.authPromise;
      return this.isAuthenticated;
    } catch {
      return false;
    }
  }

  /**
   * Récupère le nombre de niveaux disponibles par taille de grille
   */
  async getLevelCounts(): Promise<Record<number, number>> {
    if (!this.isAvailable || !this.db) {
      return {};
    }

    try {
      const levelsRef = ref(this.db, "generated_levels_v1");
      const snapshot = await get(levelsRef);

      if (!snapshot.exists()) {
        return {};
      }

      const allLevels = snapshot.val();
      const counts: Record<number, number> = {};

      for (const level of Object.values(allLevels)) {
        const levelData = level as any;
        const gridSize = levelData.gridSize;
        counts[gridSize] = (counts[gridSize] || 0) + 1;
      }

      return counts;
    } catch (error) {
      console.warn("Erreur récupération compteurs:", error);
      return {};
    }
  }

  /**
   * Récupère un niveau aléatoire depuis Firebase
   */
  async getRandomLevel(
    gridSize: number,
    complexity?: string
  ): Promise<StoredLevel | null> {
    if (!this.isAvailable || !this.db) {
      return null;
    }

    try {
      await this.waitForAuth();

      const levelsRef = ref(this.db, "generated_levels_v1");
      const snapshot = await get(levelsRef);

      if (!snapshot.exists()) {
        return null;
      }

      const allLevels = snapshot.val();
      const matchingLevels: { key: string; data: any }[] = [];

      for (const [key, level] of Object.entries(allLevels)) {
        const levelData = level as any;
        if (levelData.gridSize === gridSize) {
          if (!complexity || levelData.complexity === complexity) {
            matchingLevels.push({ key, data: levelData });
          }
        }
      }

      if (matchingLevels.length === 0) {
        return null;
      }

      const randomLevel =
        matchingLevels[Math.floor(Math.random() * matchingLevels.length)];

      return {
        key: randomLevel.key,
        gridSize: randomLevel.data.gridSize,
        complexity: randomLevel.data.complexity,
        regions: randomLevel.data.regions,
        createdAt: randomLevel.data.createdAt,
      };
    } catch {
      return null;
    }
  }

  /**
   * Convertit un niveau stocké en GameState
   */
  convertToGameState(storedLevel: StoredLevel): GameState {
    const regions = storedLevel.regions.map((storedRegion) => ({
      id: storedRegion.id,
      color: REGION_COLORS[storedRegion.id % REGION_COLORS.length],
      cells: storedRegion.cells,
      hasQueen: false,
      queenPosition: storedRegion.queenPosition,
    }));

    // Pré-construire une Map cellule→région pour O(1) lookup
    const cellToRegion = new Map<string, { id: number; color: string }>();
    for (const region of regions) {
      for (const cell of region.cells) {
        cellToRegion.set(`${cell.row}-${cell.col}`, {
          id: region.id,
          color: region.color,
        });
      }
    }

    const board = Array(storedLevel.gridSize)
      .fill(null)
      .map(() => Array(storedLevel.gridSize).fill(null));

    for (let row = 0; row < storedLevel.gridSize; row++) {
      for (let col = 0; col < storedLevel.gridSize; col++) {
        const regionInfo = cellToRegion.get(`${row}-${col}`);

        board[row][col] = {
          row,
          col,
          regionId: regionInfo?.id ?? 0,
          regionColor: regionInfo?.color ?? REGION_COLORS[0],
          state: "empty",
          isHighlighted: false,
          isConflict: false,
        };
      }
    }

    return {
      board,
      regions,
      gridSize: storedLevel.gridSize,
      queensPlaced: 0,
      queensRequired: storedLevel.gridSize,
      isCompleted: false,
      moveCount: 0,
      solution: regions.map((r) => r.queenPosition),
    };
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const levelStorage = new LevelStorage(firebaseConfig);
