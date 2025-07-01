// levelStorage.ts
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { get, getDatabase, push, ref, set } from "firebase/database";

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
  private auth: any = null;
  private isAvailable: boolean = false;
  private isAuthenticated: boolean = false;
  private authPromise: Promise<void> | null = null;

  constructor(firebaseConfig: any) {
    try {
      // Vérifier que la config contient databaseURL
      if (!firebaseConfig.databaseURL) {
        //console.warn('Firebase: databaseURL manquante, stockage désactivé');
        return;
      }

      const app = initializeApp(firebaseConfig);
      this.db = getDatabase(app);
      this.auth = getAuth(app);
      this.isAvailable = true;

      // Authentification automatique
      this.authPromise = this.initAuth();

      console.log("✅ Firebase Database initialisé");
    } catch (error) {
      console.warn("Firebase non disponible:", error);
      this.isAvailable = false;
    }
  }

  /**
   * Initialise l'authentification anonyme
   */
  private async initAuth(): Promise<void> {
    if (!this.auth) return;

    return new Promise((resolve) => {
      // Écouter les changements d'auth
      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          this.isAuthenticated = true;
          console.log("✅ Utilisateur authentifié:", user.uid);
          resolve();
        } else {
          // Pas d'utilisateur, s'authentifier anonymement
          try {
            await signInAnonymously(this.auth);
            console.log("✅ Authentification anonyme réussie");
          } catch (error) {
            console.warn("Erreur authentification anonyme:", error);
            resolve(); // Continue même en cas d'erreur
          }
        }
      });
    });
  }

  /**
   * Attend que l'authentification soit prête
   */
  private async waitForAuth(): Promise<boolean> {
    if (!this.isAvailable || !this.authPromise) {
      return false;
    }

    try {
      await this.authPromise;
      return this.isAuthenticated;
    } catch (error) {
      console.warn("Erreur attente auth:", error);
      return false;
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
    const authReady = await this.waitForAuth();
    if (!authReady) {
      console.warn("❌ Authentification non prête, sauvegarde annulée");
      return false;
    }

    try {
      const storedRegions: StoredRegion[] = regions.map((region) => ({
        id: region.id,
        cells: region.cells,
        queenPosition: region.queenPosition,
      }));

      const hash = await this.computeLevelHash(gridSize, storedRegions);
      const indexRef = ref(this.db, "generated_levels_index/" + hash);
      const existing = await get(indexRef);

      if (existing.exists()) {
        console.log("⚠️ Niveau déjà existant, sauvegarde ignorée");
        return false;
      }

      const levelsRef = ref(this.db, "generated_levels_v2");
      const newLevelRef = await push(levelsRef, {
        gridSize,
        complexity,
        regions: storedRegions,
        createdAt: Date.now(),
        userId: this.auth?.currentUser?.uid,
      });

      await set(indexRef, newLevelRef.key);
      console.log(`✅ Niveau ${gridSize}x${gridSize} sauvegardé`);
      return true;
    } catch (error) {
      console.error("❌ Erreur sauvegarde niveau:", error);
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
      const levelsRef = ref(this.db, "generated_levels_v2");
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

  private async computeLevelHash(
    gridSize: number,
    regions: StoredRegion[]
  ): Promise<string> {
    const normalized = {
      gridSize,
      regions: regions.map((r) => ({
        id: r.id,
        // Trie les cellules pour éviter que l'ordre influe sur le hash
        cells: r.cells
          .map((c) => ({ row: c.row, col: c.col }))
          .sort((a, b) => a.row - b.row || a.col - b.col),
        queenPosition: r.queenPosition,
      })),
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(normalized));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Récupère un niveau (retourne null en cas d'erreur)
   */
  async getRandomLevel(
    gridSize: number,
    complexity?: string
  ): Promise<StoredLevel | null> {
    // Pas besoin d'auth pour lire (read: true dans les règles)
    if (!this.isAvailable || !this.db) {
      return null;
    }

    try {
      const levelsRef = ref(this.db, "generated_levels_v2");
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

      console.log(
        `📦 Niveau récupéré depuis Firebase (${matchingLevels.length} disponibles)`
      );

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
   * Vérifie si l'utilisateur est authentifié
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Obtient l'ID de l'utilisateur actuel
   */
  getCurrentUserId(): string | null {
    return this.auth?.currentUser?.uid || null;
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
