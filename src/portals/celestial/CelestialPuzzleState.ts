import type { RunSeed } from '../../game/seededRun';
import { celestialConfigForSeed, constellations, normalizeAngle, ringSymbols, TAU, type CelestialConfig, type RingId } from './celestialConfig';

export type CelestialPhase = 'clue' | 'running' | 'retry' | 'finale' | 'shard-ready' | 'claimed';
export type CelestialPuzzleState = Readonly<{
  constellation: number;
  angles: readonly [number, number, number];
  lockedCount: 0 | 1 | 2 | 3;
  phase: CelestialPhase;
  retryRing: RingId | null;
}>;
export const GOOD_WINDOW = 0.32; // 18.3 degrees on either side of the marker.
export const PERFECT_WINDOW = 0.085;

export function initialCelestialPuzzle(runSeed: RunSeed): CelestialPuzzleState {
  const config = celestialConfigForSeed(runSeed);
  return { constellation: config.constellation, angles: config.starts, lockedCount: 0, phase: 'clue', retryRing: null };
}
export function advanceCelestial(state: CelestialPuzzleState, config: CelestialConfig, elapsedSeconds: number): CelestialPuzzleState {
  if (state.phase !== 'running' || elapsedSeconds <= 0) return state;
  const angles = state.angles.map((angle, index) => index < state.lockedCount ? angle : normalizeAngle(angle + config.speeds[index] * config.directions[index] * elapsedSeconds)) as [number, number, number];
  return { ...state, angles };
}
export function angularError(angle: number, targetAngle: number): number {
  const difference = normalizeAngle(angle - targetAngle);
  return Math.min(difference, TAU - difference);
}
export function targetAngle(state: CelestialPuzzleState, ring: RingId): number {
  const target = constellations[state.constellation].targets[ring];
  const index = ringSymbols[ring].indexOf(target);
  return normalizeAngle(-index * TAU / ringSymbols[ring].length);
}
export type LockVerdict = 'ignored' | 'miss' | 'good' | 'perfect' | 'finale';
export function lockCelestialRing(state: CelestialPuzzleState, ring: RingId): { next: CelestialPuzzleState; verdict: LockVerdict; error: number } {
  if (state.phase !== 'running' || ring !== state.lockedCount) return { next: state, verdict: 'ignored', error: Infinity };
  const error = angularError(state.angles[ring], targetAngle(state, ring));
  if (error > GOOD_WINDOW) return { next: { ...state, phase: 'retry', retryRing: ring }, verdict: 'miss', error };
  const lockedCount = (state.lockedCount + 1) as 1 | 2 | 3;
  return { next: { ...state, lockedCount, phase: lockedCount === 3 ? 'finale' : 'running', retryRing: null }, verdict: lockedCount === 3 ? 'finale' : error <= PERFECT_WINDOW ? 'perfect' : 'good', error };
}
export function beginCelestialMotion(state: CelestialPuzzleState): CelestialPuzzleState {
  return state.phase === 'clue' || state.phase === 'retry' ? { ...state, phase: 'running', retryRing: null } : state;
}
export function showConstellationClue(state: CelestialPuzzleState): CelestialPuzzleState {
  return state.phase === 'running' ? { ...state, phase: 'clue' } : state;
}
export function materializeCelestialShard(state: CelestialPuzzleState): CelestialPuzzleState {
  return state.phase === 'finale' ? { ...state, phase: 'shard-ready' } : state;
}
export function resetCelestialPuzzle(state: CelestialPuzzleState, runSeed: RunSeed): CelestialPuzzleState {
  return state.phase === 'claimed' || state.phase === 'shard-ready' ? state : initialCelestialPuzzle(runSeed);
}
