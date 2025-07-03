export * from './core';

export interface GameCell {
  row: number;
  col: number;
  regionId: number;
  regionColor: string;
  state: 'empty' | 'queen' | 'marked';
  isHighlighted: boolean;
  isConflict?: boolean;
  // Nouvelles propriétés pour les types de conflits
  isInConflictLine?: boolean;
  isInConflictColumn?: boolean;
  isInConflictRegion?: boolean;
  isAroundConflictQueen?: boolean;
  // ✅ NOUVEAU: Propriétés pour le drag
  isDragHovered?: boolean;
  isDragSelected?: boolean;
}

export interface ColoredRegion {
  id: number;
  color: string;
  cells: {row: number, col: number}[];
  hasQueen: boolean;
  queenPosition?: {row: number, col: number};
}

export interface GameState {
  board: GameCell[][];
  regions: ColoredRegion[];
  gridSize: number;
  queensPlaced: number;
  queensRequired: number;
  isCompleted: boolean;
  moveCount: number;
  solution?: {row: number, col: number}[];
  startTime?: number;
  elapsedTime: number;
  isTimerRunning: boolean;
  bestTime?: number;
}

export interface GameMove {
  type: 'place_queen' | 'place_marker' | 'remove';
  row: number;
  col: number;
  previousState: 'empty' | 'queen' | 'marked';
}

export type CellState = 'empty' | 'queen' | 'marked';

export interface GameConfig {
  gridSize: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ✅ NOUVEAU: Types pour le système de drag
export interface DragState {
  isDragging: boolean;
  dragStartCell: { row: number; col: number } | null;
  dragMode: 'mark' | 'unmark' | null;
  draggedCells: Set<string>;
  dragPreviewCells: Set<string>;
}

export interface TouchState {
  isTouch: boolean;
  touchStartTime: number;
  touchStartPosition: { x: number; y: number } | null;
}

// ✅ NOUVEAU: Type pour les événements de drag unifiant mouse et touch
export interface DragEventData {
  clientX: number;
  clientY: number;
  type: 'mouse' | 'touch';
}
