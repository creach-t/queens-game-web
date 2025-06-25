import { ColoredRegion } from "../types/game";

interface Position {
  row: number;
  col: number;
}

const REGION_COLORS = [
  "#26A69A", "#BA68C8", "#81C784", "#FFB74D",
  "#F06292", "#D4E157", "#4DD0E1", "#F84343"
];

type Strategy = "weighted_distance" | "random_growth" | "size_balancing";

export class RegionBuilder {
  private ownership: number[][];

  constructor(private gridSize: number) {
    this.ownership = Array(gridSize).fill(null).map(() => Array(gridSize).fill(-1));
  }

  buildAroundQueens(queens: Position[]): ColoredRegion[] {
    const regions = this.initializeRegions(queens);
    this.markQueenPositions(queens);
    this.expandRegions(regions, queens);
    this.assignRemainingCells(regions, queens);
    return regions;
  }

  private initializeRegions(queens: Position[]): ColoredRegion[] {
    return queens.map((queen, index) => ({
      id: index,
      color: REGION_COLORS[index % REGION_COLORS.length],
      cells: [queen],
      hasQueen: true,
      queenPosition: queen,
    }));
  }

  private markQueenPositions(queens: Position[]): void {
    queens.forEach((queen, index) => {
      this.ownership[queen.row][queen.col] = index;
    });
  }

  private expandRegions(regions: ColoredRegion[], queens: Position[]): void {
    const strategies: Strategy[] = ["weighted_distance", "random_growth", "size_balancing"];
    let strategyIndex = 0;

    for (let wave = 0; wave < this.gridSize * 2; wave++) {
      const strategy = strategies[strategyIndex % strategies.length];
      const assigned = this.expandWave(regions, queens, strategy);

      if (assigned === 0) break;
      if ((wave + 1) % 3 === 0) strategyIndex++;
    }
  }

  private expandWave(regions: ColoredRegion[], queens: Position[], strategy: Strategy): number {
    const candidates = this.collectCandidates(regions, queens, strategy);
    if (candidates.length === 0) return 0;

    candidates.sort((a, b) => b.priority - a.priority);
    const toAssign = Math.min(candidates.length, Math.max(1, Math.floor(candidates.length / 3)));

    let assigned = 0;
    for (let i = 0; i < toAssign; i++) {
      const { pos, regionId } = candidates[i];
      if (this.ownership[pos.row][pos.col] === -1) {
        this.ownership[pos.row][pos.col] = regionId;
        regions[regionId].cells.push(pos);
        assigned++;
      }
    }
    return assigned;
  }

  private collectCandidates(regions: ColoredRegion[], queens: Position[], strategy: Strategy) {
    const candidates: Array<{pos: Position; regionId: number; priority: number}> = [];

    regions.forEach((region, regionId) => {
      const perimeter = this.getPerimeter(region.cells);
      perimeter.forEach(pos => {
        if (this.ownership[pos.row][pos.col] === -1) {
          const priority = this.calculatePriority(pos, queens[regionId], region, strategy);
          candidates.push({ pos, regionId, priority });
        }
      });
    });

    return candidates;
  }

  private calculatePriority(pos: Position, queen: Position, region: ColoredRegion, strategy: Strategy): number {
    switch (strategy) {
      case "weighted_distance":
        const distance = Math.sqrt((pos.row - queen.row) ** 2 + (pos.col - queen.col) ** 2);
        return 100 - distance + Math.random() * 20;

      case "random_growth":
        return Math.random() * 100;

      case "size_balancing":
        const targetSize = Math.floor((this.gridSize ** 2) / region.cells.length);
        const sizeDiff = targetSize - region.cells.length;
        return Math.max(0, sizeDiff * 10) + Math.random() * 30;
    }
  }

  private getPerimeter(cells: Position[]): Position[] {
    const perimeter: Position[] = [];
    const cellSet = new Set(cells.map(c => `${c.row}-${c.col}`));
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    cells.forEach(cell => {
      directions.forEach(([dr, dc]) => {
        const newRow = cell.row + dr;
        const newCol = cell.col + dc;

        if (this.isValidCell(newRow, newCol) && !cellSet.has(`${newRow}-${newCol}`)) {
          if (!perimeter.some(p => p.row === newRow && p.col === newCol)) {
            perimeter.push({ row: newRow, col: newCol });
          }
        }
      });
    });

    return perimeter;
  }

  private assignRemainingCells(regions: ColoredRegion[], queens: Position[]): void {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.ownership[row][col] === -1) {
          const closestRegion = this.findClosestRegion(row, col, queens);
          this.ownership[row][col] = closestRegion;
          regions[closestRegion].cells.push({ row, col });
        }
      }
    }
  }

  private findClosestRegion(row: number, col: number, queens: Position[]): number {
    let closest = 0;
    let minDistance = Infinity;

    queens.forEach((queen, index) => {
      const distance = Math.abs(row - queen.row) + Math.abs(col - queen.col);
      if (distance < minDistance) {
        minDistance = distance;
        closest = index;
      }
    });

    return closest;
  }

  private isValidCell(row: number, col: number): boolean {
    return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
  }
}