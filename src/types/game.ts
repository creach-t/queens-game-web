export * from './core';

export interface GameCell {
  row: number;
  col: number;
  regionId: number;
  regionColor: string;
  state: 'empty' | 'queen' | 'marker';
  isHighlighted?: boolean;
  isConflict?: boolean;
  // Nouvelles propriétés pour les types de conflits
  isInConflictLine?: boolean;
  isInConflictColumn?: boolean;
  isInConflictRegion?: boolean;
  isAroundConflictQueen?: boolean;
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
  previousState: 'empty' | 'queen' | 'marker';
}

export type CellState = 'empty' | 'queen' | 'marker';

export interface GameConfig {
  gridSize: number;
  difficulty: 'easy' | 'medium' | 'hard';
}