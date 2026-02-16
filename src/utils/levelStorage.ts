import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { get, getDatabase, ref, push, query, orderByChild, limitToFirst } from "firebase/database";
import { REGION_COLORS } from "../constants";
import { StoredLevel, GameState, LeaderboardEntry, LeaderboardData } from "../types/game";

class LevelStorage {
  private db: any = null;
  private auth: any = null;
  private isAvailable: boolean = false;
  private isAuthenticated: boolean = false;
  private authPromise: Promise<void> | null = null;

  // Cache pour éviter les requêtes répétées
  private leaderboardCache: Map<number, { data: LeaderboardData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 secondes

  // Cache pour les statistiques globales
  private statsCache: { totalGames: number; timestamp: number } | null = null;
  private readonly STATS_CACHE_DURATION = 60000; // 1 minute

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
   * Sauvegarde un score dans le leaderboard (par taille de grille)
   * Si le nom existe déjà, met à jour uniquement si le nouveau temps est meilleur
   */
  async saveScore(
    gridSize: number,
    time: number,
    playerName: string
  ): Promise<boolean> {
    if (!this.isAvailable || !this.db || !this.auth?.currentUser) {
      return false;
    }

    try {
      const userId = this.auth.currentUser.uid;
      const leaderboardRef = ref(this.db, `leaderboards/grid_${gridSize}`);

      // Récupérer tous les scores existants pour ce nom
      const snapshot = await get(leaderboardRef);

      let existingEntryKey: string | null = null;
      let existingBestTime: number | null = null;

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const entry = child.val() as LeaderboardEntry;
          if (entry.playerName.toLowerCase() === playerName.toLowerCase()) {
            if (existingBestTime === null || entry.time < existingBestTime) {
              existingBestTime = entry.time;
              existingEntryKey = child.key;
            }
          }
        });
      }

      // Si le joueur existe et que le nouveau temps est moins bon, on ne sauvegarde pas
      if (existingBestTime !== null && time >= existingBestTime) {
        return false;
      }

      const entry: LeaderboardEntry = {
        userId,
        playerName,
        time,
        timestamp: Date.now(),
        gridSize,
      };

      // Si le joueur existe avec un moins bon temps, on met à jour
      if (existingEntryKey) {
        const { set } = await import("firebase/database");
        const entryRef = ref(this.db, `leaderboards/grid_${gridSize}/${existingEntryKey}`);
        await set(entryRef, entry);
        console.log(`[Leaderboard] Score mis à jour pour ${playerName}: ${existingBestTime}s → ${time}s`);
      } else {
        // Sinon on crée une nouvelle entrée
        await push(leaderboardRef, entry);
        console.log(`[Leaderboard] Nouveau score pour ${playerName}: ${time}s`);
      }

      // Invalider le cache après sauvegarde
      this.invalidateLeaderboardCache(gridSize);

      return true;
    } catch (error) {
      console.error("Erreur sauvegarde score:", error);
      return false;
    }
  }

  /**
   * Récupère le top 10 des scores pour une taille de grille (avec cache)
   */
  async getLeaderboard(gridSize: number): Promise<LeaderboardData> {
    if (!this.isAvailable || !this.db) {
      return { entries: [] };
    }

    // Vérifier le cache
    const cached = this.leaderboardCache.get(gridSize);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`[Cache] Leaderboard ${gridSize}x${gridSize} depuis cache`);
      return cached.data;
    }

    try {
      console.log(`[Firebase] Chargement leaderboard ${gridSize}x${gridSize}`);
      const leaderboardRef = ref(this.db, `leaderboards/grid_${gridSize}`);
      const topQuery = query(leaderboardRef, orderByChild("time"), limitToFirst(3));
      const snapshot = await get(topQuery);

      if (!snapshot.exists()) {
        const emptyData = { entries: [] };
        this.leaderboardCache.set(gridSize, { data: emptyData, timestamp: now });
        return emptyData;
      }

      const entries: LeaderboardEntry[] = [];
      snapshot.forEach((child) => {
        entries.push(child.val() as LeaderboardEntry);
      });

      // Trier par temps (croissant)
      entries.sort((a, b) => a.time - b.time);

      // Trouver le meilleur score de l'utilisateur actuel
      let userBest: LeaderboardEntry | undefined;
      if (this.auth?.currentUser) {
        const userId = this.auth.currentUser.uid;
        userBest = entries.find((e) => e.userId === userId);
      }

      const result = { entries: entries.slice(0, 3), userBest };

      // Mettre en cache
      this.leaderboardCache.set(gridSize, { data: result, timestamp: now });

      return result;
    } catch (error) {
      console.error("Erreur récupération leaderboard:", error);
      return { entries: [] };
    }
  }

  /**
   * Invalide le cache du leaderboard pour une taille de grille
   */
  invalidateLeaderboardCache(gridSize: number): void {
    this.leaderboardCache.delete(gridSize);
    console.log(`[Cache] Invalidé pour ${gridSize}x${gridSize}`);
  }

  /**
   * Vérifie si un temps peut entrer dans le top 3
   */
  async canEnterLeaderboard(gridSize: number, time: number, playerName: string): Promise<boolean> {
    if (!this.isAvailable || !this.db) {
      return false;
    }

    try {
      const leaderboardRef = ref(this.db, `leaderboards/grid_${gridSize}`);
      const snapshot = await get(leaderboardRef);

      if (!snapshot.exists()) {
        // Pas de scores, peut entrer
        return true;
      }

      const entries: LeaderboardEntry[] = [];
      let playerBestTime: number | null = null;

      snapshot.forEach((child) => {
        const entry = child.val() as LeaderboardEntry;
        entries.push(entry);

        // Trouver le meilleur temps du joueur
        if (entry.playerName.toLowerCase() === playerName.toLowerCase()) {
          if (playerBestTime === null || entry.time < playerBestTime) {
            playerBestTime = entry.time;
          }
        }
      });

      // Si le joueur existe déjà, vérifier si le nouveau temps est meilleur
      if (playerBestTime !== null) {
        return time < playerBestTime;
      }

      // Sinon, vérifier si on peut entrer dans le top 3
      entries.sort((a, b) => a.time - b.time);

      if (entries.length < 3) {
        // Moins de 3 entrées, peut entrer
        return true;
      }

      // Vérifier si le temps est meilleur que le 3ème
      const thirdPlace = entries[2];
      return time < thirdPlace.time;
    } catch (error) {
      console.error("Erreur vérification leaderboard:", error);
      return false;
    }
  }

  /**
   * Récupère le nombre total de parties jouées
   */
  async getTotalGamesPlayed(): Promise<number> {
    if (!this.isAvailable || !this.db) {
      return 0;
    }

    // Vérifier le cache
    const now = Date.now();
    if (this.statsCache && (now - this.statsCache.timestamp) < this.STATS_CACHE_DURATION) {
      console.log(`[Cache] Stats depuis cache: ${this.statsCache.totalGames} parties`);
      return this.statsCache.totalGames;
    }

    try {
      console.log(`[Firebase] Chargement stats globales`);
      const statsRef = ref(this.db, "stats/total_games");
      const snapshot = await get(statsRef);

      const totalGames = snapshot.exists() ? (snapshot.val() as number) : 0;

      // Mettre en cache
      this.statsCache = { totalGames, timestamp: now };

      return totalGames;
    } catch (error) {
      console.error("Erreur récupération stats:", error);
      return 0;
    }
  }

  /**
   * Incrémente le compteur de parties jouées
   */
  async incrementGamesPlayed(): Promise<void> {
    if (!this.isAvailable || !this.db) {
      return;
    }

    try {
      const { runTransaction } = await import("firebase/database");
      const statsRef = ref(this.db, "stats/total_games");

      await runTransaction(statsRef, (currentValue) => {
        return (currentValue || 0) + 1;
      });

      // Invalider le cache
      this.statsCache = null;
      console.log(`[Stats] Partie incrémentée`);
    } catch (error) {
      console.error("Erreur incrémentation stats:", error);
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
      levelKey: storedLevel.key,
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
