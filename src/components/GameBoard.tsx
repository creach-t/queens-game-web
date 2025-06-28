import React, { useMemo, useState, useEffect } from 'react';
import { GameState } from '../types/game';
import { GameCell } from './GameCell';

interface GameBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
  showVictoryAnimation?: boolean;
  isGameBlocked?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCellClick,
  showVictoryAnimation = false,
  isGameBlocked = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCells, setLoadedCells] = useState<Set<string>>(new Set());

  const cellSize = useMemo(() => {
    // Calcul responsive de la taille des cellules
    const maxWidth = Math.min(560, window.innerWidth * 0.85);
    const maxHeight = Math.min(560, window.innerHeight * 0.6);
    const availableSize = Math.min(maxWidth, maxHeight);

    return Math.floor(availableSize / (gameState.gridSize || 6)) - 2;
  }, [gameState.gridSize]);

  // Animation de chargement des cellules
  useEffect(() => {
    // Vérifier que le board est valide avant de commencer l'animation
    if (!gameState.board || gameState.board.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadedCells(new Set());

    const totalCells = gameState.gridSize * gameState.gridSize;
    let loadedCount = 0;

    // Charger les cellules progressivement avec un effet en spirale
    const loadCells = () => {
      const cells: { row: number; col: number; }[] = [];
      const { gridSize } = gameState;

      // Créer un effet de spiral depuis le centre
      const centerRow = Math.floor(gridSize / 2);
      const centerCol = Math.floor(gridSize / 2);

      for (let radius = 0; radius <= Math.max(centerRow, centerCol, gridSize - centerRow, gridSize - centerCol); radius++) {
        for (let row = Math.max(0, centerRow - radius); row <= Math.min(gridSize - 1, centerRow + radius); row++) {
          for (let col = Math.max(0, centerCol - radius); col <= Math.min(gridSize - 1, centerCol + radius); col++) {
            if ((row === centerRow - radius || row === centerRow + radius ||
                 col === centerCol - radius || col === centerCol + radius) &&
                 !cells.find(c => c.row === row && c.col === col)) {
              cells.push({ row, col });
            }
          }
        }
      }

      // Charger les cellules avec délai
      cells.forEach((cell, index) => {
        setTimeout(() => {
          setLoadedCells(prev => new Set([...prev, `${cell.row}-${cell.col}`]));
          loadedCount++;

          if (loadedCount === totalCells) {
            setTimeout(() => setIsLoading(false), 300);
          }
        }, index * 50);
      });
    };

    setTimeout(loadCells, 200);
  }, [gameState.gridSize, gameState.board.length]);

  const getCellBorderClasses = (row: number, col: number) => {
    if (!gameState.board || !gameState.board[row] || !gameState.board[row][col]) {
      return 'border-4 border-gray-800';
    }

    const cell = gameState.board[row][col];
    const { gridSize } = gameState;

    let classes = '';

    // Bordures de la grille principale
    if (row === 0) classes += ' border-t-4';
    if (col === 0) classes += ' border-l-4';
    if (row === gridSize - 1) classes += ' border-b-4';
    if (col === gridSize - 1) classes += ' border-r-4';

    // Bordures internes entre régions
    if (col < gridSize - 1) {
      const rightCell = gameState.board[row][col + 1];
      classes += rightCell && rightCell.regionId === cell.regionId ? ' border-r border-gray-400' : ' border-r-4';
    }

    if (row < gridSize - 1) {
      const bottomCell = gameState.board[row + 1] && gameState.board[row + 1][col];
      classes += bottomCell && bottomCell.regionId === cell.regionId ? ' border-b border-gray-400' : ' border-b-4';
    }

    return classes + ' border-gray-800';
  };

  const getCornerClasses = (row: number, col: number) => {
    const gridSize = gameState.gridSize || 6;
    let classes = '';

    if (row === 0 && col === 0) classes += ' rounded-tl-lg';
    if (row === 0 && col === gridSize - 1) classes += ' rounded-tr-lg';
    if (row === gridSize - 1 && col === 0) classes += ' rounded-bl-lg';
    if (row === gridSize - 1 && col === gridSize - 1) classes += ' rounded-br-lg';

    return classes;
  };

  const handleCellClick = (row: number, col: number) => {
    if (isLoading || isGameBlocked) return;
    onCellClick(row, col);
  };

  // Protection: vérifier que le gameState est valide APRÈS tous les hooks
  if (!gameState.board || gameState.board.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement du plateau...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
      isGameBlocked ? 'pointer-events-none' : ''
    }`}>
      <div
        className="grid bg-gray-800 p-1 rounded-lg shadow-inner overflow-hidden relative"
        style={{
          gridTemplateColumns: `repeat(${gameState.gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gameState.gridSize}, ${cellSize}px)`,
          gap: '0px'
        }}
      >
        {gameState.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            const isLoaded = loadedCells.has(cellKey);

            return (
              <div
                key={cellKey}
                className={`
                  relative overflow-hidden transition-all duration-500
                  ${getCellBorderClasses(rowIndex, colIndex)}
                  ${getCornerClasses(rowIndex, colIndex)}
                  ${isLoaded ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
                `}
                style={{
                  transitionDelay: isLoaded ? '0ms' : '0ms'
                }}
              >
                <GameCell
                  cell={cell}
                  size={cellSize}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  showVictoryAnimation={showVictoryAnimation}
                  isLoading={!isLoaded}
                />
              </div>
            );
          })
        )}

        {/* Overlay de chargement */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="text-white font-medium">Chargement...</div>
          </div>
        )}
      </div>
    </div>
  );
};