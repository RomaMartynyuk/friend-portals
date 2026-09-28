export type RuneId = 0 | 1 | 2 | 3 | 4;
export const echoRunes = [
  { name: 'Sun', symbol: 'sun', pitch: 261.63, color: '#8bd6cb', x: 0, z: -3.65 },
  { name: 'Twin', symbol: 'twin', pitch: 293.66, color: '#a9dec3', x: 3.1, z: -1.25 },
  { name: 'Peak', symbol: 'peak', pitch: 329.63, color: '#c4dfa6', x: 2.55, z: 2.6 },
  { name: 'Diamond', symbol: 'diamond', pitch: 392.0, color: '#8edac3', x: -2.55, z: 2.6 },
  { name: 'Cross', symbol: 'cross', pitch: 440.0, color: '#93d5df', x: -3.1, z: -1.25 },
] as const;
export const echoSequences: readonly (readonly RuneId[])[] = [
  [0, 3, 1],
  [4, 1, 3, 0],
  [2, 4, 0, 3, 1],
];
export const echoTriggerRadius = 1.1;
