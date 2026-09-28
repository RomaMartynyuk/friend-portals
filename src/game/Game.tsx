import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameComponentProps } from '@rarefriends/friendsdk/runtime';
import { gameSession } from '../sdk/friendSdkAdapter';
import { claimShard, enterPortal, finishIslandEvent, gameProgress, portalStatus, resetPuzzle, restoreGameState, returnToIsland, revealShard, rotateCrystal, type GameState } from './GameState';
import { sessionProgressStore } from './ProgressStore';
import { crystalPositions, traceLight, type CrystalId } from '../portals/light/LightPuzzleState';
import { useMovementInput } from '../input/useMovementInput';
import { AudioManager } from '../audio/AudioManager';
import { Island } from '../world/Island';
import { LightTemple } from '../portals/light/LightTemple';
import { Player } from '../player/Player';
import { portalConfig } from '../portals/Portal';
import { HUD } from '../ui/HUD';
import { MobileControls } from '../ui/MobileControls';
import '../../style.css';

type Nearby = Readonly<{ type: 'portal' | 'crystal' | 'shard' | 'exit' | 'unavailable'; id: number; label: string; actionable: boolean }>;
const sameNearby = (a: Nearby | null, b: Nearby | null) => a?.type === b?.type && a?.id === b?.id && a?.label === b?.label;
export default function Game(props: GameComponentProps) {
  const session = gameSession(props);
  const [state, setState] = useState<GameState>(() => restoreGameState(sessionProgressStore.read(props.friendId)));
  const [nearby, setNearby] = useState<Nearby | null>(null);
  const nearRef = useRef<Nearby | null>(null);
  const playerPosition = useRef<[number, number]>([0, 2.5]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [intro, setIntro] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [beamBroken, setBeamBroken] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [chargeStep, setChargeStep] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(1);
  const introSeen = useRef(false);
  const rotating = useRef(false);
  const claimingLock = useRef(false);
  const transitionLock = useRef(false);
  const rotationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const claimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audio = useMemo(() => new AudioManager(), []);
  const updateState = useCallback((change: (previous: GameState) => GameState) => {
    setState(previous => {
      const next = change(previous);
      if (next !== previous) sessionProgressStore.write(props.friendId, gameProgress(next));
      return next;
    });
  }, [props.friendId]);
  const exitRoom = useCallback(() => {
    if (transitionLock.current) return;
    transitionLock.current = true;
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    if (claimTimer.current) clearTimeout(claimTimer.current);
    rotating.current = false; claimingLock.current = false;
    setBeamBroken(false); setClaiming(false);
    updateState(returnToIsland);
    setTimeout(() => { transitionLock.current = false; }, 350);
  }, [updateState]);
  const reset = useCallback(() => {
    if (state.scene !== 'TEMPLE_LIGHT' || state.light.phase !== 'routing' || props.paused) return;
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    rotating.current = false; setBeamBroken(false); setResetVersion(value => value + 1);
    updateState(resetPuzzle); audio.play('interaction');
  }, [state.scene, state.light.phase, props.paused, updateState, audio]);
  const interact = useCallback(() => {
    const near = nearRef.current;
    if (!near?.actionable || props.paused || status !== 'ready' || transitionLock.current) return;
    if (near.type === 'portal') {
      transitionLock.current = true; audio.play('interaction'); updateState(previous => enterPortal(previous, near.id));
      setTimeout(() => { transitionLock.current = false; }, 350);
    } else if (near.type === 'exit') {
      audio.play('interaction'); exitRoom();
    } else if (near.type === 'crystal') {
      if (rotating.current || state.light.phase !== 'routing') return;
      rotating.current = true; setBeamBroken(true); audio.play('crystal-rotate');
      updateState(previous => rotateCrystal(previous, near.id as CrystalId));
      rotationTimer.current = setTimeout(() => { rotating.current = false; setBeamBroken(false); audio.play('beam-connect'); }, reducedMotion ? 100 : 310);
    } else if (near.type === 'shard') {
      if (claimingLock.current || state.light.phase !== 'shard-ready') return;
      claimingLock.current = true; setClaiming(true); audio.play('shard-claim');
      claimTimer.current = setTimeout(() => {
        updateState(claimShard); setClaiming(false); setFlash(true); setTimeout(() => setFlash(false), 180); setBanner('PORTAL SHARD I ACQUIRED');
        setTimeout(() => setBanner(null), 2100);
      }, reducedMotion ? 120 : 700);
    }
  }, [props.paused, status, state.light.phase, reducedMotion, audio, updateState, exitRoom]);
  const input = useMovementInput(props.paused || status !== 'ready', interact);
  useEffect(() => { let active = true; setStatus('loading'); void props.client.read().then(snapshot => {
    if (!active) return;
    if (snapshot.friendId !== props.friendId) throw new Error('Selected Friend changed. Please re-enter the game.');
    setState(restoreGameState(sessionProgressStore.read(props.friendId)));
    setStatus('ready');
  }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : 'Unable to open the game.'); setStatus('error'); } });
  return () => { active = false; }; }, [props.client, props.friendId]);
  useEffect(() => () => { audio.dispose(); if (rotationTimer.current) clearTimeout(rotationTimer.current); if (claimTimer.current) clearTimeout(claimTimer.current); }, [audio]);
  useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReducedMotion(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => {
    nearRef.current = null; setNearby(null); input.setTouch({ x: 0, z: 0 });
    if (state.scene === 'TEMPLE_LIGHT' && !introSeen.current) {
      introSeen.current = true; setIntro(true); const timer = setTimeout(() => setIntro(false), 2600); return () => clearTimeout(timer);
    }
    setIntro(false);
  }, [state.scene]);
  useEffect(() => {
    if (state.scene !== 'TEMPLE_LIGHT' || state.light.phase !== 'charging' || props.paused) return;
    setChargeStep(0);
    const timers = [1, 2, 3].map((step, index) => setTimeout(() => { setChargeStep(step); audio.play('seal-activate'); }, 320 + index * 390));
    const finish = setTimeout(() => { updateState(revealShard); audio.play('shard-materialize'); }, 1800);
    return () => { timers.forEach(clearTimeout); clearTimeout(finish); };
  }, [state.scene, state.light.phase, props.paused, updateState, audio]);
  const seals = traceLight(state.light.orientations).seals;
  const previousSeals = useRef(seals);
  useEffect(() => {
    if (state.scene === 'TEMPLE_LIGHT' && seals > previousSeals.current && state.light.phase === 'routing') audio.play('seal-activate');
    previousSeals.current = seals;
  }, [seals, state.scene, state.light.phase, audio]);
  useEffect(() => {
    if (state.scene !== 'ISLAND' || state.islandEvent !== 1 || props.paused) return;
    setUnlockProgress(0);
    const start = performance.now(); let activated = false;
    const interval = setInterval(() => {
      const value = Math.min(1, (performance.now() - start) / (reducedMotion ? 500 : 2800));
      setUnlockProgress(value);
      if (!activated && value > 0.76) { activated = true; audio.play('portal-unlock'); }
      if (value >= 1) { clearInterval(interval); updateState(finishIslandEvent); }
    }, 35);
    return () => clearInterval(interval);
  }, [state.scene, state.islandEvent, props.paused, reducedMotion, updateState, audio]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key.toLowerCase() === 'r' && !event.repeat) reset(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [reset]);
  const reportPosition = useCallback((x: number, z: number) => {
    playerPosition.current = [x, z];
    let next: Nearby | null = null;
    if (state.scene === 'ISLAND') {
      for (let i = 0; i < portalConfig.length; i++) {
        const p = portalConfig[i];
        if (Math.hypot(x - p.x, z - p.z) < 2.25) {
          const status = portalStatus(state, i + 1);
          next = i === 0 ? { type: 'portal', id: 1, label: 'ENTER PORTAL I', actionable: true }
            : { type: 'unavailable', id: i + 1, label: status === 'active' ? `${p.name} · PHASE ${i + 2}` : 'PORTAL LOCKED', actionable: false };
          break;
        }
      }
    } else {
      if (state.light.phase === 'shard-ready' && Math.hypot(x - 4, z) < 1.7) next = { type: 'shard', id: 0, label: 'CLAIM SHARD', actionable: true };
      if (!next && state.light.phase === 'routing') {
        let best = 1.72;
        crystalPositions.forEach((p, i) => { const distance = Math.hypot(x - p[0], z - p[2]); if (distance < best) { best = distance; next = { type: 'crystal', id: i, label: `ROTATE CRYSTAL ${'ABC'[i]}`, actionable: true }; } });
      }
      if (!next && Math.hypot(x, z - 5.35) < 1.7) next = { type: 'exit', id: 0, label: state.light.phase === 'claimed' ? 'RETURN TO ISLAND' : 'LEAVE TEMPLE', actionable: true };
    }
    if (!sameNearby(nearRef.current, next)) { nearRef.current = next; setNearby(next); }
  }, [state.scene, state.light.phase, state.completedPortals]);
  if (status !== 'ready') return <div className="startup" role={status === 'error' ? 'alert' : 'status'}><strong>FRIEND PORTALS</strong><p>{status === 'error' ? error : 'Opening the island…'}</p>{status === 'error' && <button onClick={() => { setStatus('loading'); void props.client.read().then(() => setStatus('ready')).catch(cause => { setError(String(cause)); setStatus('error'); }); }}>RETRY</button>}</div>;
  return <main className="game-shell" aria-label="Friend Portals game">
    <Canvas key={state.scene} shadows dpr={[1, 1.5]} camera={{ fov: 42, near: 0.1, far: 90, position: state.scene === 'ISLAND' ? [10, 14, 18] : [7.5, 10, 13] }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      {state.scene === 'ISLAND' ? <Island state={state} identitySeed={Number(props.friendId % 1000n)} reducedMotion={reducedMotion} unlockProgress={unlockProgress} />
        : <LightTemple light={state.light} highlightedCrystal={nearby?.type === 'crystal' ? nearby.id : null} resetVersion={resetVersion} beamBroken={beamBroken} chargeStep={chargeStep} claiming={claiming} playerPosition={playerPosition} reducedMotion={reducedMotion} />}
      <Player cameraOffset={state.scene === 'ISLAND' ? [10, 14, 18] : [7.5, 10, 13]} reducedMotion={reducedMotion} identity={session.identity} vector={input.vector} onPosition={reportPosition} bounds={state.scene === 'ISLAND' ? 9.45 : 6.3} spawn={state.scene === 'ISLAND' ? [0, -3.9] : [0, 2.5]} />
    </Canvas>
    <HUD friend={session.identity.label} scene={state.scene} nearby={nearby?.label ?? null} onInteract={interact} muted={muted} onToggleMute={() => { const next = !muted; setMuted(next); audio.setMuted(next); }} shards={state.completedPortals.length} seals={seals} canReset={state.scene === 'TEMPLE_LIGHT' && state.light.phase === 'routing'} onReset={reset} intro={intro} banner={banner} portalStatuses={[1, 2, 3, 4].map(portal => portalStatus(state, portal))} />
    <MobileControls onMove={input.setTouch} onInteract={interact} canInteract={Boolean(nearby?.actionable)} paused={props.paused} />
    {flash && <div className="shard-flash" aria-hidden="true" />}
    <div className="portrait-hint">Rotate your device to landscape for the best view.</div>
  </main>;
}
