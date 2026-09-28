export type SceneId = 'ISLAND' | 'PORTAL_1_TEST';
export type PortalStatus = 'active' | 'locked' | 'complete';
export type GameState = Readonly<{ scene: SceneId; completed: readonly number[] }>;
export const initialGameState: GameState = { scene: 'ISLAND', completed: [] };
export function portalStatus(state: GameState, portal: number): PortalStatus {
  if (state.completed.includes(portal)) return 'complete';
  return portal === state.completed.length + 1 ? 'active' : 'locked';
}
export function enterTestRoom(state: GameState): GameState {
  return state.scene === 'ISLAND' && portalStatus(state, 1) === 'active' ? { ...state, scene: 'PORTAL_1_TEST' } : state;
}
export function returnToIsland(state: GameState): GameState { return { ...state, scene: 'ISLAND' }; }
