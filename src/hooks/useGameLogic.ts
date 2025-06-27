import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameCell, ColoredRegion, CellState } from '../types/game';
import { validateQueenPlacement, isPuzzleCompleted, updateConflicts } from '../utils/gameValidation';
import { generateGameLevel, resetGameBoard } from '../utils/levelGenerator';

// Interface pour tracker les clics par cellule
interface CellClickInfo {
  lastClickTime: number;
  timeout: ReturnType<typeof setTimeout> | null;
}

export function useGameLogic(initialGridSize: number = 6) {
  const [gameState, setGameState] = useState<GameState>(() => generateGameLevel(initialGridSize));

  // Map pour tracker les clics par cellule individuelle
  const cellClicksRef = useRef<Map<string, CellClickInfo>>(new Map());

  // Gérer le clic sur une cellule avec logique corrigée
  const handleCellClick = useCallback((row: number, col: number) => {
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
        timeout: timeout
      });
    }
  }, []);

  // Gérer le simple clic (marqueur)
  const handleSingleClick = useCallback((row: number, col: number) => {
    setGameState(prevState => {
      const newBoard = prevState.board.map(boardRow =>
        boardRow.map(cell => ({ ...cell }))
      );
      const cell = newBoard[row][col];

      // Cycle: empty -> marker -> empty (ne touche pas aux reines)
      if (cell.state === 'empty') {
        cell.state = 'marker';
      } else if (cell.state === 'marker') {
        cell.state = 'empty';
      }
      // Ne pas modifier si c'est une reine (réservé au double-click)

      return {
        ...prevState,
        board: newBoard,
        moveCount: prevState.moveCount + 1
      };
    });
  }, []);

  // Gérer le double clic (reine) avec validation améliorée
  const handleDoubleClick = useCallback((row: number, col: number) => {
    setGameState(prevState => {
      const newBoard = prevState.board.map(boardRow =>
        boardRow.map(cell => ({ ...cell }))
      );
      const newRegions = prevState.regions.map(region => ({ ...region }));
      const cell = newBoard[row][col];

      let queensPlaced = prevState.queensPlaced;

      if (cell.state === 'queen') {
        // Enlever la reine
        cell.state = 'empty';
        queensPlaced--;

        // Mettre à jour la région
        const region = newRegions.find(r => r.id === cell.regionId);
        if (region) {
          region.hasQueen = false;
          region.queenPosition = undefined;
        }
      } else {
        // Effacer le marqueur si présent avant de placer la reine
        if (cell.state === 'marker') {
          cell.state = 'empty';
        }

        // Placer une reine
        cell.state = 'queen';
        queensPlaced++;

        // Mettre à jour la région
        const region = newRegions.find(r => r.id === cell.regionId);
        if (region) {
          region.hasQueen = true;
          region.queenPosition = { row, col };
        }
      }

      // Mettre à jour les conflits
      const boardWithConflicts = updateConflicts(newBoard, newRegions);

      // Vérifier si le puzzle est complété
      const isCompleted = isPuzzleCompleted(boardWithConflicts, newRegions);

      return {
        ...prevState,
        board: boardWithConflicts,
        regions: newRegions,
        queensPlaced,
        isCompleted,
        moveCount: prevState.moveCount + 1
      };
    });
  }, []);

  // Réinitialiser le jeu avec nettoyage des timeouts
  const resetGame = useCallback(() => {
    // Nettoyer tous les timeouts actifs
    cellClicksRef.current.forEach(clickInfo => {
      if (clickInfo.timeout) {
        clearTimeout(clickInfo.timeout);
      }
    });
    cellClicksRef.current.clear();

    setGameState(prevState => resetGameBoard(prevState));
  }, []);

  // Nouveau jeu avec la même taille ou une nouvelle taille
  const newGame = useCallback((gridSize?: number) => {
    // Nettoyer tous les timeouts actifs
    cellClicksRef.current.forEach(clickInfo => {
      if (clickInfo.timeout) {
        clearTimeout(clickInfo.timeout);
      }
    });
    cellClicksRef.current.clear();

    const size = gridSize || gameState.gridSize;
    setGameState(generateGameLevel(size));
  }, [gameState.gridSize]);

  // Vérifier la validité d'un placement
  const checkValidPlacement = useCallback((row: number, col: number): boolean => {
    const validation = validateQueenPlacement(gameState.board, gameState.regions, row, col);
    return validation.isValid;
  }, [gameState.board, gameState.regions]);

  // Obtenir les cellules en conflit
  const getConflictingCells = useCallback((row: number, col: number): {row: number, col: number}[] => {
    const conflicts: {row: number, col: number}[] = [];
    const gridSize = gameState.gridSize;

    // Conflits dans la même rangée
    for (let c = 0; c < gridSize; c++) {
      if (c !== col && gameState.board[row][c].state === 'queen') {
        conflicts.push({row, col: c});
      }
    }

    // Conflits dans la même colonne
    for (let r = 0; r < gridSize; r++) {
      if (r !== row && gameState.board[r][col].state === 'queen') {
        conflicts.push({row: r, col});
      }
    }

    return conflicts;
  }, [gameState.board, gameState.gridSize]);

  // Nettoyer les timeouts à la désactivation
  useEffect(() => {
    return () => {
      cellClicksRef.current.forEach(clickInfo => {
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
    checkValidPlacement,
    getConflictingCells
  };
}