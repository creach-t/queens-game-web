// levelPreloader.ts
import { generateGameLevel } from "./levelGenerator";
import { levelStorage } from "./levelStorage";
import { GameState } from "../types/game";

interface PreloadedLevel {
  gameState: GameState;
  isPreGenerated: boolean;
}

class LevelPreloader {
  private preloadedLevels: Map<number, PreloadedLevel> = new Map();
  private generationPromises: Map<number, Promise<void>> = new Map();
  private isGenerating: Map<number, boolean> = new Map();

  /**
   * Obtient un niveau immédiatement (depuis Firebase ou pré-généré)
   * et lance la pré-génération du suivant
   */
  async getInstantLevel(gridSize: number): Promise<GameState> {
    console.log(`📦 Demande niveau ${gridSize}x${gridSize}`);

    // 1. Vérifier si on a un niveau pré-généré
    const preloaded = this.preloadedLevels.get(gridSize);
    if (preloaded) {
      console.log(`⚡ Niveau pré-généré disponible`);
      this.preloadedLevels.delete(gridSize); // Consommer le niveau
      this.startBackgroundGeneration(gridSize); // Générer le suivant
      return preloaded.gameState;
    }

    // 2. Essayer de récupérer depuis Firebase
    try {
      const storedLevel = await levelStorage.getRandomLevel(gridSize);
      if (storedLevel) {
        console.log(`📦 Niveau Firebase récupéré`);
        const gameState = levelStorage.convertToGameState(storedLevel);
        this.startBackgroundGeneration(gridSize); // Générer pour la prochaine fois
        return {
          ...gameState,
          elapsedTime: 0,
          isTimerRunning: false,
        };
      }
    } catch (error) {
      console.warn(`Firebase échec, génération directe...`);
    }

    // 3. Générer directement (bloquant, mais seulement au tout début)
    console.log(`🔧 Génération directe (première fois)`);
    const gameState = await generateGameLevel(gridSize);
    this.startBackgroundGeneration(gridSize); // Préparer le suivant
    return gameState;
  }

  /**
   * Lance la génération en arrière-plan
   */
  private startBackgroundGeneration(gridSize: number): void {
    // Éviter les générations multiples
    if (this.isGenerating.get(gridSize)) {
      console.log(`⚠️ Génération ${gridSize}x${gridSize} déjà en cours`);
      return;
    }

    this.isGenerating.set(gridSize, true);
    console.log(`🔄 Démarrage génération arrière-plan ${gridSize}x${gridSize}`);

    const promise = this.generateAndStoreUnique(gridSize)
      .finally(() => {
        this.isGenerating.set(gridSize, false);
        this.generationPromises.delete(gridSize);
      });

    this.generationPromises.set(gridSize, promise);
  }

  /**
   * Génère des niveaux jusqu'à en trouver un unique
   */
  private async generateAndStoreUnique(gridSize: number): Promise<void> {
    const maxAttempts = 10;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        console.log(`🎲 Génération arrière-plan tentative ${attempt}/${maxAttempts} (${gridSize}x${gridSize})`);

        // Générer un nouveau niveau
        const gameState = await generateGameLevel(gridSize);

        // Essayer de le sauvegarder (retourne false si déjà existant)
        const saved = await levelStorage.saveLevel(
          gridSize,
          "medium",
          gameState.regions
        );

        if (saved) {
          console.log(`✅ Nouveau niveau ${gridSize}x${gridSize} généré et sauvegardé`);
          // Stocker pour usage immédiat la prochaine fois
          this.preloadedLevels.set(gridSize, {
            gameState,
            isPreGenerated: true
          });
          return; // Mission accomplie
        } else {
          console.log(`⚠️ Niveau ${gridSize}x${gridSize} déjà existant, nouvelle tentative...`);
          // Continuer la boucle pour générer un niveau différent
        }

      } catch (error) {
        console.error(`❌ Erreur génération arrière-plan tentative ${attempt}:`, error);

        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.warn(`⚠️ Impossible de générer un niveau unique ${gridSize}x${gridSize} après ${maxAttempts} tentatives`);
  }

  /**
   * Pré-charge des niveaux pour toutes les tailles populaires
   */
  async preloadPopularSizes(): Promise<void> {
    const popularSizes = [6, 8, 10, 12];
    console.log(`🚀 Pré-chargement des tailles populaires: ${popularSizes.join(', ')}`);

    // Lancer en parallèle (sans attendre)
    popularSizes.forEach(size => {
      this.startBackgroundGeneration(size);
    });
  }

  /**
   * Obtient le statut de génération
   */
  getGenerationStatus(): Record<number, boolean> {
    const status: Record<number, boolean> = {};
    for (const [size, isGenerating] of this.isGenerating.entries()) {
      status[size] = isGenerating;
    }
    return status;
  }

  /**
   * Indique si un niveau est disponible immédiatement
   */
  hasPreloadedLevel(gridSize: number): boolean {
    return this.preloadedLevels.has(gridSize);
  }

  /**
   * Annule toutes les générations en cours
   */
  cancelAllGenerations(): void {
    console.log(`🛑 Annulation de toutes les générations`);
    this.isGenerating.clear();
    this.generationPromises.clear();
  }

  /**
   * Nettoie les niveaux pré-chargés (si besoin de mémoire)
   */
  clearPreloadedLevels(): void {
    this.preloadedLevels.clear();
    console.log(`🧹 Niveaux pré-chargés effacés`);
  }
}

// Instance singleton
export const levelPreloader = new LevelPreloader();