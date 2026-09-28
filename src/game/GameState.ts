import { initialLightPuzzle, resetLightCrystals, rotateLightCrystal, type CrystalId, type LightPuzzleState } from '../portals/light/LightPuzzleState';
import type { GameProgress } from './ProgressStore';
import { initialEchoPuzzle, prepareEchoEntry, pauseEchoForExit, allowEchoInput, submitEchoRune, restartEchoRound, beginNextEchoRound, revealEchoShard, type EchoPuzzleState } from '../portals/echo/EchoPuzzleState';
import type { RuneId } from '../portals/echo/echoConfig';
import { createRunSeed, type RunSeed } from './seededRun';
import { lightVariantForSeed } from '../portals/light/LightPuzzleState';
import { finishBalanceMechanism, initialBalancePuzzle, pushBalanceBlock, resetBalancePuzzle, revealBalanceShard, type BalancePuzzleState, type PushDirection } from '../portals/balance/BalancePuzzleState';
import { initialCelestialPuzzle, materializeCelestialShard, resetCelestialPuzzle, type CelestialPuzzleState } from '../portals/celestial/CelestialPuzzleState';
export type SceneId = 'ISLAND' | 'TEMPLE_LIGHT' | 'ECHO_GARDEN' | 'TEMPLE_BALANCE' | 'CELESTIAL_OBSERVATORY';
export type PortalStatus = 'active' | 'locked' | 'complete';
export type GameState = Readonly<{
  runSeed: RunSeed;
  scene: SceneId;
  completedPortals: readonly number[];
  light: LightPuzzleState;
  echo: EchoPuzzleState;
  balance: BalancePuzzleState;
  celestial: CelestialPuzzleState;
  pendingIslandEvent: number | null;
  islandEvent: number | null;
}>;
export function createInitialGameState(runSeed: RunSeed): GameState {
  return { runSeed, scene: 'ISLAND', completedPortals: [], light: initialLightPuzzle(runSeed), echo: initialEchoPuzzle(runSeed), balance: initialBalancePuzzle(runSeed), celestial: initialCelestialPuzzle(runSeed), pendingIslandEvent: null, islandEvent: null };
}
export function restoreGameState(progress: GameProgress): GameState {
  return { ...createInitialGameState(progress.runSeed), completedPortals: progress.completedPortals, light: progress.light, echo: progress.echo, balance: progress.balance, celestial: progress.celestial };
}
export function gameProgress(state: GameState): GameProgress { return { runSeed: state.runSeed, completedPortals: state.completedPortals, light: state.light, echo: state.echo, balance: state.balance, celestial: state.celestial }; }
/** A normal new journey guarantees an immediately different light configuration. */
export function startNewJourney(previous: GameState, fixedSeed?: RunSeed): GameState {
  if (fixedSeed !== undefined) return createInitialGameState(fixedSeed);
  for (let attempt = 0; attempt < 32; attempt++) {
    const runSeed = createRunSeed();
    if (runSeed !== previous.runSeed && lightVariantForSeed(runSeed) !== lightVariantForSeed(previous.runSeed)) return createInitialGameState(runSeed);
  }
  throw new Error('Unable to create a distinct journey seed.');
}
export function portalStatus(state: GameState, portal: number): PortalStatus {
  if (state.completedPortals.includes(portal)) return 'complete';
  return portal === state.completedPortals.length + 1 ? 'active' : 'locked';
}
export function enterPortal(state: GameState, portal: number): GameState {
  if (state.scene !== 'ISLAND' || portalStatus(state, portal) === 'locked') return state;
  if (portal === 1) return { ...state, scene: 'TEMPLE_LIGHT', islandEvent: null };
  if (portal === 2) return { ...state, scene: 'ECHO_GARDEN', echo: prepareEchoEntry(state.echo), islandEvent: null };
  if (portal === 3) return { ...state, scene: 'TEMPLE_BALANCE', islandEvent: null };
  if (portal === 4) return { ...state, scene: 'CELESTIAL_OBSERVATORY', islandEvent: null };
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
export function moveBalanceBlock(state: GameState, block: number, direction: PushDirection): GameState {
  if (state.scene !== 'TEMPLE_BALANCE') return state;
  const next = pushBalanceBlock(state.balance, block, direction).next;
  return next === state.balance ? state : { ...state, balance: next };
}
export function resetBalance(state: GameState): GameState {
  if (state.scene !== 'TEMPLE_BALANCE') return state;
  const balance = resetBalancePuzzle(state.balance);
  return balance === state.balance ? state : { ...state, balance };
}
export function settleBalance(state: GameState): GameState {
  return state.scene === 'TEMPLE_BALANCE' ? { ...state, balance: finishBalanceMechanism(state.balance) } : state;
}
export function materializeBalanceShard(state: GameState): GameState {
  return state.scene === 'TEMPLE_BALANCE' ? { ...state, balance: revealBalanceShard(state.balance) } : state;
}
export function claimBalanceShard(state: GameState): GameState {
  if (state.scene !== 'TEMPLE_BALANCE' || state.balance.phase !== 'shard-ready' || state.completedPortals.includes(3)) return state;
  return { ...state, balance: { ...state.balance, phase: 'claimed' }, completedPortals: [...state.completedPortals, 3], pendingIslandEvent: 3 };
}
export function saveCelestialState(state: GameState, celestial: CelestialPuzzleState): GameState {
  return state.scene === 'CELESTIAL_OBSERVATORY' ? { ...state, celestial } : state;
}
export function resetCelestial(state: GameState): GameState {
  if (state.scene !== 'CELESTIAL_OBSERVATORY') return state;
  const celestial = resetCelestialPuzzle(state.celestial, state.runSeed);
  return celestial === state.celestial ? state : { ...state, celestial };
}
export function revealCelestialShard(state: GameState): GameState {
  return state.scene === 'CELESTIAL_OBSERVATORY' ? { ...state, celestial: materializeCelestialShard(state.celestial) } : state;
}
export function claimCelestialShard(state: GameState): GameState {
  if (state.scene !== 'CELESTIAL_OBSERVATORY' || state.celestial.phase !== 'shard-ready' || state.completedPortals.includes(4)) return state;
  return { ...state, celestial: { ...state.celestial, phase: 'claimed' }, completedPortals: [...state.completedPortals, 4], pendingIslandEvent: 4 };
}
