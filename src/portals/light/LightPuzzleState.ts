import { portalSeed, type RunSeed } from '../../game/seededRun';
export type CrystalId = 0 | 1 | 2;
export type LightPhase = 'routing' | 'charging' | 'shard-ready' | 'claimed';
export type CrystalOrientations = readonly [number, number, number];
export type LightVariant = Readonly<{ initial: CrystalOrientations; required: CrystalOrientations }>;
/** Eight authored five-turn configurations on the same verified beam route. */
export const lightVariants: readonly LightVariant[] = [
  { initial: [0, 0, 0], required: [1, 3, 1] },
  { initial: [1, 0, 2], required: [3, 1, 0] },
  { initial: [2, 1, 0], required: [3, 3, 2] },
  { initial: [3, 2, 1], required: [1, 3, 3] },
  { initial: [1, 3, 2], required: [2, 1, 0] },
  { initial: [0, 2, 3], required: [2, 3, 1] },
  { initial: [2, 0, 1], required: [0, 2, 2] },
  { initial: [3, 1, 2], required: [0, 3, 0] },
];
export const lightVariantForSeed = (runSeed: RunSeed) => portalSeed(runSeed, 'light') % lightVariants.length;
export type LightPuzzleState = Readonly<{
  variant: number;
  orientations: CrystalOrientations;
  phase: LightPhase;
}>;
export function initialLightPuzzle(runSeed: RunSeed): LightPuzzleState {
  const variant = lightVariantForSeed(runSeed);
  return { variant, orientations: lightVariants[variant].initial, phase: 'routing' };
}
export type BeamPoint = readonly [number, number, number];
export type BeamSegment = Readonly<{ from: BeamPoint; to: BeamPoint; terminal?: boolean }>;
export type BeamTrace = Readonly<{ segments: readonly BeamSegment[]; seals: 0 | 1 | 2 | 3; reachesCore: boolean }>;

// Authored, discrete route shared by all eight validated configurations.
export const lightNodes = {
  emitter: [-4, 1.33, -2] as BeamPoint,
  a: [-2, 1.33, -2] as BeamPoint,
  seal1: [-2, 1.33, 0] as BeamPoint,
  b: [0, 1.33, 0] as BeamPoint,
  seal2: [0, 1.33, -2] as BeamPoint,
  c: [2, 1.33, -2] as BeamPoint,
  seal3: [2, 1.33, 0] as BeamPoint,
  core: [4, 1.55, 0] as BeamPoint,
} as const;
export const crystalPositions = [lightNodes.a, lightNodes.b, lightNodes.c] as const;
export const sealPositions = [lightNodes.seal1, lightNodes.seal2, lightNodes.seal3] as const;
const offsets: readonly BeamPoint[] = [[1.35, 0, 0], [0, 0, 1.35], [-1.35, 0, 0], [0, 0, -1.35]];
const segment = (from: BeamPoint, to: BeamPoint, terminal = false): BeamSegment => ({ from, to, terminal });
function deadEnd(from: BeamPoint, orientation: number): BeamSegment {
  const offset = offsets[orientation];
  return segment(from, [from[0] + offset[0], from[1], from[2] + offset[2]], true);
}
export function traceLight(light: LightPuzzleState): BeamTrace {
  const orientations = light.orientations;
  const solution = lightVariants[light.variant].required;
  const n = lightNodes;
  const segments: BeamSegment[] = [segment(n.emitter, n.a)];
  if (orientations[0] !== solution[0]) { segments.push(deadEnd(n.a, orientations[0])); return { segments, seals: 0, reachesCore: false }; }
  segments.push(segment(n.a, n.seal1), segment(n.seal1, n.b));
  if (orientations[1] !== solution[1]) { segments.push(deadEnd(n.b, orientations[1])); return { segments, seals: 1, reachesCore: false }; }
  segments.push(segment(n.b, n.seal2), segment(n.seal2, n.c));
  if (orientations[2] !== solution[2]) { segments.push(deadEnd(n.c, orientations[2])); return { segments, seals: 2, reachesCore: false }; }
  segments.push(segment(n.c, n.seal3), segment(n.seal3, n.core));
  return { segments, seals: 3, reachesCore: true };
}
export function rotateLightCrystal(light: LightPuzzleState, crystal: CrystalId): LightPuzzleState {
  if (light.phase !== 'routing') return light;
  const next = [...light.orientations] as [number, number, number];
  next[crystal] = (next[crystal] + 1) % 4;
  const updated = { ...light, orientations: next };
  return { ...updated, phase: traceLight(updated).reachesCore ? 'charging' : 'routing' };
}
export function resetLightCrystals(light: LightPuzzleState): LightPuzzleState {
  return light.phase === 'routing' ? { ...light, orientations: lightVariants[light.variant].initial } : light;
}
