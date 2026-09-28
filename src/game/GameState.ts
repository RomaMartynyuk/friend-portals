import { initialLightPuzzle, resetLightCrystals, rotateLightCrystal, type CrystalId, type LightPuzzleState } from '../portals/light/LightPuzzleState';
import type { GameProgress } from './ProgressStore';
export type SceneId = 'ISLAND' | 'TEMPLE_LIGHT';
export type PortalStatus = 'active' | 'locked' | 'complete';
export type GameState = Readonly<{
  scene: SceneId;
  completedPortals: readonly number[];
  light: LightPuzzleState;
  pendingIslandEvent: number | null;
  islandEvent: number | null;
}>;
export const initialGameState: GameState = { scene: 'ISLAND', completedPortals: [], light: initialLightPuzzle, pendingIslandEvent: null, islandEvent: null };
export function restoreGameState(progress: GameProgress): GameState {
  return { ...initialGameState, completedPortals: progress.completedPortals, light: progress.light };
}
export function gameProgress(state: GameState): GameProgress { return { completedPortals: state.completedPortals, light: state.light }; }
export function portalStatus(state: GameState, portal: number): PortalStatus {
  if (state.completedPortals.includes(portal)) return 'complete';
  return portal === state.completedPortals.length + 1 ? 'active' : 'locked';
}
export function enterPortal(state: GameState, portal: number): GameState {
  return state.scene === 'ISLAND' && portal === 1 && portalStatus(state, portal) !== 'locked'
    ? { ...state, scene: 'TEMPLE_LIGHT', islandEvent: null } : state;
}
export function rotateCrystal(state: GameState, crystal: CrystalId): GameState {
  if (state.scene !== 'TEMPLE_LIGHT') return state;
  const light = rotateLightCrystal(state.light, crystal);
  return light === state.light ? state : { ...state, light };
}
export function resetPuzzle(state: GameState): GameState {
  if (state.scene !== 'TEMPLE_LIGHT') return state;
  return { ...state, light: resetLightCrystals(state.light) };
}
export function revealShard(state: GameState): GameState {
  return state.scene === 'TEMPLE_LIGHT' && state.light.phase === 'charging'
    ? { ...state, light: { ...state.light, phase: 'shard-ready' } } : state;
}
export function claimShard(state: GameState): GameState {
  if (state.scene !== 'TEMPLE_LIGHT' || state.light.phase !== 'shard-ready' || state.completedPortals.includes(1)) return state;
  return { ...state, light: { ...state.light, phase: 'claimed' }, completedPortals: [...state.completedPortals, 1], pendingIslandEvent: 1 };
}
export function returnToIsland(state: GameState): GameState {
  if (state.scene !== 'TEMPLE_LIGHT') return state;
  return { ...state, scene: 'ISLAND', islandEvent: state.pendingIslandEvent, pendingIslandEvent: null };
}
export function finishIslandEvent(state: GameState): GameState {
  return state.islandEvent === null ? state : { ...state, islandEvent: null };
}
