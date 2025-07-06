import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, GameCell } from '../types/game';

interface CanvasGameBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
  onCellDrag?: (row: number, col: number, dragMode: 'mark' | 'unmark') => void;
  showVictoryAnimation?: boolean;
  isGameBlocked?: boolean;
  animationMode?: string;
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
const CELL_BORDER_WIDTH = 1;
const CELL_BORDER_COLOR = 'rgba(44, 62, 80, 0.3)';
const DRAG_THRESHOLD = 0.5; // ✅ SUPER SENSIBLE maintenant

export const CanvasGameBoard: React.FC<CanvasGameBoardProps> = ({
  gameState,
  onCellClick,
  onCellDrag,
  showVictoryAnimation = false,
  isGameBlocked = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPos: null,
    dragMode: null,
    lastDraggedCell: null
  });

  // Images SVG
  const [crownImage, setCrownImage] = useState<HTMLImageElement | null>(null);
  const [crossImage, setCrossImage] = useState<HTMLImageElement | null>(null);

  // Charger les images SVG
  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    Promise.all([
      loadImage('/crown.svg'),
      loadImage('/cross.svg')
    ]).then(([crown, cross]) => {
      setCrownImage(crown);
      setCrossImage(cross);
    }).catch(console.error);
  }, []);

  // Vérifier si le board est initialisé
  const isBoardReady = gameState.board && gameState.board.length > 0 && 
                       gameState.board[0] && gameState.board[0].length > 0;

  // Calculer la taille des cellules
  const getCellSize = useCallback(() => {
    const viewportWidth = Math.min(window.innerWidth * 0.9, 600);
    const viewportHeight = Math.min(window.innerHeight * 0.7, 600);
    const availableSize = Math.min(viewportWidth, viewportHeight);
    return Math.floor(availableSize / gameState.gridSize) - 6;
  }, [gameState.gridSize]);

  // Calculer les positions des cellules
  const getCellPositions = useCallback((): CellPosition[][] => {
    if (!isBoardReady) return [];
    
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
  }, [gameState.gridSize, getCellSize, isBoardReady]);

  // Bordures de régions
  const getCellBorders = useCallback((row: number, col: number) => {
    if (!isBoardReady) return { top: false, right: false, bottom: false, left: false };
    
    const cell = gameState.board[row][col];
    const borders = {
      top: false,
      right: false,
      bottom: false,
      left: false
    };
    
    if (row === 0 || gameState.board[row - 1][col].regionId !== cell.regionId) {
      borders.top = true;
    }
    if (col === gameState.gridSize - 1 || gameState.board[row][col + 1].regionId !== cell.regionId) {
      borders.right = true;
    }
    if (row === gameState.gridSize - 1 || gameState.board[row + 1][col].regionId !== cell.regionId) {
      borders.bottom = true;
    }
    if (col === 0 || gameState.board[row][col - 1].regionId !== cell.regionId) {
      borders.left = true;
    }
    
    return borders;
  }, [gameState.board, gameState.gridSize, isBoardReady]);

  // Trouver la cellule à une position donnée
  const getCellAtPosition = useCallback((x: number, y: number): { row: number; col: number } | null => {
    if (!isBoardReady) return null;
    
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
  }, [getCellPositions, getCellSize, isBoardReady]);

  // Dessiner une cellule
  const drawCell = useCallback((
    ctx: CanvasRenderingContext2D,
    cell: GameCell,
    position: CellPosition,
    borders: any
  ) => {
    const { x, y, size } = position;
    
    // Background avec couleur de région ou victoire
    let backgroundColor = cell.regionColor;
    if (showVictoryAnimation && cell.state === 'queen') {
      backgroundColor = '#FFD700';
    }
    
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x, y, size, size);

    // ✅ CORRECTIF: Utiliser les propriétés existantes du système
    // Hachures pour conflits de ligne/colonne/région/adjacence
    if (cell.isInConflictLine || cell.isInConflictColumn || cell.isInConflictRegion || cell.isAroundConflictQueen) {
      ctx.save();
      
      // Overlay rouge léger
      ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
      ctx.fillRect(x, y, size, size);
      
      // Hachures diagonales
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = -size; i < size * 2; i += 6) {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + size, y + size);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Reine directement en conflit (overlay renforcé)
    if (cell.isConflict && cell.state === 'queen') {
      ctx.save();
      ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
      ctx.fillRect(x, y, size, size);
      
      // Hachures plus denses
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = -size; i < size * 2; i += 4) {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + size, y + size);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Bordures fines entre cellules
    ctx.strokeStyle = CELL_BORDER_COLOR;
    ctx.lineWidth = CELL_BORDER_WIDTH;
    ctx.strokeRect(x, y, size, size);
    
    // Bordures épaisses de régions
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
    
    // Contenu avec SVG
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const iconSize = Math.floor(size * 0.6);
    
    if (cell.state === 'queen' && crownImage) {
      ctx.save();
      
      // Couleurs selon l'état
      if (showVictoryAnimation) {
        ctx.filter = 'hue-rotate(45deg) saturate(1.5) brightness(1.2)'; // Or brillant
      } else if (cell.isConflict) {
        ctx.filter = 'hue-rotate(-10deg) saturate(1.8) brightness(0.8)'; // Rouge foncé
      } else {
        ctx.filter = 'hue-rotate(200deg) saturate(1.2) brightness(1.1)'; // Bleu LinkedIn
      }
      
      ctx.drawImage(
        crownImage,
        centerX - iconSize / 2,
        centerY - iconSize / 2,
        iconSize,
        iconSize
      );
      ctx.restore();
    } else if (cell.state === 'marked' && crossImage) {
      ctx.save();
      ctx.filter = 'hue-rotate(0deg) saturate(1.5)';
      
      ctx.drawImage(
        crossImage,
        centerX - iconSize / 2,
        centerY - iconSize / 2,
        iconSize,
        iconSize
      );
      ctx.restore();
    }
  }, [showVictoryAnimation, crownImage, crossImage]);

  // Fonction de rendu principal
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isBoardReady) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const cellPositions = getCellPositions();
    const cellSize = getCellSize();
    
    // Configurer le canvas avec bordure extérieure
    const totalSize = cellSize * gameState.gridSize;
    const padding = BORDER_WIDTH;
    canvas.width = totalSize + padding * 2;
    canvas.height = totalSize + padding * 2;
    
    // Background avec bordure extérieure
    ctx.fillStyle = BORDER_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Décaler pour la bordure
    ctx.save();
    ctx.translate(padding, padding);
    
    // Dessiner toutes les cellules
    if (cellPositions.length > 0) {
      for (let row = 0; row < gameState.gridSize; row++) {
        for (let col = 0; col < gameState.gridSize; col++) {
          if (!gameState.board[row] || !gameState.board[row][col]) continue;
          
          const cell = gameState.board[row][col];
          const position = cellPositions[row][col];
          const borders = getCellBorders(row, col);
          
          drawCell(ctx, cell, position, borders);
        }
      }
    }
    
    ctx.restore();
  }, [gameState, getCellPositions, getCellSize, getCellBorders, drawCell, isBoardReady]);

  // Gestion des événements de pointeur
  const getPointerPosition = useCallback((e: React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const padding = BORDER_WIDTH;
    return {
      x: e.clientX - rect.left - padding,
      y: e.clientY - rect.top - padding
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isGameBlocked || !isBoardReady) return;
    
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
  }, [isGameBlocked, isBoardReady, getPointerPosition, getCellAtPosition]);

  // ✅ DRAG ULTRA RAPIDE ET FLUIDE
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.startPos || isGameBlocked || !isBoardReady) return;
    
    const pos = getPointerPosition(e);
    const deltaX = pos.x - dragState.startPos.x;
    const deltaY = pos.y - dragState.startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // ✅ DÉMARRAGE INSTANTANÉ du drag
    if (!dragState.isDragging && distance > DRAG_THRESHOLD) {
      const startCell = getCellAtPosition(dragState.startPos.x, dragState.startPos.y);
      if (!startCell) return;
      
      const cell = gameState.board[startCell.row]?.[startCell.col];
      if (!cell || cell.state === 'queen') {
        setDragState(prev => ({ ...prev, startPos: null }));
        return;
      }
      
      const newDragMode = cell.state === 'marked' ? 'unmark' : 'mark';
      
      setDragState(prev => ({
        ...prev,
        isDragging: true,
        dragMode: newDragMode,
        lastDraggedCell: startCell
      }));
      
      // Action immédiate sur cellule de départ
      if (onCellDrag) {
        onCellDrag(startCell.row, startCell.col, newDragMode);
      }
    }
    
    // ✅ CONTINUATION FLUIDE du drag
    if (dragState.isDragging && dragState.dragMode && onCellDrag) {
      const currentCell = getCellAtPosition(pos.x, pos.y);
      
      // Action sur CHAQUE cellule survolée (pas seulement les nouvelles)
      if (currentCell) {
        const cell = gameState.board[currentCell.row]?.[currentCell.col];
        if (cell && cell.state !== 'queen') {
          // Appliquer l'action même si on repasse sur la même cellule
          onCellDrag(currentCell.row, currentCell.col, dragState.dragMode);
          setDragState(prev => ({ ...prev, lastDraggedCell: currentCell }));
        }
      }
    }
  }, [dragState, isGameBlocked, isBoardReady, getPointerPosition, getCellAtPosition, gameState.board, onCellDrag]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isGameBlocked || !isBoardReady) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.releasePointerCapture(e.pointerId);
    
    // Clic si pas de drag
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
  }, [dragState, isGameBlocked, isBoardReady, getPointerPosition, getCellAtPosition, onCellClick]);

  // Redessiner quand l'état change
  useEffect(() => {
    if (isBoardReady) {
      draw();
    }
  }, [draw, isBoardReady]);

  // Animation continue
  useEffect(() => {
    if (!isBoardReady) return;
    
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
  }, [draw, isBoardReady]);

  // Message de chargement
  if (!isBoardReady) {
    return (
      <div className="game-board">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: '15px',
          color: '#666',
          fontSize: '1.1rem'
        }}>
          🎲 Génération du niveau...
        </div>
      </div>
    );
  }

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
          touchAction: 'none',
          margin: '0 auto' // Centrage horizontal
        }}
      />
    </div>
  );
};