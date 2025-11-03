import { useCallback, useEffect, useRef, useState } from "react";
import { validateQueenPlacement } from "../lib/rules";
import {
  CellClickInfo,
  ColoredRegion,
  GameCell,
  GameState,
} from "../types/game";
import { updateConflicts } from "../lib/rules";
import { generateGameLevel, resetGameBoard } from "../utils/levelGenerator";

export function useGameLogic(initialGridSize: number = 7) {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: [],
    regions: [],
    gridSize: initialGridSize,
    queensPlaced: 0,
    queensRequired: initialGridSize,
    isCompleted: false,
    moveCount: 0,
    elapsedTime: 0,
    isTimerRunning: false,
    isHighlighted: false,
  }));

  const [timerStarted, setTimerStarted] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [isGameBlocked, setIsGameBlocked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const initLevel = async () => {
      if (isGenerating) return;

      setIsGenerating(true);
      setIsGameBlocked(true);

      try {
        const newLevel = await generateGameLevel(initialGridSize);
        setGameState(newLevel);
        setTimerStarted(true);
        setGameTime(0);
      } catch (error) {
        console.error("Erreur génération niveau:", error);
        // État minimal
        const fallbackState: GameState = {
          board: Array(initialGridSize)
            .fill(null)
            .map((_, row) =>
              Array(initialGridSize)
                .fill(null)
                .map((_, col) => ({
                  row,
                  col,
                  regionId: 0,
                  regionColor: "#64B5F6",
                  state: "empty" as const,
                  isHighlighted: false,
                  isConflict: false,
                  isInConflictLine: false,
                  isInConflictColumn: false,
                  isInConflictRegion: false,
                  isAroundConflictQueen: false,
                }))
            ),
          regions: [
            {
              id: 0,
              color: "#64B5F6",
              cells: Array(initialGridSize * initialGridSize)
                .fill(null)
                .map((_, i) => ({
                  row: Math.floor(i / initialGridSize),
                  col: i % initialGridSize,
                })),
              hasQueen: false,
            },
          ],
          gridSize: initialGridSize,
          queensPlaced: 0,
          queensRequired: initialGridSize,
          isCompleted: false,
          moveCount: 0,
          elapsedTime: 0,
          isTimerRunning: false,
        };
        setGameState(fallbackState);
        setTimerStarted(true);
        setGameTime(0);
      } finally {
        setIsGenerating(false);
        setIsGameBlocked(false);
      }
    };

    initLevel();
  }, [initialGridSize]);

  // Map pour tracker les clics par cellule individuelle
  const cellClicksRef = useRef<Map<string, CellClickInfo>>(new Map());

  // Timer automatique
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (
      timerStarted &&
      !gameState.isCompleted &&
      !showVictoryAnimation &&
      gameState.board.length > 0
    ) {
      interval = setInterval(() => {
        setGameTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    timerStarted,
    gameState.isCompleted,
    showVictoryAnimation,
    gameState.board.length,
  ]);

  // Animation de victoire et blocage du jeu
  useEffect(() => {
    if (gameState.isCompleted && !showVictoryAnimation) {
      setIsGameBlocked(true);
      setShowVictoryAnimation(true);

      // Animation des reines en jaune pendant 1.5 secondes
      setTimeout(() => {
        setShowVictoryAnimation(false);
      }, 1500);
    }
  }, [gameState.isCompleted, showVictoryAnimation]);

  const changeGridSizeOnly = useCallback(async (gridSize: number) => {
    if (isGenerating) return;

    // Nettoyer les timeouts actifs
    cellClicksRef.current.forEach((clickInfo) => {
      if (clickInfo.timeout) {
        clearTimeout(clickInfo.timeout);
      }
    });
    cellClicksRef.current.clear();

    setIsGenerating(true);
    setIsGameBlocked(true);

    await new Promise((resolve) => setTimeout(resolve, 10));

    try {
      const newLevel = await generateGameLevel(gridSize);
      setGameState(newLevel);
      setGameTime(0);
      setTimerStarted(true);
      setShowVictoryAnimation(false);
    } catch (error) {
      console.error("Erreur génération nouveau niveau:", error);
    } finally {
      setIsGenerating(false);
      setIsGameBlocked(false);
    }
  }, []);

  // Vérifier si le puzzle est résolu
  const checkPuzzleCompletion = useCallback(
    (board: GameCell[][], regions: ColoredRegion[]) => {
      const gridSize = board.length;

      const queensCount = board
        .flat()
        .filter((cell) => cell.state === "queen").length;

      // Il faut exactement gridSize reines
      if (queensCount !== gridSize) {
        return false;
      }

      // Vérifier qu'il y a exactement une reine par ligne
      for (let row = 0; row < gridSize; row++) {
        const queensInRow = board[row].filter(
          (cell) => cell.state === "queen"
        ).length;
        if (queensInRow !== 1) return false;
      }

      // Vérifier qu'il y a exactement une reine par colonne
      for (let col = 0; col < gridSize; col++) {
        const queensInCol = board
          .map((row) => row[col])
          .filter((cell) => cell.state === "queen").length;
        if (queensInCol !== 1) return false;
      }

      // Vérifier qu'il y a exactement une reine par région
      for (const region of regions) {
        if (!region.hasQueen) return false;
      }

      // Vérifier qu'aucune reine ne se touche
      const queens = board.flat().filter((cell) => cell.state === "queen");
      for (let i = 0; i < queens.length; i++) {
        for (let j = i + 1; j < queens.length; j++) {
          const rowDiff = Math.abs(queens[i].row - queens[j].row);
          const colDiff = Math.abs(queens[i].col - queens[j].col);
          if (rowDiff <= 1 && colDiff <= 1) {
            return false;
          }
        }
      }

      return true;
    },
    []
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (
        isGameBlocked ||
        showVictoryAnimation ||
        gameState.board.length === 0 ||
        isGenerating
      ) {
        return;
      }

      const now = Date.now();
      const cellKey = `${row}-${col}`;
      const cellClickInfo = cellClicksRef.current.get(cellKey);

      if (cellClickInfo?.timeout) {
        clearTimeout(cellClickInfo.timeout);
      }

      if (cellClickInfo && now - cellClickInfo.lastClickTime < 250) {
        // Double-clic détecté - annuler l'action précédente et faire le double-clic
        handleDoubleClick(row, col);
        cellClicksRef.current.delete(cellKey);
      } else {
        // ✅ NOUVEAU: Exécution immédiate du clic simple
        handleSingleClick(row, col);

        // Enregistrer le clic pour détecter un éventuel double-clic
        const timeout = setTimeout(() => {
          cellClicksRef.current.delete(cellKey);
        }, 250);

        cellClicksRef.current.set(cellKey, {
          lastClickTime: now,
          timeout: timeout,
        });
      }
    },
    [isGameBlocked, showVictoryAnimation, gameState.board.length, isGenerating]
  );

  const handleSingleClick = useCallback((row: number, col: number) => {
    setGameState((prevState) => {
      const newBoard = prevState.board.map((boardRow) =>
        boardRow.map((cell) => ({
          ...cell,
          isConflict: false,
          isInConflictLine: false,
          isInConflictColumn: false,
          isInConflictRegion: false,
          isAroundConflictQueen: false,
        }))
      );
      const cell = newBoard[row][col];

      if (cell.state === "empty") {
        cell.state = "marked";
      } else if (cell.state === "marked") {
        cell.state = "empty";
      }

      const boardWithConflicts = updateConflicts(newBoard, prevState.regions);

      return {
        ...prevState,
        board: boardWithConflicts,
        moveCount: prevState.moveCount + 1,
      };
    });
  }, []);

  // Gérer le double clic (reine) avec validation améliorée
  const handleDoubleClick = useCallback(
    (row: number, col: number) => {
      setGameState((prevState) => {
        const newBoard = prevState.board.map((boardRow) =>
          boardRow.map((cell) => ({
            ...cell,
            isConflict: false,
            isInConflictLine: false,
            isInConflictColumn: false,
            isInConflictRegion: false,
            isAroundConflictQueen: false,
          }))
        );
        const newRegions = prevState.regions.map((region) => ({ ...region }));
        const cell = newBoard[row][col];

        let queensPlaced = prevState.queensPlaced;

        if (cell.state === "queen") {
          cell.state = "empty";
          queensPlaced--;

          for (const region of newRegions) {
            const queensInRegion = region.cells.filter(
              (cell) => newBoard[cell.row][cell.col].state === "queen"
            );
            region.hasQueen = queensInRegion.length > 0;
            region.queenPosition =
              queensInRegion.length > 0 ? queensInRegion[0] : undefined;
          }
        } else {
          if (cell.state === "marked") {
            cell.state = "empty";
          }

          cell.state = "queen";
          queensPlaced++;

          for (const region of newRegions) {
            const queensInRegion = region.cells.filter(
              (cell) => newBoard[cell.row][cell.col].state === "queen"
            );
            region.hasQueen = queensInRegion.length > 0;
            region.queenPosition =
              queensInRegion.length > 0 ? queensInRegion[0] : undefined;
          }
        }

        const boardWithConflicts = updateConflicts(newBoard, newRegions);

        const isCompleted = checkPuzzleCompletion(
          boardWithConflicts,
          newRegions
        );

        return {
          ...prevState,
          board: boardWithConflicts,
          regions: newRegions,
          queensPlaced,
          isCompleted,
          moveCount: prevState.moveCount + 1,
        };
      });
    },
    [checkPuzzleCompletion]
  );

  // ✨ NOUVEAU: Gérer le drag pour marqueurs uniquement
  const handleCellDrag = useCallback((row: number, col: number, dragMode: 'mark' | 'unmark') => {
    if (
      isGameBlocked ||
      showVictoryAnimation ||
      gameState.board.length === 0 ||
      isGenerating
    ) {
      return;
    }

    setGameState(prevState => {
      const newBoard = prevState.board.map(boardRow => 
        boardRow.map(cell => ({
          ...cell,
          isConflict: false,
          isInConflictLine: false,
          isInConflictColumn: false,
          isInConflictRegion: false,
          isAroundConflictQueen: false,
        }))
      );
      const cell = newBoard[row][col];
      
      // Ne pas permettre le drag sur les reines
      if (cell.state === 'queen') {
        return prevState;
      }
      
      // Appliquer le drag selon le mode
      if (dragMode === 'mark' && cell.state === 'empty') {
        cell.state = 'marked';
      } else if (dragMode === 'unmark' && cell.state === 'marked') {
        cell.state = 'empty';
      }
      // Sinon, ne rien faire (cellule déjà dans l'état voulu)
      
      const boardWithConflicts = updateConflicts(newBoard, prevState.regions);
      
      return {
        ...prevState,
        board: boardWithConflicts,
        moveCount: prevState.moveCount + 1
      };
    });
  }, [isGameBlocked, showVictoryAnimation, gameState.board.length, isGenerating]);

  const resetGame = useCallback(() => {
    cellClicksRef.current.forEach((clickInfo) => {
      if (clickInfo.timeout) {
        clearTimeout(clickInfo.timeout);
      }
    });
    cellClicksRef.current.clear();

    setGameState((prevState) => {
      const resetState = resetGameBoard(prevState);
      const cleanBoard = resetState.board.map((row) =>
        row.map((cell) => ({
          ...cell,
          isConflict: false,
          isInConflictLine: false,
          isInConflictColumn: false,
          isInConflictRegion: false,
          isAroundConflictQueen: false,
        }))
      );
      return {
        ...resetState,
        board: cleanBoard,
      };
    });

    setIsGameBlocked(false);
    setShowVictoryAnimation(false);
  }, []);

  const newGame = useCallback(
    async (gridSize?: number) => {
      if (isGenerating) return;

      cellClicksRef.current.forEach((clickInfo) => {
        if (clickInfo.timeout) {
          clearTimeout(clickInfo.timeout);
        }
      });
      cellClicksRef.current.clear();

      const size = gridSize || gameState.gridSize;

      setIsGenerating(true);
      setIsGameBlocked(true);

      await new Promise((resolve) => setTimeout(resolve, 10));

      try {
        const newLevel = await generateGameLevel(size);

        setGameState(newLevel);
        setGameTime(0);
        setTimerStarted(true);
        setShowVictoryAnimation(false);
      } catch (error) {
        console.error("Erreur génération nouveau niveau:", error);
      } finally {
        setIsGenerating(false);
        setIsGameBlocked(false);
      }
    },
    [gameState.gridSize, isGenerating]
  );

  const checkValidPlacement = useCallback(
    (row: number, col: number): boolean => {
      if (gameState.board.length === 0) return false;
      const validation = validateQueenPlacement(
        gameState.board,
        gameState.regions,
        { row, col }
      );
      return validation.isValid;
    },
    [gameState.board, gameState.regions]
  );

  const getConflictingCells = useCallback(
    (row: number, col: number): { row: number; col: number }[] => {
      const conflicts: { row: number; col: number }[] = [];
      const gridSize = gameState.gridSize;

      if (gameState.board.length === 0) return conflicts;

      // Conflits dans la même rangée
      for (let c = 0; c < gridSize; c++) {
        if (c !== col && gameState.board[row][c].state === "queen") {
          conflicts.push({ row, col: c });
        }
      }

      // Conflits dans la même colonne
      for (let r = 0; r < gridSize; r++) {
        if (r !== row && gameState.board[r][col].state === "queen") {
          conflicts.push({ row: r, col });
        }
      }

      return conflicts;
    },
    [gameState.board, gameState.gridSize]
  );

  useEffect(() => {
    return () => {
      cellClicksRef.current.forEach((clickInfo) => {
        if (clickInfo.timeout) {
          clearTimeout(clickInfo.timeout);
        }
      });
      cellClicksRef.current.clear();
    };
  }, []);

  return {
    gameState,
    handleCellClick,
    handleCellDrag, // ✨ NOUVEAU: Fonction pour le drag
    resetGame,
    newGame,
    changeGridSizeOnly,
    checkValidPlacement,
    getConflictingCells,
    gameTime,
    showVictoryAnimation,
    isGameBlocked,
    isGenerating,
  };
}