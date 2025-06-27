export interface PredefinedLevel {
  id: string;
  gridSize: number;
  difficulty: "easy" | "medium" | "hard";
  solution: { row: number; col: number }[];
  regions: {
    id: number;
    color: string;
    cells: { row: number; col: number }[];
  }[];
  metadata: {
    attempts: number;
    generationTime: number;
    verified: boolean;
    createdAt: string;
  };
}

export interface LevelBank {
  version: string;
  levels: {
    [gridSize: string]: {
      [difficulty: string]: PredefinedLevel[];
    };
  };
}