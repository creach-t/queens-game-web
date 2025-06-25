import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState } from '../types/game';
import { validateQueenPlacement, isPuzzleCompleted, updateConflicts } from '../utils/gameValidation';
import { generateGameLevel, resetGameBoard } from '../utils/levelGenerator';

// Interface pour tracker les clics par cellule
interface CellClickInfo {
  lastClickTime: number;
  timeout: ReturnType<typeof setTimeout> | null;
}

export function useGameLogic(initialGridSize: number = 6) {
  const [gameState, setGameState] = useState<GameState>(() => generateGameLevel(initialGridSize));

  const cellClicksRef = useRef<Map<string, CellClickInfo>>(new Map());

  const handleCellClick = useCallback((row: number, col: number) => {
    const now = Date.now();
    const cellKey = `${row}-${col}`;
    const cellClickInfo = cellClicksRef.current.get(cellKey);

    if (cellClickInfo?.timeout) {
      clearTimeout(cellClickInfo.timeout);
    }

    if (cellClickInfo && now - cellClickInfo.lastClickTime < 300) {
      handleDoubleClick(row, col);
      cellClicksRef.current.delete(cellKey);
    } else {
      const timeout = setTimeout(() => {
        handleSingleClick(row, col);
        cellClicksRef.current.delete(cellKey);
      }, 160);

      cellClicksRef.current.set(cellKey, {
        lastClickTime: now,
        timeout: timeout
      });
    }
  }, []);

  const handleSingleClick = useCallback((row: number, col: number) => {
    setGameState(prevState => {
      const newBoard = prevState.board.map(boardRow =>
        boardRow.map(cell => ({ ...cell }))
      );
      const cell = newBoard[row][col];

      if (cell.state === 'empty') {
        cell.state = 'marker';
      } else if (cell.state === 'marker') {
        cell.state = 'empty';
      }

      return {
        ...prevState,
        board: newBoard,
        moveCount: prevState.moveCount + 1
      };
    });
  }, []);

  const handleDoubleClick = useCallback((row: number, col: number) => {
    setGameState(prevState => {
      const newBoard = prevState.board.map(boardRow =>
        boardRow.map(cell => ({ ...cell }))
      );
      const newRegions = prevState.regions.map(region => ({ ...region }));
      const cell = newBoard[row][col];

      let queensPlaced = prevState.queensPlaced;

      if (cell.state === 'queen') {
        cell.state = 'empty';
        queensPlaced--;

        const region = newRegions.find(r => r.id === cell.regionId);
        if (region) {
          region.hasQueen = false;
          region.queenPosition = undefined;
        }
      } else {
        if (cell.state === 'marker') {
          cell.state = 'empty';
        }

        cell.state = 'queen';
        queensPlaced++;

        const region = newRegions.find(r => r.id === cell.regionId);
        if (region) {
          region.hasQueen = true;
          region.queenPosition = { row, col };
        }
      }

      const boardWithConflicts = updateConflicts(newBoard, newRegions);
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

  const resetGame = useCallback(() => {
    cellClicksRef.current.forEach(clickInfo => {
      if (clickInfo.timeout) {
        clearTimeout(clickInfo.timeout);
      }
    });
    cellClicksRef.current.clear();

    setGameState(prevState => resetGameBoard(prevState));
  }, []);

  const newGame = useCallback((gridSize?: number) => {
    cellClicksRef.current.forEach(clickInfo => {
      if (clickInfo.timeout) {
        clearTimeout(clickInfo.timeout);
      }
    });
    cellClicksRef.current.clear();

    const size = gridSize || gameState.gridSize;
    setGameState(generateGameLevel(size));
  }, [gameState.gridSize]);

  const checkValidPlacement = useCallback((row: number, col: number): boolean => {
    const validation = validateQueenPlacement(gameState.board, gameState.regions, row, col);
    return validation.isValid;
  }, [gameState.board, gameState.regions]);

  const getConflictingCells = useCallback((row: number, col: number): {row: number, col: number}[] => {
    const conflicts: {row: number, col: number}[] = [];
    const gridSize = gameState.gridSize;

    for (let c = 0; c < gridSize; c++) {
      if (c !== col && gameState.board[row][c].state === 'queen') {
        conflicts.push({row, col: c});
      }
    }

    for (let r = 0; r < gridSize; r++) {
      if (r !== row && gameState.board[r][col].state === 'queen') {
        conflicts.push({row: r, col});
      }
    }

    return conflicts;
  }, [gameState.board, gameState.gridSize]);

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