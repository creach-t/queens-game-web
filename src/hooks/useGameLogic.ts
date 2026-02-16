import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState } from '../types/game';
import { updateConflicts, validateCompleteGameState, getPlacedQueens } from '../lib/rules';
import { resetGameBoard } from '../utils/gameUtils';
import { levelStorage } from '../utils/levelStorage';

const EMPTY_GAME_STATE: GameState = {
  board: [],
  regions: [],
  gridSize: 6,
  queensPlaced: 0,
  queensRequired: 6,
  isCompleted: false,
  moveCount: 0,
};

export function useGameLogic(initialGridSize: number = 6) {
  const [gameState, setGameState] = useState<GameState>({
    ...EMPTY_GAME_STATE,
    gridSize: initialGridSize,
    queensRequired: initialGridSize,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer via useRef — indépendant du state du jeu
  const [gameTime, setGameTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setGameTime(0);
  }, [stopTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Démarrer le timer dès que la grille est visible (chargement terminé)
  useEffect(() => {
    if (!isLoading && gameState.board.length > 0 && !gameState.isCompleted) {
      startTimer();
    }
  }, [isLoading, gameState.board.length, gameState.isCompleted, startTimer]);

  // Stop timer on completion (pas de sauvegarde automatique, l'utilisateur doit entrer son nom)
  useEffect(() => {
    if (gameState.isCompleted) {
      stopTimer();
    }
  }, [gameState.isCompleted, stopTimer]);

  // Incrémenter le compteur de victoires à la complétion
  const hasIncrementedVictory = useRef(false);

  useEffect(() => {
    if (gameState.isCompleted && gameState.board.length > 0) {
      // Guard contre StrictMode + éviter double increment
      if (!hasIncrementedVictory.current) {
        hasIncrementedVictory.current = true;
        levelStorage.incrementGamesWon();
      }
    }
  }, [gameState.isCompleted, gameState.board.length]);

  // Reset guard on new level
  useEffect(() => {
    if (!isLoading) {
      hasIncrementedVictory.current = false;
    }
  }, [isLoading]);

  // Chargement d'un niveau depuis Firebase
  const loadLevel = useCallback(async (gridSize: number) => {
    setIsLoading(true);
    setError(null);
    resetTimer();

    try {
      const storedLevel = await levelStorage.getRandomLevel(gridSize);
      if (!storedLevel) {
        setError(`Aucun niveau ${gridSize}x${gridSize} disponible`);
        return;
      }

      const newGameState = levelStorage.convertToGameState(storedLevel);
      setGameState(newGameState);
    } catch (err) {
      setError('Erreur lors du chargement du niveau');
      console.error('Level loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [resetTimer]);

  // Chargement initial
  useEffect(() => {
    loadLevel(initialGridSize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clic sur une cellule — UN SEUL setGameState, validation synchrone
  const handleCellClick = useCallback((row: number, col: number) => {
    if (isLoading) return;

    setGameState(prevState => {
      if (prevState.isCompleted) return prevState;

      // Clone intelligent : seule la cellule cliquée est dupliquée
      const newBoard = prevState.board.map((boardRow, r) =>
        boardRow.map((cell, c) => {
          if (r === row && c === col) return { ...cell };
          return cell;
        })
      );

      const cell = newBoard[row][col];

      // Cycle : empty → marked → queen → empty
      switch (cell.state) {
        case 'empty':
          cell.state = 'marked';
          break;
        case 'marked':
          cell.state = 'queen';
          break;
        case 'queen':
          cell.state = 'empty';
          break;
      }

      // Compter les reines et mettre à jour les régions en une passe
      let queensPlaced = 0;
      const regionIndexMap = new Map<number, number>();
      const newRegions = prevState.regions.map((region, idx) => {
        regionIndexMap.set(region.id, idx);
        return {
          ...region,
          hasQueen: false,
          queenPosition: undefined as { row: number; col: number } | undefined,
        };
      });

      for (let r = 0; r < prevState.gridSize; r++) {
        for (let c = 0; c < prevState.gridSize; c++) {
          if (newBoard[r][c].state === 'queen') {
            queensPlaced++;
            const regionIdx = regionIndexMap.get(newBoard[r][c].regionId);
            if (regionIdx !== undefined) {
              newRegions[regionIdx].hasQueen = true;
              newRegions[regionIdx].queenPosition = { row: r, col: c };
            }
          }
        }
      }

      // Validation synchrone des conflits
      let validatedBoard = newBoard;
      if (queensPlaced > 0) {
        validatedBoard = updateConflicts(newBoard, newRegions);
      } else {
        // Nettoyer les flags de conflit quand il n'y a plus de reines
        validatedBoard = newBoard.map(boardRow =>
          boardRow.map(c => ({
            ...c,
            isConflict: false,
            isInConflictLine: false,
            isInConflictColumn: false,
            isInConflictRegion: false,
            isAroundConflictQueen: false,
          }))
        );
      }

      // Vérification synchrone de la complétion
      let isCompleted = false;
      if (queensPlaced === prevState.gridSize) {
        const queens = getPlacedQueens(validatedBoard);
        const result = validateCompleteGameState(queens, newRegions, prevState.gridSize);
        isCompleted = result.isValid;
      }

      return {
        ...prevState,
        board: validatedBoard,
        regions: newRegions,
        queensPlaced,
        isCompleted,
        moveCount: prevState.moveCount + 1,
      };
    });
  }, [isLoading]);

  // Marquage rapide d'une cellule vide (pour le swipe tactile)
  // Ne fait rien si la cellule n'est pas vide — pas de cycle
  const markCell = useCallback((row: number, col: number) => {
    if (isLoading) return;

    setGameState(prevState => {
      if (prevState.isCompleted) return prevState;
      if (prevState.board[row][col].state !== 'empty') return prevState;

      const newBoard = prevState.board.map((boardRow, r) =>
        boardRow.map((cell, c) => {
          if (r === row && c === col) return { ...cell, state: 'marked' as const };
          return cell;
        })
      );

      return {
        ...prevState,
        board: newBoard,
        moveCount: prevState.moveCount + 1,
      };
    });
  }, [isLoading]);

  // Reset du jeu (même niveau) - le timer continue
  const resetGame = useCallback(() => {
    setGameState(prevState => resetGameBoard(prevState));
    // Le timer continue de tourner, on ne le reset pas
  }, []);

  // Nouveau jeu (charge un nouveau niveau)
  const newGame = useCallback(async (gridSize?: number) => {
    const size = gridSize || gameState.gridSize;
    await loadLevel(size);
  }, [gameState.gridSize, loadLevel]);

  // Changement de taille de grille
  const changeGridSizeOnly = useCallback(async (gridSize: number) => {
    await loadLevel(gridSize);
  }, [loadLevel]);

  // Sauvegarde du score avec nom du joueur
  const saveScore = useCallback(async (playerName: string): Promise<boolean> => {
    if (!gameState.isCompleted) return false;

    return await levelStorage.saveScore(
      gameState.gridSize,
      gameTime,
      playerName
    );
  }, [gameState.isCompleted, gameState.gridSize, gameTime]);

  return {
    gameState,
    handleCellClick,
    markCell,
    resetGame,
    newGame,
    changeGridSizeOnly,
    saveScore,
    gameTime,
    isLoading,
    isGenerating: isLoading,
    error,
  };
}
