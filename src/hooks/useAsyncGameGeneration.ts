import { useState, useCallback, useRef } from 'react';
import { GameState } from '../types/game';
import { generateGameLevel, GenerationProgress } from '../utils/levelGenerator';

export type GenerationState = 'idle' | 'generating' | 'loading' | 'ready' | 'error';

export interface UseAsyncGameGenerationReturn {
  // État de génération
  generationState: GenerationState;
  generationProgress: GenerationProgress | null;
  errorMessage: string | null;

  // Fonctions de contrôle
  generateLevel: (gridSize: number, complexity?: 'simple' | 'normal' | 'complex') => Promise<GameState>;
  cancelGeneration: () => void;

  // État helper
  isGenerating: boolean;
  canCancel: boolean;
}

export function useAsyncGameGeneration(): UseAsyncGameGenerationReturn {
  const [generationState, setGenerationState] = useState<GenerationState>('ready');
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cancelRef = useRef<(() => void) | null>(null);
  const isCancelledRef = useRef(false);

  const generateLevel = useCallback(async (
    gridSize: number,
    complexity: 'simple' | 'normal' | 'complex' = 'normal'
  ): Promise<GameState> => {
    // Reset des états
    setGenerationState('generating');
    setGenerationProgress(null);
    setErrorMessage(null);
    isCancelledRef.current = false;

    // Configuration de l'annulation
    const cancelPromise = new Promise<never>((_, reject) => {
      cancelRef.current = () => {
        isCancelledRef.current = true;
        reject(new Error('Generation cancelled'));
      };
    });

    try {
      // Course entre génération et annulation
      const generationPromise = generateGameLevel(
        gridSize,
        complexity,
        (progress) => {
          if (!isCancelledRef.current) {
            setGenerationProgress(progress);
          }
        }
      );

      const result = await Promise.race([generationPromise, cancelPromise]);

      if (isCancelledRef.current) {
        throw new Error('Generation cancelled');
      }

      // Transition vers le chargement
      setGenerationState('loading');

      // Simulation du chargement du plateau (optionnel)
      await new Promise(resolve => setTimeout(resolve, 500));

      if (isCancelledRef.current) {
        throw new Error('Generation cancelled');
      }

      setGenerationState('ready');
      return result;

    } catch (error) {
      if (isCancelledRef.current) {
        setGenerationState('ready');
        throw error;
      }

      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      setErrorMessage(errorMsg);
      setGenerationState('error');

      // Auto-retry après erreur (optionnel)
      setTimeout(() => {
        if (!isCancelledRef.current) {
          setGenerationState('ready');
          setErrorMessage(null);
        }
      }, 3000);

      throw error;
    } finally {
      cancelRef.current = null;
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
    }
  }, []);

  return {
    generationState,
    generationProgress,
    errorMessage,
    generateLevel,
    cancelGeneration,
    isGenerating: generationState === 'generating' || generationState === 'loading',
    canCancel: generationState === 'generating' && !!cancelRef.current,
  };
}