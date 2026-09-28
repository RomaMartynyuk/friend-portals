/** A run is identified by a string so fixed QA seeds and generated seeds use one path. */
export type RunSeed = string;
export type RunScope = 'world' | 'light' | 'echo' | 'balance' | 'celestial';

export function createRunSeed(): RunSeed {
  const words = new Uint32Array(4);
  globalThis.crypto.getRandomValues(words);
  return Array.from(words, word => word.toString(16).padStart(8, '0')).join('');
}

/** Named forks are independent: adding a world prop cannot alter a portal puzzle. */
export function forkSeed(runSeed: RunSeed, scope: string): number {
  let hash = 2166136261;
  const key = `${runSeed.length}:${runSeed}|${scope}`;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  return (hash ^ (hash >>> 16)) >>> 0;
}

export const portalSeed = (runSeed: RunSeed, portal: Exclude<RunScope, 'world'>) => forkSeed(runSeed, `portal:${portal}`);
export const worldSeed = (runSeed: RunSeed) => forkSeed(runSeed, 'world');

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
