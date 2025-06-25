import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameCell, ColoredRegion, CellState } from '../types/game';
import { validateQueenPlacement, isPuzzleCompleted, updateConflicts } from '../utils/gameValidation';
import { generateGameLevel, resetGameBoard } from '../utils/levelGenerator';

export function useGameLogic(initialGridSize: number = 6) {
  const [gameState, setGameState] = useState<GameState>(() => generateGameLevel(initialGridSize));
  const lastClickTimeRef = useRef<number>(0);
  const clickTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Gérer le clic sur une cellule
  const handleCellClick = useCallback((row: number, col: number) => {
    console.log(`handleCellClick called for ${row}-${col}`);
    const now = Date.now();
    const cellKey = `${row}-${col}`;
    const lastClick = lastClickTimeRef.current;
    
    // Nettoyer le timeout existant pour cette cellule
    const existingTimeout = clickTimeoutsRef.current.get(cellKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      clickTimeoutsRef.current.delete(cellKey);
    }

    // Double-click détection (dans les 300ms)
    if (now - lastClick < 300) {
      console.log(`Double-click detected for ${row}-${col}`);
      // Double-click: placer/enlever une reine
      handleDoubleClick(row, col);
      lastClickTimeRef.current = 0;
    } else {
      console.log(`Single-click detected for ${row}-${col}, waiting for potential double-click...`);
      // Simple click: attendre pour voir s'il y a un double-click
      const timeout = setTimeout(() => {
        console.log(`Single-click confirmed for ${row}-${col}`);
        handleSingleClick(row, col);
        clickTimeoutsRef.current.delete(cellKey);
      }, 300);
      
      clickTimeoutsRef.current.set(cellKey, timeout);
      lastClickTimeRef.current = now;
    }
  }, []);

  // Gérer le simple clic (marqueur)
  const handleSingleClick = useCallback((row: number, col: number) => {
    console.log(`handleSingleClick executing for ${row}-${col}`);
    setGameState(prevState => {
      const newBoard = prevState.board.map(boardRow => 
        boardRow.map(cell => ({ ...cell }))
      );
      const cell = newBoard[row][col];
      
      console.log(`Cell ${row}-${col} current state: ${cell.state}`);
      
      // Cycle: empty -> marker -> empty
      if (cell.state === 'empty') {
        cell.state = 'marker';
        console.log(`Changed cell ${row}-${col} to marker`);
      } else if (cell.state === 'marker') {
        cell.state = 'empty';
        console.log(`Changed cell ${row}-${col} to empty`);
      }
      // Ne pas changer si c'est une reine (réservé au double-click)
      
      const newState = {
        ...prevState,
        board: newBoard,
        moveCount: prevState.moveCount + 1
      };
      
      console.log(`New state for cell ${row}-${col}:`, cell.state);
      return newState;
    });
  }, []);

  // Gérer le double clic (reine)
  const handleDoubleClick = useCallback((row: number, col: number) => {
    console.log(`handleDoubleClick executing for ${row}-${col}`);
    setGameState(prevState => {
      const newBoard = prevState.board.map(boardRow => 
        boardRow.map(cell => ({ ...cell }))
      );
      const newRegions = prevState.regions.map(region => ({ ...region }));
      const cell = newBoard[row][col];
      
      console.log(`Cell ${row}-${col} current state: ${cell.state}`);
      
      let queensPlaced = prevState.queensPlaced;
      
      if (cell.state === 'queen') {
        // Enlever la reine
        cell.state = 'empty';
        queensPlaced--;
        console.log(`Removed queen from ${row}-${col}`);
        
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
        console.log(`Placed queen at ${row}-${col}`);
        
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
      
      const newState = {
        ...prevState,
        board: boardWithConflicts,
        regions: newRegions,
        queensPlaced,
        isCompleted,
        moveCount: prevState.moveCount + 1
      };
      
      console.log(`New state for cell ${row}-${col}:`, cell.state, 'Queens placed:', queensPlaced);
      return newState;
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
      clickTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
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
