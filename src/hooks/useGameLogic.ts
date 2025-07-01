import { useCallback, useEffect, useRef, useState } from "react";
import { validateQueenPlacement } from "../lib/game-engine/rules";
import { ColoredRegion, GameCell, GameState } from "../types/game";
import { updateConflicts } from "../utils/gameValidation";
import { generateGameLevel, resetGameBoard } from "../utils/levelGenerator";

// Interface pour tracker les clics par cellule
interface CellClickInfo {
  lastClickTime: number;
  timeout: ReturnType<typeof setTimeout> | null;
}

export function useGameLogic(initialGridSize: number = 6) {
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
  }));

  const [timerStarted, setTimerStarted] = useState(false); // ❌ Était true
  const [gameTime, setGameTime] = useState(0);
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [isGameBlocked, setIsGameBlocked] = useState(false);

  // Initialisation du niveau
  useEffect(() => {
    const initLevel = async () => {
      try {
        const newLevel = await generateGameLevel(initialGridSize);
        setGameState(newLevel);
        setTimerStarted(true);
        setGameTime(0);
      } catch (error) {
        //console.error("Erreur génération niveau:", error);
        // Générer niveau de base en cas d'erreur
        setGameState({
          board: [],
          regions: [],
          gridSize: initialGridSize,
          queensPlaced: 0,
          queensRequired: initialGridSize,
          isCompleted: false,
          moveCount: 0,
          elapsedTime: 0,
          isTimerRunning: false,
        });
        setTimerStarted(true);
        setGameTime(0);
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

  const changeGridSizeOnly = useCallback((gridSize: number) => {
    // Nettoyer les timeouts actifs
    cellClicksRef.current.forEach((clickInfo) => {
      if (clickInfo.timeout) {
        clearTimeout(clickInfo.timeout);
      }
    });
    cellClicksRef.current.clear();

    // Créer un état temporaire simple pour l'animation
    setGameState({
      board: [],
      regions: [],
      gridSize: gridSize,
      queensPlaced: 0,
      queensRequired: gridSize,
      isCompleted: false,
      moveCount: 0,
      elapsedTime: 0,
      isTimerRunning: false,
    });

    setIsGameBlocked(false);
    setShowVictoryAnimation(false);
  }, []);

  // Validation corrigée - vérifier si le puzzle est résolu
  const checkPuzzleCompletion = useCallback(
    (board: GameCell[][], regions: ColoredRegion[]) => {
      const gridSize = board.length;

      // Compter les reines placées
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
            return false; // Les reines se touchent
          }
        }
      }

      return true;
    },
    []
  );

  // Gérer le clic sur une cellule avec logique corrigée
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      // Bloquer les clics si le jeu est terminé ou en animation
      if (
        isGameBlocked ||
        showVictoryAnimation ||
        gameState.board.length === 0
      ) {
        return;
      }

      const now = Date.now();
      const cellKey = `${row}-${col}`;
      const cellClickInfo = cellClicksRef.current.get(cellKey);

      // Nettoyer l'ancien timeout si il existe
      if (cellClickInfo?.timeout) {
        clearTimeout(cellClickInfo.timeout);
      }

      // Vérifier le double-clic POUR CETTE CELLULE SPÉCIFIQUE
      if (cellClickInfo && now - cellClickInfo.lastClickTime < 300) {
        // Double-click détecté sur la MÊME cellule
        handleDoubleClick(row, col);
        cellClicksRef.current.delete(cellKey); // Nettoyer l'entrée
      } else {
        // Premier clic ou clic trop tardif - programmer le single click
        const timeout = setTimeout(() => {
          handleSingleClick(row, col);
          cellClicksRef.current.delete(cellKey);
        }, 320); // Délai légèrement plus long pour la sécurité

        // Enregistrer ce clic pour cette cellule
        cellClicksRef.current.set(cellKey, {
          lastClickTime: now,
          timeout: timeout,
        });
      }
    },
    [isGameBlocked, showVictoryAnimation, gameState.board.length]
  );

  // Gérer le simple clic (marqueur)
  const handleSingleClick = useCallback((row: number, col: number) => {
    setGameState((prevState) => {
      const newBoard = prevState.board.map((boardRow) =>
        boardRow.map((cell) => ({
          ...cell,
          // Réinitialiser tous les conflits visuels
          isConflict: false,
          isInConflictLine: false,
          isInConflictColumn: false,
          isInConflictRegion: false,
          isAroundConflictQueen: false,
        }))
      );
      const cell = newBoard[row][col];

      // Cycle: empty -> marker -> empty (ne touche pas aux reines)
      if (cell.state === "empty") {
        cell.state = "marker";
      } else if (cell.state === "marker") {
        cell.state = "empty";
      }
      // Ne pas modifier si c'est une reine (réservé au double-click)

      // Recalculer les conflits
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
            // Réinitialiser tous les conflits visuels
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
          // Enlever la reine
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
          // Effacer le marqueur si présent avant de placer la reine
          if (cell.state === "marker") {
            cell.state = "empty";
          }

          // Placer une reine
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

        // Mettre à jour les conflits
        const boardWithConflicts = updateConflicts(newBoard, newRegions);

        // Vérifier si le puzzle est complété avec la nouvelle validation
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

  // Réinitialiser le jeu avec nettoyage des timeouts (le timer continue)
  const resetGame = useCallback(() => {
    // Nettoyer tous les timeouts actifs
    cellClicksRef.current.forEach((clickInfo) => {
      if (clickInfo.timeout) {
        clearTimeout(clickInfo.timeout);
      }
    });
    cellClicksRef.current.clear();

    setGameState((prevState) => {
      const resetState = resetGameBoard(prevState);
      // Nettoyer tous les conflits visuels
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
    // Le timer continue (pas de reset)
  }, []);

  // Nouveau jeu avec la même taille ou une nouvelle taille (reset complet)
  const newGame = useCallback(
    async (gridSize?: number) => {
      // Nettoyer tous les timeouts actifs
      cellClicksRef.current.forEach((clickInfo) => {
        if (clickInfo.timeout) {
          clearTimeout(clickInfo.timeout);
        }
      });
      cellClicksRef.current.clear();

      const size = gridSize || gameState.gridSize;

      try {
        const newLevel = await generateGameLevel(size);
        setGameState(newLevel);
      } catch (error) {
        //console.error("Erreur génération nouveau niveau:", error);
      }

      // Reset complet du timer pour nouveau jeu
      setGameTime(0);
      setTimerStarted(true);
      setIsGameBlocked(false);
      setShowVictoryAnimation(false);
    },
    [gameState.gridSize]
  );

  // Vérifier la validité d'un placement
  const checkValidPlacement = useCallback(
    (row: number, col: number): boolean => {
      if (gameState.board.length === 0) return false;
      const validation = validateQueenPlacement(
        gameState.board,
        gameState.regions,
        { row, col },
      );
      return validation.isValid;
    },
    [gameState.board, gameState.regions]
  );

  // Obtenir les cellules en conflit
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

  // Nettoyer les timeouts à la désactivation
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
    resetGame,
    newGame,
    changeGridSizeOnly,
    checkValidPlacement,
    getConflictingCells,
    gameTime,
    showVictoryAnimation,
    isGameBlocked,
  };
}
