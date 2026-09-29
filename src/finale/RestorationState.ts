export type RestorationPhase = 'dormant' | 'playing' | 'complete';
export type RestorationState = Readonly<{ phase: RestorationPhase; startedAt: number | null }>;
export const initialRestorationState: RestorationState = { phase: 'dormant', startedAt: null };

export const RESTORATION_SECONDS = 13.2;
export const restorationStages = [
  { at: 0, id: 'awakening', label: 'THE FOUR PORTALS ANSWER' },
  { at: 1, id: 'light', label: 'LIGHT RETURNS' },
  { at: 2.4, id: 'echo', label: 'ECHO RETURNS' },
  { at: 3.8, id: 'balance', label: 'BALANCE RETURNS' },
  { at: 5.2, id: 'celestial', label: 'THE STARS RETURN' },
  { at: 6.7, id: 'sockets', label: 'FOUR SHARDS · ONE ISLAND' },
  { at: 8.1, id: 'monument', label: 'THE MONUMENT RISES' },
  { at: 9.7, id: 'sigil', label: 'A JOURNEY TAKES SHAPE' },
  { at: 12.1, id: 'restored', label: 'THE ISLAND IS RESTORED' },
] as const;
export type RestorationStage = (typeof restorationStages)[number]['id'];
export function restorationStage(elapsedSeconds: number): RestorationStage {
  for (let index = restorationStages.length - 1; index >= 0; index--) {
    if (elapsedSeconds >= restorationStages[index].at) return restorationStages[index].id;
  }
  return 'awakening';
}
export function beginRestoration(state: RestorationState, allShards: boolean, onIsland: boolean, now: number): RestorationState {
  return state.phase === 'dormant' && allShards && onIsland
    ? { phase: 'playing', startedAt: now } : state;
}
export function finishRestoration(state: RestorationState): RestorationState {
  return state.phase === 'playing' ? { ...state, phase: 'complete' } : state;
}
