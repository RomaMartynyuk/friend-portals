import { initialLightPuzzle, type LightPuzzleState } from '../portals/light/LightPuzzleState';
export type GameProgress = Readonly<{ completedPortals: readonly number[]; light: LightPuzzleState }>;
export interface ProgressStore {
  read(friendId: bigint): GameProgress;
  write(friendId: bigint, progress: GameProgress): void;
}
const sessions = new Map<string, GameProgress>();
export const sessionProgressStore: ProgressStore = {
  read(friendId) {
    return sessions.get(friendId.toString()) ?? { completedPortals: [], light: initialLightPuzzle };
  },
  write(friendId, progress) {
    sessions.set(friendId.toString(), progress);
  },
};
