import React, { useState, useCallback } from 'react';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { useGameLogic } from '../hooks/useGameLogic';
import { generateGameLevel, GenerationProgress } from '../utils/levelGenerator';
import { Crown } from 'lucide-react';
import { Timer } from './Timer';

export const Game: React.FC = () => {
  const {
    gameState,
    handleCellClick,
    resetGame,
    newGame: originalNewGame,
    gameTime
  } = useGameLogic(6);

  // États de génération
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [cancelGeneration, setCancelGeneration] = useState<(() => void) | null>(null);

  // Key pour forcer l'animation - se déclenche IMMÉDIATEMENT
  const [boardAnimationKey, setBoardAnimationKey] = useState(0);

  // Fonction pour changer la taille de grille avec animation immédiate
  const handleGridSizeChange = useCallback((newSize: number) => {
    // ✅ ANIMATION IMMÉDIATE : Changer la taille tout de suite
    originalNewGame(newSize);
    setBoardAnimationKey(prev => prev + 1); // Lance l'animation en spirale

    // Puis lancer la génération en arrière-plan
    generateNewGameAsync(newSize);
  }, [originalNewGame]);

  // Génération asynchrone qui n'affecte pas l'animation
  const generateNewGameAsync = useCallback(async (gridSize?: number) => {
    setIsGenerating(true);
    setGenerationProgress(null);

    // Contrôle d'annulation
    let isCancelled = false;
    setCancelGeneration(() => () => {
      isCancelled = true;
      setIsGenerating(false);
    });

    try {
      // Génération en arrière-plan pendant que l'animation tourne
      await generateGameLevel(
        gridSize || gameState.gridSize,
        'normal',
        (progress) => {
          if (!isCancelled) {
            setGenerationProgress(progress);
          }
        }
      );

      if (isCancelled) return;

      // Une fois terminé, remplacer par le niveau généré
      originalNewGame(gridSize);
      setBoardAnimationKey(prev => prev + 1); // Nouvelle animation avec le vrai niveau

    } catch (error) {
      if (!isCancelled) {
        console.error('Erreur génération:', error);
        // Le niveau simple est déjà en place, pas besoin de changer
      }
    } finally {
      if (!isCancelled) {
        setIsGenerating(false);
      }
    }

    setCancelGeneration(null);
  }, [gameState.gridSize, originalNewGame]);

  // Nouveau jeu normal
  const handleNewGame = useCallback(() => {
    generateNewGameAsync(gameState.gridSize);
  }, [generateNewGameAsync, gameState.gridSize]);

  // Reset avec annulation si besoin
  const handleResetGame = useCallback(() => {
    if (isGenerating && cancelGeneration) {
      cancelGeneration();
    } else {
      resetGame();
    }
  }, [resetGame, isGenerating, cancelGeneration]);

  // Déterminer si le jeu est bloqué
  const isGameBlocked = false; // Ne jamais bloquer l'animation !
  const showVictoryAnimation = !isGenerating && gameState.isCompleted;

  return (
    <>
      <div className="game">
        <div className="game-container">
          {/* Timer */}
          <Timer gameTime={gameTime} isCompleted={gameState.isCompleted}/>
          {/* Plateau - animation TOUJOURS active */}
          <div className="game-board-section">
            <GameBoard
              gameState={gameState}
              onCellClick={handleCellClick}
              showVictoryAnimation={showVictoryAnimation}
              isGameBlocked={isGameBlocked} // Jamais bloqué
              key={boardAnimationKey} // Relance l'animation à chaque changement
            />

          </div>

          {/* Contrôles */}
          <div className="game-controls-section">
            <GameControls
              gameState={gameState}
              gameTime={0}
              onResetGame={handleResetGame}
              onNewGame={handleNewGame}
              onGridSizeChange={handleGridSizeChange} // Animation immédiate
            />
          </div>
        </div>
      </div>

      {/* Notification discrète pendant la génération (pas d'overlay bloquant) */}
      {isGenerating && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-blue-600 animate-pulse flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">
                  Génération en cours
                </div>
                <div className="text-gray-600 text-xs mt-1">
                  Optimisation du puzzle...
                </div>
                {generationProgress && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {generationProgress.attempts} tentatives
                    </div>
                  </div>
                )}
              </div>
              {cancelGeneration && (
                <button
                  onClick={cancelGeneration}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};