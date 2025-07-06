import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, GameCell } from '../types/game';

interface CanvasGameBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
  onCellDrag?: (row: number, col: number, dragMode: 'mark' | 'unmark') => void;
}

interface DragState {
  isDragging: boolean;
  startPos: { x: number; y: number } | null;
  dragMode: 'mark' | 'unmark' | null;
  lastDraggedCell: { row: number; col: number } | null;
}

interface CellPosition {
  row: number;
  col: number;
  x: number;
  y: number;
  size: number;
}

const BORDER_WIDTH = 3;
const BORDER_COLOR = '#2c3e50';
const DRAG_THRESHOLD = 2; // pixels

export const CanvasGameBoard: React.FC<CanvasGameBoardProps> = ({
  gameState,
  onCellClick,
  onCellDrag
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPos: null,
    dragMode: null,
    lastDraggedCell: null
  });

  // Calculer la taille des cellules (même logique que GameBoard.tsx)
  const getCellSize = useCallback(() => {
    const viewportWidth = Math.min(window.innerWidth * 0.9, 600);
    const viewportHeight = Math.min(window.innerHeight * 0.7, 600);
    const availableSize = Math.min(viewportWidth, viewportHeight);
    return Math.floor(availableSize / gameState.gridSize) - 6;
  }, [gameState.gridSize]);

  // Calculer les positions des cellules
  const getCellPositions = useCallback((): CellPosition[][] => {
    const cellSize = getCellSize();
    const positions: CellPosition[][] = [];
    
    for (let row = 0; row < gameState.gridSize; row++) {
      const rowPositions: CellPosition[] = [];
      for (let col = 0; col < gameState.gridSize; col++) {
        rowPositions.push({
          row,
          col,
          x: col * cellSize,
          y: row * cellSize,
          size: cellSize
        });
      }
      positions.push(rowPositions);
    }
    return positions;
  }, [gameState.gridSize, getCellSize]);

  // Reproduire la logique getCellBorderStyle de GameBoard.tsx
  const getCellBorders = useCallback((row: number, col: number) => {
    const cell = gameState.board[row][col];
    const borders = {
      top: false,
      right: false,
      bottom: false,
      left: false
    };
    
    // Bordure top
    if (row === 0 || gameState.board[row - 1][col].regionId !== cell.regionId) {
      borders.top = true;
    }
    
    // Bordure right  
    if (col === gameState.gridSize - 1 || gameState.board[row][col + 1].regionId !== cell.regionId) {
      borders.right = true;
    }
    
    // Bordure bottom
    if (row === gameState.gridSize - 1 || gameState.board[row + 1][col].regionId !== cell.regionId) {
      borders.bottom = true;
    }
    
    // Bordure left
    if (col === 0 || gameState.board[row][col - 1].regionId !== cell.regionId) {
      borders.left = true;
    }
    
    return borders;
  }, [gameState.board, gameState.gridSize]);

  // Trouver la cellule à une position donnée
  const getCellAtPosition = useCallback((x: number, y: number): { row: number; col: number } | null => {
    const cellPositions = getCellPositions();
    const cellSize = getCellSize();
    
    for (let row = 0; row < cellPositions.length; row++) {
      for (let col = 0; col < cellPositions[row].length; col++) {
        const pos = cellPositions[row][col];
        if (x >= pos.x && x < pos.x + cellSize && 
            y >= pos.y && y < pos.y + cellSize) {
          return { row, col };
        }
      }
    }
    return null;
  }, [getCellPositions, getCellSize]);

  // Dessiner une cellule
  const drawCell = useCallback((
    ctx: CanvasRenderingContext2D,
    cell: GameCell,
    position: CellPosition,
    borders: any
  ) => {
    const { x, y, size } = position;
    
    // Background avec couleur de région
    ctx.fillStyle = cell.regionColor;
    ctx.fillRect(x, y, size, size);
    
    // Animation de conflit avec hachures diagonales
    if (cell.isConflict) {
      ctx.save();
      ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
      ctx.fillRect(x, y, size, size);
      
      // Hachures diagonales pour les conflits
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = -size; i < size * 2; i += 8) {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + size, y + size);
      }
      ctx.stroke();
      ctx.restore();
    }
    
    // Bordures de régions
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = BORDER_WIDTH;
    ctx.beginPath();
    
    if (borders.top) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y);
    }
    if (borders.right) {
      ctx.moveTo(x + size, y);
      ctx.lineTo(x + size, y + size);
    }
    if (borders.bottom) {
      ctx.moveTo(x + size, y + size);
      ctx.lineTo(x, y + size);
    }
    if (borders.left) {
      ctx.moveTo(x, y + size);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Contenu de la cellule
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (cell.state === 'queen') {
      ctx.font = `bold ${Math.floor(size * 0.4)}px serif`;
      ctx.fillStyle = '#0077b5';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeText('♛', centerX, centerY);
      ctx.fillText('♛', centerX, centerY);
    } else if (cell.state === 'marker') {
      ctx.font = `bold ${Math.floor(size * 0.3)}px sans-serif`;
      ctx.fillStyle = '#e74c3c';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeText('✗', centerX, centerY);
      ctx.fillText('✗', centerX, centerY);
    }
  }, []);

  // Fonction de rendu principal
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const cellPositions = getCellPositions();
    const cellSize = getCellSize();
    
    // Configurer le canvas
    const totalSize = cellSize * gameState.gridSize;
    canvas.width = totalSize;
    canvas.height = totalSize;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, totalSize, totalSize);
    
    // Dessiner toutes les cellules
    for (let row = 0; row < gameState.gridSize; row++) {
      for (let col = 0; col < gameState.gridSize; col++) {
        const cell = gameState.board[row][col];
        const position = cellPositions[row][col];
        const borders = getCellBorders(row, col);
        
        drawCell(ctx, cell, position, borders);
      }
    }
  }, [gameState, getCellPositions, getCellSize, getCellBorders, drawCell]);

  // Gestion des événements de pointeur (unifie mouse et touch)
  const getPointerPosition = useCallback((e: React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.setPointerCapture(e.pointerId);
    const pos = getPointerPosition(e);
    const cell = getCellAtPosition(pos.x, pos.y);
    
    if (!cell) return;
    
    setDragState({
      isDragging: false,
      startPos: pos,
      dragMode: null,
      lastDraggedCell: null
    });
  }, [getPointerPosition, getCellAtPosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.startPos) return;
    
    const pos = getPointerPosition(e);
    const deltaX = pos.x - dragState.startPos.x;
    const deltaY = pos.y - dragState.startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Démarrer le drag si le seuil est dépassé
    if (!dragState.isDragging && distance > DRAG_THRESHOLD) {
      const startCell = getCellAtPosition(dragState.startPos.x, dragState.startPos.y);
      if (!startCell) return;
      
      const cell = gameState.board[startCell.row][startCell.col];
      
      // Ne pas permettre le drag sur les reines
      if (cell.state === 'queen') {
        setDragState(prev => ({ ...prev, startPos: null }));
        return;
      }
      
      // Déterminer le mode de drag
      const newDragMode = cell.state === 'marker' ? 'unmark' : 'mark';
      
      setDragState(prev => ({
        ...prev,
        isDragging: true,
        dragMode: newDragMode
      }));
      
      // Appliquer l'action sur la cellule de départ
      if (onCellDrag) {
        onCellDrag(startCell.row, startCell.col, newDragMode);
      }
    }
    
    // Continuer le drag si actif
    if (dragState.isDragging && dragState.dragMode && onCellDrag) {
      const currentCell = getCellAtPosition(pos.x, pos.y);
      if (currentCell && 
          (!dragState.lastDraggedCell || 
           currentCell.row !== dragState.lastDraggedCell.row || 
           currentCell.col !== dragState.lastDraggedCell.col)) {
        
        const cell = gameState.board[currentCell.row][currentCell.col];
        
        // Ne pas permettre le drag sur les reines
        if (cell.state !== 'queen') {
          onCellDrag(currentCell.row, currentCell.col, dragState.dragMode);
          setDragState(prev => ({ ...prev, lastDraggedCell: currentCell }));
        }
      }
    }
  }, [dragState, getPointerPosition, getCellAtPosition, gameState.board, onCellDrag]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.releasePointerCapture(e.pointerId);
    
    // Si ce n'était pas un drag, traiter comme un clic
    if (!dragState.isDragging && dragState.startPos) {
      const pos = getPointerPosition(e);
      const cell = getCellAtPosition(pos.x, pos.y);
      if (cell) {
        onCellClick(cell.row, cell.col);
      }
    }
    
    setDragState({
      isDragging: false,
      startPos: null,
      dragMode: null,
      lastDraggedCell: null
    });
  }, [dragState, getPointerPosition, getCellAtPosition, onCellClick]);

  // Redessiner quand l'état change
  useEffect(() => {
    draw();
  }, [draw]);

  // Redessiner en continu pour les animations
  useEffect(() => {
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <div className="game-board">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          display: 'block',
          borderRadius: '8px',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
          cursor: dragState.isDragging ? 'grabbing' : 'grab',
          touchAction: 'none' // Empêche le scroll sur mobile
        }}
      />
    </div>
  );
};