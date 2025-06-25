import { useState, useCallback, useEffect } from 'react';
import { GameState, GameCell, ColoredRegion, CellState } from '../types/game';
import { validateQueenPlacement, isPuzzleCompleted, updateConflicts } from '../utils/gameValidation';
import { generateGameLevel, resetGameBoard } from '../utils/levelGenerator';

export function useGameLogic(initialGridSize: number = 6) {
  const [gameState, setGameState] = useState<GameState>(() => generateGameLevel(initialGridSize));
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [clickTimeouts, setClickTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Gérer le clic sur une cellule
  const handleCellClick = useCallback((row: number, col: number) => {
    const now = Date.now();
    const cellKey = `${row}-${col}`;
    const lastClick = lastClickTime;
    
    // Nettoyer le timeout existant pour cette cellule
    const existingTimeout = clickTimeouts.get(cellKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      clickTimeouts.delete(cellKey);
    }

    // Double-click détection (dans les 300ms)
    if (now - lastClick < 300) {
      // Double-click: placer/enlever une reine
      handleDoubleClick(row, col);
      setLastClickTime(0);
    } else {
      // Simple click: attendre pour voir s'il y a un double-click
      const timeout = setTimeout(() => {
        handleSingleClick(row, col);
        clickTimeouts.delete(cellKey);
      }, 300);
      
      clickTimeouts.set(cellKey, timeout);
      setLastClickTime(now);
    }
  }, [lastClickTime, clickTimeouts]);

  // Gérer le simple clic (marqueur)
  const handleSingleClick = useCallback((row: number, col: number) => {
    setGameState(prevState => {
      const newBoard = [...prevState.board];
      const cell = newBoard[row][col];
      
      // Cycle: empty -> marker -> empty
      if (cell.state === 'empty') {
        cell.state = 'marker';
      } else if (cell.state === 'marker') {
        cell.state = 'empty';
      }
      // Ne pas changer si c'est une reine (réservé au double-click)
      
      return {
        ...prevState,
        board: newBoard,
        moveCount: prevState.moveCount + 1
      };
    });
  }, []);

  // Gérer le double clic (reine)
  const handleDoubleClick = useCallback((row: number, col: number) => {
    setGameState(prevState => {
      const newBoard = [...prevState.board];
      const newRegions = [...prevState.regions];
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

  // Réinitialiser le jeu
  const resetGame = useCallback(() => {
    setGameState(prevState => resetGameBoard(prevState));
  }, []);

  // Nouveau jeu
  const newGame = useCallback((gridSize?: number) => {
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
      clickTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [clickTimeouts]);

  return {
    gameState,
    handleCellClick,
    resetGame,
    newGame,
    checkValidPlacement,
    getConflictingCells
  };
}
