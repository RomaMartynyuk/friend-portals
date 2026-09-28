import type { RunSeed } from '../../game/seededRun';
import { balanceLayoutForSeed, balanceLayouts, insideBalanceGrid, plateForCell, type Cell, type PlateId } from './balanceLayouts';

export type BalancePhase = 'routing' | 'mechanism' | 'finale' | 'shard-ready' | 'claimed';
export type BalanceStage = 0 | 1 | 2 | 3;
export type BalancePuzzleState = Readonly<{
  layout: number;
  blocks: readonly Cell[];
  stage: BalanceStage;
  phase: BalancePhase;
}>;
export type PushDirection = Readonly<{ x: -1 | 0 | 1; row: -1 | 0 | 1 }>;
export type PushResult = Readonly<{ next: BalancePuzzleState; result: 'moved' | 'boundary' | 'occupied' | 'locked'; balanced: readonly PlateId[] }>;

export function initialBalancePuzzle(runSeed: RunSeed): BalancePuzzleState {
  const layout = balanceLayoutForSeed(runSeed);
  return { layout, blocks: balanceLayouts[layout].blocks.map(block => block.start), stage: 0, phase: 'routing' };
}
export function plateWeights(balance: BalancePuzzleState): Readonly<Record<PlateId, number>> {
  const weights = { A: 0, B: 0, C: 0 };
  balance.blocks.forEach((cell, index) => { const plate = plateForCell(cell); if (plate) weights[plate] += balanceLayouts[balance.layout].blocks[index].weight; });
  return weights;
}
export function pushBalanceBlock(balance: BalancePuzzleState, block: number, direction: PushDirection): PushResult {
  if (balance.phase !== 'routing' || !balance.blocks[block]) return { next: balance, result: 'locked', balanced: [] };
  const origin = balance.blocks[block];
  const destination: Cell = [origin[0] + direction.x, origin[1] + direction.row];
  if (!insideBalanceGrid(destination)) return { next: balance, result: 'boundary', balanced: [] };
  if (balance.blocks.some((cell, index) => index !== block && cell[0] === destination[0] && cell[1] === destination[1])) return { next: balance, result: 'occupied', balanced: [] };
  const blocks = balance.blocks.map((cell, index) => index === block ? destination : cell);
  const moved: BalancePuzzleState = { ...balance, blocks };
  const weights = plateWeights(moved), targets = balanceLayouts[balance.layout].targets;
  const balanced = (['A', 'B', 'C'] as const).filter(plate => weights[plate] === targets[plate]);
  if (balance.stage === 0 && balanced.includes('A')) return { next: { ...moved, stage: 1, phase: 'mechanism' }, result: 'moved', balanced };
  if (balance.stage === 1 && balanced.includes('B')) return { next: { ...moved, stage: 2, phase: 'mechanism' }, result: 'moved', balanced };
  if (balance.stage === 2 && balanced.includes('A') && balanced.includes('C')) return { next: { ...moved, stage: 3, phase: 'finale' }, result: 'moved', balanced };
  return { next: moved, result: 'moved', balanced };
}
export function finishBalanceMechanism(balance: BalancePuzzleState): BalancePuzzleState {
  return balance.phase === 'mechanism' ? { ...balance, phase: 'routing' } : balance;
}
export function revealBalanceShard(balance: BalancePuzzleState): BalancePuzzleState {
  return balance.phase === 'finale' ? { ...balance, phase: 'shard-ready' } : balance;
}
export function resetBalancePuzzle(balance: BalancePuzzleState): BalancePuzzleState {
  if (balance.phase === 'claimed' || balance.phase === 'shard-ready') return balance;
  return { layout: balance.layout, blocks: balanceLayouts[balance.layout].blocks.map(block => block.start), stage: 0, phase: 'routing' };
}
export function balanceWalkable(balance: BalancePuzzleState, x: number, z: number): boolean {
  if (Math.abs(x) <= 5.66 && z >= 0.09 && z <= 7.7) return true;
  if (balance.phase !== 'shard-ready' && balance.phase !== 'claimed') return false;
  return (Math.abs(x) <= 1.05 && z >= -4.8 && z <= 0.1) || (Math.hypot(x, z + 6.05) <= 2.38);
}
