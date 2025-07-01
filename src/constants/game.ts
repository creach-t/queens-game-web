/**
 * Game Constants - React Version
 * Centralized constants and configuration for Queens Game React app
 */

/**
 * Region colors matching your existing design
 */
export const REGION_COLORS = [
  "#26A69A",
  "#BA68C8",
  "#81C784",
  "#FFB74D",
  "#F06292",
  "#D4E157",
  "#4DD0E1",
  "#fa6464",
  "#b0a997",
  "#615f87",
  "#995d36",
  "#02f760",
] as const;

/**
 * Supported grid sizes for the React app
 */
export const SUPPORTED_GRID_SIZES = [4, 5, 6, 7, 8] as const;
export const DEFAULT_GRID_SIZE = 6;
export const MIN_GRID_SIZE = 4;
export const MAX_GRID_SIZE = 8;

/**
 * Game complexity levels with their characteristics
 */
export const COMPLEXITY_LEVELS = {
  easy: {
    name: "Easy",
    description: "Larger, uniform regions",
    regionSizeRange: { min: 3, max: 6 },
    maxAttempts: 5,
    targetTime: 300, // 5 minutes
  },
  medium: {
    name: "Medium",
    description: "Varied region sizes",
    regionSizeRange: { min: 2, max: 8 },
    maxAttempts: 10,
    targetTime: 600, // 10 minutes
  },
  hard: {
    name: "Hard",
    description: "Irregular, challenging regions",
    regionSizeRange: { min: 1, max: 10 },
    maxAttempts: 15,
    targetTime: 1200, // 20 minutes
  },
} as const;

/**
 * Default game configuration
 */
export const DEFAULT_GAME_CONFIG = {
  gridSize: DEFAULT_GRID_SIZE,
  complexity: "medium" as const,
  enableHints: true,
  enableTimer: true,
  enableAnimations: true,
};

/**
 * CSS classes for different states
 */
export const CSS_CLASSES = {
  // Cell states
  CELL_EMPTY: "cell-empty",
  CELL_QUEEN: "cell-queen",
  CELL_MARKED: "cell-marked",

  // Conflict highlighting
  CONFLICT_QUEEN: "conflict-queen",
  CONFLICT_LINE: "conflict-line",
  CONFLICT_COLUMN: "conflict-column",
  CONFLICT_REGION: "conflict-region",
  CONFLICT_ADJACENT: "conflict-adjacent",

  // Interactive states
  HIGHLIGHTED: "highlighted",
  HOVERED: "hovered",
  SELECTED: "selected",
  DISABLED: "disabled",

  // Animations
  PLACING: "placing-queen",
  REMOVING: "removing-queen",
  PULSE: "pulse",
  SHAKE: "shake",
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  // Interaction
  DOUBLE_CLICK_DELAY: 300,
  LONG_PRESS_DURATION: 500,
  HOVER_DELAY: 100,

  // Feedback
  ERROR_DISPLAY_DURATION: 3000,
  SUCCESS_DISPLAY_DURATION: 2000,
  HINT_HIGHLIGHT_DURATION: 1500,

  // Performance
  DEBOUNCE_DELAY: 100,
  THROTTLE_DELAY: 16, // ~60fps
} as const;

/**
 * Error messages with user-friendly text
 */
export const ERROR_MESSAGES = {
  SAME_ROW: "Queens cannot be in the same row! 👑",
  SAME_COLUMN: "Queens cannot be in the same column! 👑",
  SAME_REGION: "Only one queen per colored region! 🎨",
  ADJACENT: "Queens cannot touch each other! 🚫",
  INVALID_MOVE: "This move is not allowed! ❌",
  GENERATION_FAILED: "Failed to generate a new puzzle. Please try again! 🔄",
  INVALID_GRID_SIZE: `Grid size must be between ${MIN_GRID_SIZE} and ${MAX_GRID_SIZE}! 📐`,
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  PUZZLE_COMPLETED: "Congratulations! Puzzle solved! 🎉",
  QUEEN_PLACED: "Queen placed successfully! 👑",
  LEVEL_GENERATED: "New puzzle generated! ✨",
  HINT_REVEALED: "Here's a hint! 💡",
  GAME_RESET: "Game reset! Ready for a new challenge! 🔄",
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  GAME_STATE: "queens-game-state",
  USER_PREFERENCES: "queens-game-preferences",
  GAME_STATISTICS: "queens-game-stats",
  BEST_TIMES: "queens-game-best-times",
} as const;

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES = {
  gridSize: DEFAULT_GRID_SIZE,
  complexity: "medium" as const,
  enableHints: true,
  enableTimer: true,
  enableAnimations: true,
  enableSounds: false,
  showConflicts: true,
  autoSave: true,
} as const;

/**
 * Game event types for analytics/debugging
 */
export const GAME_EVENTS = {
  GAME_STARTED: "game_started",
  QUEEN_PLACED: "queen_placed",
  QUEEN_REMOVED: "queen_removed",
  CELL_MARKED: "cell_marked",
  HINT_REQUESTED: "hint_requested",
  GAME_COMPLETED: "game_completed",
  GAME_RESET: "game_reset",
  SIZE_CHANGED: "size_changed",
  COMPLEXITY_CHANGED: "complexity_changed",
} as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE = {
  GENERATION_TIMEOUT: 10000, // 10 seconds
  FAST_GENERATION: 1000, // 1 second
  MAX_HISTORY_EVENTS: 100,
  MAX_UNDO_STEPS: 20,
} as const;

/**
 * Breakpoints for responsive design (matching your CSS)
 */
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
} as const;

/**
 * Game statistics tracking
 */
export const STATS_CONFIG = {
  TRACK_MOVES: true,
  TRACK_TIME: true,
  TRACK_HINTS: true,
  TRACK_COMPLETION_RATE: true,
  TRACK_BEST_TIMES: true,
} as const;

/**
 * Feature flags for gradual rollout
 */
export const FEATURE_FLAGS = {
  ENABLE_HINTS: true,
  ENABLE_TIMER: true,
  ENABLE_STATISTICS: true,
  ENABLE_ANIMATIONS: true,
  ENABLE_SOUND_EFFECTS: false, // Future feature
  ENABLE_MULTIPLAYER: false, // Future feature
  ENABLE_CUSTOM_THEMES: false, // Future feature
  ENABLE_LEVEL_EDITOR: false, // Future feature
} as const;

/**
 * Accessibility configuration
 */
export const A11Y_CONFIG = {
  ENABLE_KEYBOARD_NAVIGATION: true,
  ENABLE_SCREEN_READER: true,
  ENABLE_HIGH_CONTRAST: true,
  ENABLE_REDUCED_MOTION: true,
  FOCUS_TRAP_ENABLED: true,
} as const;

/**
 * Type-safe getters for configuration
 */
export function getComplexityConfig(
  complexity: keyof typeof COMPLEXITY_LEVELS
) {
  return COMPLEXITY_LEVELS[complexity];
}

export function isValidGridSize(
  size: number
): size is (typeof SUPPORTED_GRID_SIZES)[number] {
  return SUPPORTED_GRID_SIZES.includes(size as any);
}

export function isValidComplexity(
  complexity: string
): complexity is keyof typeof COMPLEXITY_LEVELS {
  return complexity in COMPLEXITY_LEVELS;
}

/**
 * CSS custom properties for theming
 */
export const CSS_VARIABLES = {
  // Primary colors (matching LinkedIn theme)
  PRIMARY_COLOR: "--color-primary",
  PRIMARY_HOVER: "--color-primary-hover",
  PRIMARY_LIGHT: "--color-primary-light",

  // Grid colors
  GRID_BORDER: "--color-grid-border",
  CELL_BACKGROUND: "--color-cell-bg",
  CELL_HOVER: "--color-cell-hover",

  // Conflict colors
  CONFLICT_BACKGROUND: "--color-conflict-bg",
  CONFLICT_BORDER: "--color-conflict-border",

  // Spacing
  CELL_SIZE: "--cell-size",
  CELL_GAP: "--cell-gap",
  BORDER_RADIUS: "--border-radius",

  // Animation
  TRANSITION_DURATION: "--transition-duration",
  ANIMATION_EASING: "--animation-easing",
} as const;

/**
 * Helper function to get CSS variable value
 */
export function getCSSVariable(variable: keyof typeof CSS_VARIABLES): string {
  return `var(${CSS_VARIABLES[variable]})`;
}

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  NEW_GAME: "KeyN",
  RESET_GAME: "KeyR",
  GET_HINT: "KeyH",
  TOGGLE_TIMER: "KeyT",
  ESCAPE: "Escape",
  ENTER: "Enter",
  SPACE: "Space",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
} as const;

/**
 * Mobile touch configuration
 */
export const TOUCH_CONFIG = {
  TAP_THRESHOLD: 10, // pixels
  DOUBLE_TAP_DELAY: 300, // milliseconds
  LONG_PRESS_DELAY: 500, // milliseconds
  SWIPE_THRESHOLD: 50, // pixels
} as const;
