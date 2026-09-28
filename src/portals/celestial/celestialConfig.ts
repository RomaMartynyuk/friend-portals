import { forkSeed, type RunSeed } from '../../game/seededRun';

export const celestialSymbols = ['STAR', 'MOON', 'EYE', 'COMET', 'CROWN', 'SPIRAL', 'DIAMOND', 'TWIN', 'PEAK', 'SUN'] as const;
export type CelestialSymbol = typeof celestialSymbols[number];
export type RingId = 0 | 1 | 2;
export const ringNames = ['OUTER', 'MIDDLE', 'INNER'] as const;
export const ringSymbols: readonly (readonly CelestialSymbol[])[] = [
  ['STAR', 'MOON', 'EYE', 'COMET', 'CROWN', 'SPIRAL', 'DIAMOND', 'TWIN'],
  ['MOON', 'SUN', 'COMET', 'PEAK', 'EYE', 'DIAMOND', 'STAR', 'CROWN'],
  ['CROWN', 'TWIN', 'SPIRAL', 'SUN', 'PEAK', 'STAR', 'EYE', 'COMET'],
];
export type Constellation = Readonly<{ name: string; targets: readonly [CelestialSymbol, CelestialSymbol, CelestialSymbol]; stars: readonly [number, number, number] }>;
/** Original geometric symbols; each target is present on its corresponding ring. */
export const constellations: readonly Constellation[] = [
  { name: 'THE WANDERER', targets: ['MOON', 'COMET', 'CROWN'], stars: [-0.4, 0.9, -0.2] },
  { name: 'THE TWIN', targets: ['TWIN', 'SUN', 'TWIN'], stars: [0.5, -0.35, 0.7] },
  { name: 'THE CROWN', targets: ['CROWN', 'CROWN', 'STAR'], stars: [-0.8, 0.25, 0.55] },
  { name: 'THE EYE', targets: ['EYE', 'EYE', 'EYE'], stars: [0.15, 1.0, -0.45] },
  { name: 'THE VOYAGER', targets: ['STAR', 'PEAK', 'COMET'], stars: [-0.7, -0.1, 0.85] },
  { name: 'THE FORGE', targets: ['DIAMOND', 'DIAMOND', 'SUN'], stars: [0.75, 0.55, -0.6] },
  { name: 'THE FALLING STAR', targets: ['COMET', 'STAR', 'SPIRAL'], stars: [-0.2, -0.75, 0.95] },
  { name: 'THE GATE', targets: ['SPIRAL', 'MOON', 'PEAK'], stars: [0.9, -0.45, 0.2] },
];
export type CelestialConfig = Readonly<{ constellation: number; starts: readonly [number, number, number]; speeds: readonly [number, number, number]; directions: readonly [1 | -1, 1 | -1, 1 | -1]; skySeed: number }>;
export const TAU = Math.PI * 2;
export const normalizeAngle = (angle: number) => ((angle % TAU) + TAU) % TAU;

/** Each motion value has its own name, so adding sky decoration cannot change puzzle timing. */
export function celestialConfigForSeed(runSeed: RunSeed): CelestialConfig {
  const rings = ringNames.map((name, index) => {
    const seed = forkSeed(runSeed, `portal:celestial:${name.toLowerCase()}`);
    return { start: normalizeAngle((seed % 360) * Math.PI / 180), speed: [0.37, 0.46, 0.55][index] + ((seed >>> 12) % 5) * 0.012, direction: ((seed >>> 20) & 1 ? -1 : 1) as 1 | -1 };
  });
  return {
    constellation: forkSeed(runSeed, 'portal:celestial:constellation') % constellations.length,
    starts: rings.map(ring => ring.start) as [number, number, number],
    speeds: rings.map(ring => ring.speed) as [number, number, number],
    directions: rings.map(ring => ring.direction) as [1 | -1, 1 | -1, 1 | -1],
    skySeed: forkSeed(runSeed, 'portal:celestial:sky'),
  };
}
