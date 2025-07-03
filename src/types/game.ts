export interface GameCell {
  row: number;
  col: number;
  regionId: number;
  regionColor: string;
  state: "empty" | "queen" | "marked";
  isHighlighted: boolean;
  isConflict?: boolean;
  isInConflictLine?: boolean;
  isInConflictColumn?: boolean;
  isInConflictRegion?: boolean;
  isAroundConflictQueen?: boolean;
  isDragHovered?: boolean;
  isDragSelected?: boolean;
}

export interface ConnectedComponent {
  cells: Position[];
  connectedToRegion: number | null;
}

export interface StoredRegion {
  id: number;
  cells: Position[];
  queenPosition: Position;
}

export interface StoredLevel {
  key?: string;
  gridSize: number;
  complexity: string;
  regions: StoredRegion[];
  createdAt: number;
}

export interface SolverResult {
  solutionCount: number;
  solutions: Position[][];
  isUnique: boolean;
}

export interface CellClickInfo {
  lastClickTime: number;
  timeout: ReturnType<typeof setTimeout> | null;
}

export interface Position {
  row: number;
  col: number;
}

export interface ValidationResult {
  isValid: boolean;
  conflicts: string[],
  conflictPositions?: Position[];
}

export interface UseAnimationsProps {
  gameState: GameState;
  animationMode: "construction" | "destruction" | "none";
  onAnimationComplete?: () => void;
}

export interface UseAnimationsReturn {
  isLoading: boolean;
  loadedCells: Set<string>;
  isDestroying: boolean;
}

export interface TimerProps {
  gameTime: number;
  isCompleted: boolean;
}

export interface GameCellProps {
  cell: GameCell;
  size: number;
  onClick: () => void;
  showVictoryAnimation?: boolean;
  isLoading?: boolean;
}

export interface SuccessMessageProps {
  gameState: GameState;
  gameTime: number;
  formatTime: (seconds: number) => string;
}

export interface SizeGridSelectorProps {
  currentGridSize: number;
  onGridSizeChange: (size: number) => void;
  levelCounts: Record<number, number>;
}

export interface MainControlsProps {
  onResetGame: () => void;
  onNewGame: () => void;
  isCompleted: boolean;
}

export interface GameControlsProps {
  gameState: GameState;
  gameTime: number;
  onResetGame: () => void;
  onNewGame: () => void;
  onGridSizeChange: (size: number) => void;
  onLevelGenerated?: () => void;
}

export interface DragState {
  isDragging: boolean;
  dragStartCell: { row: number; col: number } | null;
  dragMode: "mark" | "unmark" | null;
  draggedCells: Set<string>;
  dragPreviewCells: Set<string>;
}

export interface TouchState {
  isTouch: boolean;
  touchStartTime: number;
  touchStartPosition: { x: number; y: number } | null;
}

export interface DragEventData {
  clientX: number;
  clientY: number;
  type: "mouse" | "touch";
}

export interface ColoredRegion {
  id: number;
  color: string;
  cells: { row: number; col: number }[];
  hasQueen: boolean;
  queenPosition?: { row: number; col: number };
}

export interface GameState {
  board: GameCell[][];
  regions: ColoredRegion[];
  gridSize: number;
  queensPlaced: number;
  queensRequired: number;
  isCompleted: boolean;
  moveCount: number;
  solution?: { row: number; col: number }[];
  startTime?: number;
  elapsedTime: number;
  isTimerRunning: boolean;
  bestTime?: number;
}

export interface GameMove {
  type: "place_queen" | "place_marker" | "remove";
  row: number;
  col: number;
  previousState: "empty" | "queen" | "marked";
}

export type CellState = "empty" | "queen" | "marked";

export interface GameConfig {
  gridSize: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface BoardGridProps {
  gameState: GameState;
  cellSize: number;
  loadedCells: Set<string>;
  isDestroying: boolean;
  isLoading: boolean;
  showVictoryAnimation: boolean;
  onCellClick: (row: number, col: number) => void;
}

export interface AnimationOverlayProps {
  isDestroying: boolean;
  isLoading: boolean;
}

export interface GameBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
  showVictoryAnimation?: boolean;
  isGameBlocked?: boolean;
  animationMode?: "construction" | "destruction" | "none";
  onAnimationComplete?: () => void;
}
