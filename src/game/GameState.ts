import { initialLightPuzzle, resetLightCrystals, rotateLightCrystal, type CrystalId, type LightPuzzleState } from '../portals/light/LightPuzzleState';
import type { GameProgress } from './ProgressStore';
import { initialEchoPuzzle, prepareEchoEntry, pauseEchoForExit, allowEchoInput, submitEchoRune, restartEchoRound, beginNextEchoRound, revealEchoShard, type EchoPuzzleState } from '../portals/echo/EchoPuzzleState';
import type { RuneId } from '../portals/echo/echoConfig';
export type SceneId = 'ISLAND' | 'TEMPLE_LIGHT' | 'ECHO_GARDEN';
export type PortalStatus = 'active' | 'locked' | 'complete';
export type GameState = Readonly<{
  scene: SceneId;
  completedPortals: readonly number[];
  light: LightPuzzleState;
  echo: EchoPuzzleState;
  pendingIslandEvent: number | null;
  islandEvent: number | null;
}>;
export const initialGameState: GameState = { scene: 'ISLAND', completedPortals: [], light: initialLightPuzzle, echo: initialEchoPuzzle, pendingIslandEvent: null, islandEvent: null };
export function restoreGameState(progress: GameProgress): GameState {
  return { ...initialGameState, completedPortals: progress.completedPortals, light: progress.light, echo: progress.echo };
}
export function gameProgress(state: GameState): GameProgress { return { completedPortals: state.completedPortals, light: state.light, echo: state.echo }; }
export function portalStatus(state: GameState, portal: number): PortalStatus {
  if (state.completedPortals.includes(portal)) return 'complete';
  return portal === state.completedPortals.length + 1 ? 'active' : 'locked';
}
export function enterPortal(state: GameState, portal: number): GameState {
  if (state.scene !== 'ISLAND' || portalStatus(state, portal) === 'locked') return state;
  if (portal === 1) return { ...state, scene: 'TEMPLE_LIGHT', islandEvent: null };
  if (portal === 2) return { ...state, scene: 'ECHO_GARDEN', echo: prepareEchoEntry(state.echo), islandEvent: null };
  return state;
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
  if (state.scene === 'ISLAND') return state;
  return { ...state, scene: 'ISLAND', echo: state.scene === 'ECHO_GARDEN' ? pauseEchoForExit(state.echo) : state.echo, islandEvent: state.pendingIslandEvent, pendingIslandEvent: null };
}
export function finishIslandEvent(state: GameState): GameState {
  return state.islandEvent === null ? state : { ...state, islandEvent: null };
}

export function startEchoInput(state: GameState): GameState { return state.scene === 'ECHO_GARDEN' ? { ...state, echo: allowEchoInput(state.echo) } : state; }
export function enterEchoRune(state: GameState, rune: RuneId): GameState {
  if (state.scene !== 'ECHO_GARDEN') return state;
  const next = submitEchoRune(state.echo, rune).next;
  return next === state.echo ? state : { ...state, echo: next };
}
export function replayEchoRound(state: GameState): GameState { return state.scene === 'ECHO_GARDEN' ? { ...state, echo: restartEchoRound(state.echo) } : state; }
export function nextEchoRound(state: GameState): GameState { return state.scene === 'ECHO_GARDEN' ? { ...state, echo: beginNextEchoRound(state.echo) } : state; }
export function materializeEchoShard(state: GameState): GameState { return state.scene === 'ECHO_GARDEN' ? { ...state, echo: revealEchoShard(state.echo) } : state; }
export function claimEchoShard(state: GameState): GameState {
  if (state.scene !== 'ECHO_GARDEN' || state.echo.phase !== 'shard-ready' || state.completedPortals.includes(2)) return state;
  return { ...state, echo: { ...state.echo, phase: 'claimed' }, completedPortals: [...state.completedPortals, 2], pendingIslandEvent: 2 };
}
