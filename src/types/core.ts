/**
 * Core types for Queens Game - React Version
 * Centralized type definitions adapted for React architecture
 */

/**
 * Position on the game board
 */
export interface Position {
  readonly row: number;
  readonly col: number;
}

/**
 * Cell state possibilities
 */
export type CellState = 'empty' | 'queen' | 'marked';

/**
 * Enhanced game cell with React-specific properties
 */
export interface GameCell {
  readonly row: number;
  readonly col: number;
  readonly regionId: number;
  readonly regionColor: string;
  state: CellState;
  isHighlighted: boolean;
  isConflict: boolean;
  // React-specific conflict highlighting
  isInConflictLine?: boolean;
  isInConflictColumn?: boolean;
  isInConflictRegion?: boolean;
  isAroundConflictQueen?: boolean;
}

/**
 * Colored region definition
 */
export interface ColoredRegion {
  readonly id: number;
  readonly color: string;
  cells: Position[];
  hasQueen: boolean;
  queenPosition?: Position;
}

/**
 * Complete game state for React components
 */
export interface GameState {
  board: GameCell[][];
  regions: ColoredRegion[];
  readonly gridSize: number;
  queensPlaced: number;
  readonly queensRequired: number;
  isCompleted: boolean;
  moveCount: number;
  solution?: Position[];

  // React-specific state
  isLoading?: boolean;
  lastMoveTime?: number;
  hints?: Position[];
  showHints?: boolean;
}

/**
 * Game configuration for React app
 */
export interface GameConfig {
  gridSize: number;
  complexity: 'easy' | 'medium' | 'hard';
  enableHints: boolean;
  enableTimer: boolean;
  enableAnimations: boolean;
}

/**
 * Validation result with detailed feedback
 */
export interface ValidationResult {
  isValid: boolean;
  conflicts: string[];
  conflictPositions?: Position[];
}

/**
 * Level generation configuration
 */
export interface LevelConfig {
  gridSize: number;
  maxAttempts: number;
  regionSizeRange: {
    min: number;
    max: number;
  };
  complexity: 'easy' | 'medium' | 'hard';
}

/**
 * Game statistics for React components
 */
export interface GameStats {
  totalMoves: number;
  correctMoves: number;
  incorrectMoves: number;
  hintsUsed: number;
  timeElapsed: number;
  completion: number; // 0-100%
}

/**
 * React hook return types
 */
export interface GameActions {
  placeQueen: (row: number, col: number) => boolean;
  removeQueen: (row: number, col: number) => boolean;
  toggleMark: (row: number, col: number) => void;
  resetGame: () => void;
  newGame: (size?: number) => void;
  getHint: () => Position | null;
  checkSolution: () => boolean;
}

/**
 * Event types for game interactions
 */
export type GameEventType =
  | 'queen-placed'
  | 'queen-removed'
  | 'cell-marked'
  | 'cell-unmarked'
  | 'game-completed'
  | 'game-reset'
  | 'hint-requested';

export interface GameEvent {
  type: GameEventType;
  position?: Position;
  timestamp: number;
  success?: boolean;
}

/**
 * Connected component for region analysis
 */
export interface ConnectedComponent {
  cells: Position[];
  connectedToRegion: number | null;
}

/**
 * Solver configuration
 */
export interface SolverConfig {
  maxSolutions: number;
  timeoutMs?: number;
  collectSolutions: boolean;
}

/**
 * Solver result
 */
export interface SolverResult {
  solutionCount: number;
  solutions: Position[][];
  isUnique: boolean;
  timeMs?: number;
}

/**
 * React component props types
 */
export interface GameBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  disabled?: boolean;
  showAnimation?: boolean;
}

export interface GameCellProps {
  cell: GameCell;
  onClick: () => void;
  onDoubleClick: () => void;
  disabled?: boolean;
  showAnimation?: boolean;
}

export interface GameControlsProps {
  gameState: GameState;
  stats: GameStats;
  onReset: () => void;
  onNewGame: () => void;
  onHint: () => void;
  onSizeChange: (size: number) => void;
}

/**
 * Error types for better error handling
 */
export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public position?: Position
  ) {
    super(message);
    this.name = 'GameError';
  }
}

/**
 * Storage types for persistence
 */
export interface StoredGameState {
  gameState: GameState;
  stats: GameStats;
  config: GameConfig;
  savedAt: number;
}

/**
 * Preferences for user settings
 */
export interface UserPreferences {
  defaultGridSize: number;
  enableHints: boolean;
  enableTimer: boolean;
  enableAnimations: boolean;
  enableSounds: boolean;
  theme: 'light' | 'dark' | 'auto';
}

/**
 * Type guards
 */
export function isValidCellState(state: string): state is CellState {
  return ['empty', 'queen', 'marked'].includes(state);
}

export function isValidPosition(pos: any): pos is Position {
  return (
    typeof pos === 'object' &&
    pos !== null &&
    typeof pos.row === 'number' &&
    typeof pos.col === 'number' &&
    pos.row >= 0 &&
    pos.col >= 0
  );
}

export function isValidGameConfig(config: any): config is GameConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    typeof config.gridSize === 'number' &&
    ['easy', 'medium', 'hard'].includes(config.complexity) &&
    typeof config.enableHints === 'boolean' &&
    typeof config.enableTimer === 'boolean' &&
    typeof config.enableAnimations === 'boolean'
  );
}