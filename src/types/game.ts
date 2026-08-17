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

export interface Position {
  row: number;
  col: number;
}

export interface ValidationResult {
  isValid: boolean;
  conflicts: string[];
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
  showVictoryAnimation?: boolean;
  isLoading?: boolean;
}

export interface SuccessMessageProps {
  gameState: GameState;
  gameTime: number;
  formatTime: (seconds: number) => string;
  onSaveScore: (playerName: string) => Promise<SaveScoreResult>;
  onClose: () => void;
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
  onHint: () => void;
  /** Secondes restantes avant le prochain indice (0 = prêt) */
  hintCooldown: number;
  /** Secondes ajoutées au chrono par indice */
  hintPenalty: number;
  /** Désactive l'indice (chargement / partie terminée) */
  hintDisabled?: boolean;
}

export interface GameControlsProps {
  gameState: GameState;
  gameTime: number;
  onResetGame: () => void;
  onNewGame: () => void;
  onGridSizeChange: (size: number) => void;
  onSaveScore: (playerName: string) => Promise<SaveScoreResult>;
  isLoading?: boolean;
  onCellClick: (row: number, col: number) => void;
  onMarkCell: (row: number, col: number, action?: "mark" | "unmark" | "toggle") => void;
  isGameBlocked?: boolean;
  // Indice
  onHint: () => void;
  hintCooldown: number;
  hintPenalty: number;
  hint?: ProgressiveHint | null;
  onDismissHint?: () => void;
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
  bestTime?: number;
  levelKey?: string; // Firebase key du niveau actuel
}

export interface LeaderboardEntry {
  userId: string;
  playerName: string;
  time: number;
  timestamp: number;
  gridSize: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  userBest?: LeaderboardEntry;
}

/** Résultat d'une tentative d'enregistrement de score (1 entrée par joueur) */
export type SaveScoreStatus = "created" | "improved" | "unchanged" | "error";

export interface SaveScoreResult {
  status: SaveScoreStatus;
  /** Temps du run courant (secondes) */
  time: number;
  /** Meilleur temps précédent du joueur, si déjà enregistré */
  previousBestTime?: number;
  /** Rang du joueur (1-based) dans le classement de cette grille */
  rank?: number;
  /** Nombre total de joueurs classés sur cette grille */
  total?: number;
}

/** Entrée de leaderboard enrichie de sa clé Firebase et de son rang absolu */
export interface RankedEntry extends LeaderboardEntry {
  key: string;
  rank: number;
}

/** Une page du leaderboard complet (pagination par curseur) */
export interface LeaderboardPage {
  entries: RankedEntry[];
  nextCursor: { time: number; key: string } | null;
  hasMore: boolean;
}

export type CellState = "empty" | "queen" | "marked";

/** Paliers d'indice : erreur joueur (prioritaire) → élimination → déduction → révélation */
export type HintLevel = "error" | "elimination" | "deduction" | "reveal";

export interface ProgressiveHint {
  level: HintLevel;
  /** Cases où une reine est impossible (à surligner en interdit) */
  forbidden: Position[];
  /** Case forcée (déduction) ou reine révélée (dernier recours) */
  target: Position | null;
  title: string;
  explanation: string;
  /** Secondes ajoutées au chrono pour ce palier */
  penalty: number;
}

export interface BoardGridProps {
  gameState: GameState;
  cellSize: number;
  loadedCells: Set<string>;
  isDestroying: boolean;
  isLoading: boolean;
  showVictoryAnimation: boolean;
  onCellClick: (row: number, col: number) => void;
  onMarkCell: (row: number, col: number, action?: "mark" | "unmark" | "toggle") => void;
  /** Clés "row-col" des cases interdites (indice élimination) */
  forbiddenKeys?: Set<string>;
  /** Clé "row-col" de la case cible (déduction / révélation) */
  targetKey?: string | null;
}

export interface AnimationOverlayProps {
  isDestroying: boolean;
  isLoading: boolean;
}

export interface GameBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
  onMarkCell: (row: number, col: number, action?: "mark" | "unmark" | "toggle") => void;
  showVictoryAnimation?: boolean;
  isGameBlocked?: boolean;
  animationMode?: "construction" | "destruction" | "none";
  onAnimationComplete?: () => void;
  /** Cases interdites (indice élimination) */
  hintForbidden?: Position[];
  /** Case cible (déduction / révélation) */
  hintTarget?: Position | null;
}
