import { forkSeed, seededRandom, worldSeed, type RunSeed } from '../game/seededRun';

export type WorldCosmetics = Readonly<{
  sky: string;
  props: readonly { id: number; x: number; z: number; scale: number; kind: 'tree' | 'rock'; crystal: boolean }[];
  flowers: readonly { id: number; x: number; z: number; color: string }[];
  clouds: readonly { id: number; x: number; z: number; height: number; scale: number }[];
}>;

/** Decorative positions only. Paths, portals, island geometry and interaction zones stay fixed. */
export function createWorldCosmetics(runSeed: RunSeed, identitySeed: number): WorldCosmetics {
  const root = worldSeed(runSeed).toString(16);
  const make = (name: string, index: number) => seededRandom(forkSeed(root, `${name}:${index}`));
  const props = Array.from({ length: 43 }, (_, id) => {
    const random = make('prop', id), angle = random() * Math.PI * 2, radius = 4.5 + random() * 4.7;
    return { id, x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, scale: 0.52 + random() * 0.55,
      kind: random() > 0.57 ? 'tree' as const : 'rock' as const, crystal: random() < 0.15 };
  }).filter(prop => Math.abs(prop.x) > 1.45 && Math.abs(prop.z) > 1.45);
  const flowerPalette = [
    ['#e8d89a', '#d9b1bb', '#dfebe0'],
    ['#e4d5a4', '#c6b9d4', '#d5eadf'],
    ['#e9d6ad', '#d4b3bb', '#cce5dd'],
  ][identitySeed % 3];
  const flowers = Array.from({ length: 48 }, (_, id) => {
    const random = make('flower', id), angle = random() * Math.PI * 2, radius = 3.0 + random() * 6.4;
    return { id, x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, color: flowerPalette[Math.floor(random() * flowerPalette.length)] };
  }).filter(flower => Math.abs(flower.x) > 0.85 && Math.abs(flower.z) > 0.85);
  const clouds = Array.from({ length: 12 }, (_, id) => {
    const random = make('cloud', id), angle = id * Math.PI / 6 + (random() - 0.5) * 0.32;
    return { id, x: Math.cos(angle) * (11.5 + random()), z: Math.sin(angle) * (11.5 + random()), height: (random() - 0.5) * 1.2, scale: 0.9 + random() * 0.25 };
  });
  const sky = ['#b8d4d0', '#bad5cf', '#b8d0d1'][forkSeed(root, 'sky') % 3];
  return { sky, props, flowers, clouds };
}
