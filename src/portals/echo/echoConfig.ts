import { portalSeed, type RunSeed } from '../../game/seededRun';
export type RuneId = 0 | 1 | 2 | 3 | 4;
export const echoRunes = [
  { name: 'Sun', symbol: 'sun', pitch: 261.63, color: '#8bd6cb', x: 0, z: -3.65 },
  { name: 'Twin', symbol: 'twin', pitch: 293.66, color: '#a9dec3', x: 3.1, z: -1.25 },
  { name: 'Peak', symbol: 'peak', pitch: 329.63, color: '#c4dfa6', x: 2.55, z: 2.6 },
  { name: 'Diamond', symbol: 'diamond', pitch: 392.0, color: '#8edac3', x: -2.55, z: 2.6 },
  { name: 'Cross', symbol: 'cross', pitch: 440.0, color: '#93d5df', x: -3.1, z: -1.25 },
] as const;
export type EchoSequences = readonly [readonly RuneId[], readonly RuneId[], readonly RuneId[]];
/** Authored musical paths transformed by the Echo portal seed. */
const sequenceBanks: readonly EchoSequences[] = [
  [[0, 3, 1], [4, 1, 3, 0], [2, 4, 0, 3, 1]],
  [[1, 4, 2], [3, 0, 2, 4], [0, 3, 1, 4, 2]],
  [[2, 0, 4], [1, 3, 0, 2], [4, 1, 3, 0, 2]],
  [[4, 2, 0], [0, 3, 1, 4], [1, 4, 2, 0, 3]],
];
export function echoSequencesForSeed(runSeed: RunSeed): EchoSequences {
  const seed = portalSeed(runSeed, 'echo');
  const bank = sequenceBanks[seed % sequenceBanks.length];
  const rotation = (seed >>> 3) % 5;
  const direction = (seed & 0x100) ? -1 : 1;
  const transform = (rune: RuneId) => ((rotation + direction * rune + 5) % 5) as RuneId;
  return bank.map(round => round.map(transform)) as unknown as EchoSequences;
}
export const echoTriggerRadius = 1.1;
