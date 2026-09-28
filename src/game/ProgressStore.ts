import { initialLightPuzzle, type LightPuzzleState } from '../portals/light/LightPuzzleState';
import { initialEchoPuzzle, type EchoPuzzleState } from '../portals/echo/EchoPuzzleState';
import { initialBalancePuzzle, type BalancePuzzleState } from '../portals/balance/BalancePuzzleState';
import { createRunSeed, type RunSeed } from './seededRun';
export type GameProgress = Readonly<{ runSeed: RunSeed; completedPortals: readonly number[]; light: LightPuzzleState; echo: EchoPuzzleState; balance: BalancePuzzleState }>;
export function initialProgress(runSeed: RunSeed): GameProgress {
  return { runSeed, completedPortals: [], light: initialLightPuzzle(runSeed), echo: initialEchoPuzzle(runSeed), balance: initialBalancePuzzle(runSeed) };
}
export interface ProgressStore {
  read(friendId: bigint, fixedSeed?: RunSeed): GameProgress;
  write(friendId: bigint, progress: GameProgress): void;
}
const sessions = new Map<string, GameProgress>();
export const sessionProgressStore: ProgressStore = {
  read(friendId, fixedSeed) {
    const key = friendId.toString();
    let progress = sessions.get(key);
    if (!progress) { progress = initialProgress(fixedSeed ?? createRunSeed()); sessions.set(key, progress); }
    return progress;
  },
  write(friendId, progress) {
    sessions.set(friendId.toString(), progress);
  },
};
