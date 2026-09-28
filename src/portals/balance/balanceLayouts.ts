import { portalSeed, type RunSeed } from '../../game/seededRun';

export type Weight = 1 | 2 | 3;
export type Cell = readonly [x: number, row: number];
export type PlateId = 'A' | 'B' | 'C';
export type BalanceLayout = Readonly<{
  blocks: readonly { weight: Weight; start: Cell }[];
  targets: Readonly<Record<PlateId, number>>;
  solution: Readonly<{ first: readonly number[]; second: readonly number[]; finalA: readonly number[]; finalC: readonly number[] }>;
}>;

/** Six authored distributions; every second stage reuses at least one first-stage block. */
export const balanceLayouts: readonly BalanceLayout[] = [
  { blocks: [{ weight: 1, start: [-2, 2] }, { weight: 2, start: [0, 3] }, { weight: 3, start: [2, 2] }], targets: { A: 2, B: 5, C: 4 }, solution: { first: [1], second: [1, 2], finalA: [1], finalC: [0, 2] } },
  { blocks: [{ weight: 1, start: [2, 3] }, { weight: 2, start: [-2, 2] }, { weight: 3, start: [0, 2] }], targets: { A: 3, B: 4, C: 3 }, solution: { first: [2], second: [0, 2], finalA: [2], finalC: [0, 1] } },
  { blocks: [{ weight: 1, start: [-1, 3] }, { weight: 2, start: [2, 2] }, { weight: 3, start: [-2, 2] }], targets: { A: 1, B: 6, C: 5 }, solution: { first: [0], second: [0, 1, 2], finalA: [0], finalC: [1, 2] } },
  { blocks: [{ weight: 1, start: [2, 3] }, { weight: 1, start: [-2, 3] }, { weight: 2, start: [1, 2] }, { weight: 3, start: [-1, 2] }], targets: { A: 4, B: 6, C: 3 }, solution: { first: [0, 3], second: [0, 2, 3], finalA: [0, 3], finalC: [1, 2] } },
  { blocks: [{ weight: 1, start: [-2, 3] }, { weight: 1, start: [2, 2] }, { weight: 2, start: [1, 3] }, { weight: 3, start: [-1, 2] }], targets: { A: 3, B: 7, C: 4 }, solution: { first: [3], second: [0, 1, 2, 3], finalA: [3], finalC: [0, 1, 2] } },
  { blocks: [{ weight: 1, start: [2, 3] }, { weight: 2, start: [-2, 2] }, { weight: 2, start: [1, 2] }, { weight: 3, start: [-1, 3] }], targets: { A: 4, B: 7, C: 4 }, solution: { first: [0, 3], second: [1, 2, 3], finalA: [0, 3], finalC: [1, 2] } },
];

export const balanceLayoutForSeed = (runSeed: RunSeed) => portalSeed(runSeed, 'balance') % balanceLayouts.length;
export const gridToWorld = (cell: Cell): readonly [number, number] => [cell[0] * 1.3, 1.6 + cell[1] * 1.3];
export function plateForCell(cell: Cell): PlateId | null {
  if (cell[1] > 1) return null;
  return cell[0] <= -2 ? 'A' : cell[0] <= 1 ? 'B' : 'C';
}
export const insideBalanceGrid = (cell: Cell) => cell[0] >= -3 && cell[0] <= 3 && cell[1] >= 0 && cell[1] <= 3;
