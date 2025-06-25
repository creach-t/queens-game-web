interface Position {
  row: number;
  col: number;
}

export class NQueensSolver {
  private solution: Position[] = [];
  private usedCols = new Set<number>();

  constructor(private gridSize: number) {}

  solve(): Position[] | null {
    this.solution = [];
    this.usedCols.clear();
    return this.backtrack(0) ? [...this.solution] : null;
  }

  private backtrack(row: number): boolean {
    if (row >= this.gridSize) return true;

    const cols = this.shuffledColumns();
    for (const col of cols) {
      if (this.isValidPosition(row, col)) {
        this.placeQueen(row, col);
        if (this.backtrack(row + 1)) return true;
        this.removeQueen(col);
      }
    }
    return false;
  }

  private isValidPosition(row: number, col: number): boolean {
    if (this.usedCols.has(col)) return false;
    return !this.solution.some((queen) =>
      this.areAdjacent({ row, col }, queen)
    );
  }

  private areAdjacent(pos1: Position, pos2: Position): boolean {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  }

  private shuffledColumns(): number[] {
    const cols = Array.from({ length: this.gridSize }, (_, i) => i);
    for (let i = cols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cols[i], cols[j]] = [cols[j], cols[i]];
    }
    return cols;
  }

  private placeQueen(row: number, col: number): void {
    this.solution.push({ row, col });
    this.usedCols.add(col);
  }

  private removeQueen(col: number): void {
    this.solution.pop();
    this.usedCols.delete(col);
  }
}
