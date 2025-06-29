// levelStorage.ts
import { initializeApp } from "firebase/app";
import { get, getDatabase, push, ref } from "firebase/database";

interface Position {
  row: number;
  col: number;
}

interface StoredRegion {
  id: number;
  cells: Position[];
  queenPosition: Position;
}

interface StoredLevel {
  key?: string;
  gridSize: number;
  complexity: string;
  regions: StoredRegion[];
  createdAt: number;
}

class LevelStorage {
  private db: any = null;
  private isAvailable: boolean = false;

  constructor(firebaseConfig: any) {
    try {
      // Vérifier que la config contient databaseURL
      if (!firebaseConfig.databaseURL) {
        //console.warn('Firebase: databaseURL manquante, stockage désactivé');
        return;
      }

      const app = initializeApp(firebaseConfig);
      this.db = getDatabase(app);
      this.isAvailable = true;
      //console.log('✅ Firebase Database initialisé');
    } catch (error) {
      //console.warn('Firebase non disponible:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Sauvegarde un niveau (ne fait jamais d'erreur)
   */
  async saveLevel(
    gridSize: number,
    complexity: string,
    regions: any[]
  ): Promise<boolean> {
    if (!this.isAvailable || !this.db) {
      return false;
    }

    try {
      const storedRegions: StoredRegion[] = regions.map((region) => ({
        id: region.id,
        cells: region.cells,
        queenPosition: region.queenPosition,
      }));

      const levelsRef = ref(this.db, "generated_levels");
      await push(levelsRef, {
        gridSize: gridSize,
        complexity: complexity,
        regions: storedRegions,
        createdAt: Date.now(),
      });

      //console.log(`✅ Niveau ${gridSize}x${gridSize} sauvegardé`);
      return true;
    } catch (error) {
      //console.warn('Erreur sauvegarde (ignorée):', error);
      return false;
    }
  }

  /**
   * Récupère un niveau (retourne null en cas d'erreur)
   */
  async getRandomLevel(
    gridSize: number,
    complexity?: string
  ): Promise<StoredLevel | null> {
    if (!this.isAvailable || !this.db) {
      return null;
    }

    try {
      const levelsRef = ref(this.db, "generated_levels");
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

      //console.log(`📦 Niveau récupéré depuis Firebase (${matchingLevels.length} disponibles)`);

      return {
        key: randomLevel.key,
        gridSize: randomLevel.data.gridSize,
        complexity: randomLevel.data.complexity,
        regions: randomLevel.data.regions,
        createdAt: randomLevel.data.createdAt,
      };
    } catch (error) {
      //console.warn('Erreur récupération (ignorée):', error);
      return null;
    }
  }

  /**
   * Convertit un niveau stocké en GameState
   */
  convertToGameState(storedLevel: StoredLevel): any {
    const REGION_COLORS = [
      "#26A69A",
      "#BA68C8",
      "#81C784",
      "#FFB74D",
      "#F06292",
      "#D4E157",
      "#4DD0E1",
      "#fa6464",
      "#b0a997",
      "#615f87",
      "#995d36",
      "#02f760",
    ];

    const regions = storedLevel.regions.map((storedRegion) => ({
      id: storedRegion.id,
      color: REGION_COLORS[storedRegion.id % REGION_COLORS.length],
      cells: storedRegion.cells,
      hasQueen: true,
      queenPosition: storedRegion.queenPosition,
    }));

    const board = Array(storedLevel.gridSize)
      .fill(null)
      .map(() => Array(storedLevel.gridSize).fill(null));

    for (let row = 0; row < storedLevel.gridSize; row++) {
      for (let col = 0; col < storedLevel.gridSize; col++) {
        const region = regions.find((r) =>
          r.cells.some((cell) => cell.row === row && cell.col === col)
        );

        board[row][col] = {
          row,
          col,
          regionId: region?.id || 0,
          regionColor: region?.color || REGION_COLORS[0],
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

// Configuration Firebase - remplace par tes vraies valeurs
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Instance exportée (safe)
export const levelStorage = new LevelStorage(firebaseConfig);
