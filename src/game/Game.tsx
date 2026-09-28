import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameComponentProps } from '@rarefriends/friendsdk/runtime';
import { gameSession } from '../sdk/friendSdkAdapter';
import { claimShard, claimEchoShard, claimBalanceShard, enterEchoRune, startEchoInput, replayEchoRound, nextEchoRound, materializeEchoShard, materializeBalanceShard, moveBalanceBlock, resetBalance, settleBalance, enterPortal, finishIslandEvent, gameProgress, portalStatus, resetPuzzle, restoreGameState, returnToIsland, revealShard, rotateCrystal, type GameState } from './GameState';
import { sessionProgressStore } from './ProgressStore';
import { crystalPositions, traceLight, type CrystalId } from '../portals/light/LightPuzzleState';
import { echoRunes, echoTriggerRadius, type RuneId } from '../portals/echo/echoConfig';
import { submitEchoRune } from '../portals/echo/EchoPuzzleState';
import { echoPlayback } from '../portals/echo/EchoSequence';
import { EchoGarden } from '../portals/echo/EchoGarden';
import { balanceWalkable, plateWeights, pushBalanceBlock, type PushDirection } from '../portals/balance/BalancePuzzleState';
import { balanceLayouts, gridToWorld } from '../portals/balance/balanceLayouts';
import { BalanceTemple } from '../portals/balance/BalanceTemple';
import { useMovementInput } from '../input/useMovementInput';
import { AudioManager } from '../audio/AudioManager';
import { Island } from '../world/Island';
import { LightTemple } from '../portals/light/LightTemple';
import { Player } from '../player/Player';
import { portalConfig } from '../portals/Portal';
import { HUD } from '../ui/HUD';
import { MobileControls } from '../ui/MobileControls';
import '../../style.css';

type Nearby = Readonly<{ type: 'portal' | 'crystal' | 'shard' | 'echo-shard' | 'balance-shard' | 'balance-block' | 'exit' | 'unavailable'; id: number; label: string; actionable: boolean }>;
const sameNearby = (a: Nearby | null, b: Nearby | null) => a?.type === b?.type && a?.id === b?.id && a?.label === b?.label;
export default function Game(props: GameComponentProps) {
  const session = gameSession(props);
  const fixedRunSeed = new URLSearchParams(window.location.search).get('runSeed') || undefined;
  const gameShell = useRef<HTMLElement>(null);
  const [state, setState] = useState<GameState>(() => restoreGameState(sessionProgressStore.read(props.friendId, fixedRunSeed)));
  const [nearby, setNearby] = useState<Nearby | null>(null);
  const nearRef = useRef<Nearby | null>(null);
  const playerPosition = useRef<[number, number]>([0, 2.5]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [intro, setIntro] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [beamBroken, setBeamBroken] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [chargeStep, setChargeStep] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(1);
  const [echoActiveRune, setEchoActiveRune] = useState<RuneId | null>(null);
  const [echoWrongRune, setEchoWrongRune] = useState<RuneId | null>(null);
  const [echoPulseAll, setEchoPulseAll] = useState(false);
  const [echoCallout, setEchoCallout] = useState<string | null>(null);
  const [echoClaiming, setEchoClaiming] = useState(false);
  const [balanceResetVersion, setBalanceResetVersion] = useState(0);
  const [balanceChargeStep, setBalanceChargeStep] = useState(0);
  const [balanceClaiming, setBalanceClaiming] = useState(false);
  const [balanceResistedBlock, setBalanceResistedBlock] = useState<number | null>(null);
  const [balanceCallout, setBalanceCallout] = useState<string | null>(null);
  const introSeen = useRef(false);
  const echoIntroSeen = useRef(false);
  const balanceIntroSeen = useRef(false);
  const echoOccupiedRune = useRef<RuneId | null>(null);
  const echoStateRef = useRef(state.echo); echoStateRef.current = state.echo;
  const echoClaimingLock = useRef(false);
  const balanceClaimingLock = useRef(false);
  const balancePushLock = useRef(false);
  const balancePushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const echoEffectTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const rotating = useRef(false);
  const claimingLock = useRef(false);
  const transitionLock = useRef(false);
  const rotationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const claimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audio = useMemo(() => new AudioManager(), []);
  const scheduleEcho = useCallback((work: () => void, delay: number) => { const timer = setTimeout(() => { echoEffectTimers.current.delete(timer); work(); }, delay); echoEffectTimers.current.add(timer); return timer; }, []);
  const stopEchoEffects = useCallback(() => { for (const timer of echoEffectTimers.current) clearTimeout(timer); echoEffectTimers.current.clear(); audio.stopEcho(); setEchoActiveRune(null); setEchoWrongRune(null); setEchoPulseAll(false); setEchoCallout(null); }, [audio]);
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
    if (balancePushTimer.current) clearTimeout(balancePushTimer.current);
    rotating.current = false; claimingLock.current = false; echoClaimingLock.current = false; balanceClaimingLock.current = false; balancePushLock.current = false;
    stopEchoEffects(); setEchoClaiming(false); echoOccupiedRune.current = null;
    audio.stopBalance(); setBalanceClaiming(false); setBalanceResistedBlock(null); setBalanceCallout(null);
    setBeamBroken(false); setClaiming(false);
    updateState(returnToIsland);
    setTimeout(() => { transitionLock.current = false; }, 350);
  }, [updateState, stopEchoEffects, audio]);
  const reset = useCallback(() => {
    if (props.paused) return;
    if (state.scene === 'TEMPLE_LIGHT' && state.light.phase === 'routing') {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
      rotating.current = false; setBeamBroken(false); setResetVersion(value => value + 1);
      updateState(resetPuzzle); audio.play('interaction');
    } else if (state.scene === 'TEMPLE_BALANCE' && state.balance.phase !== 'claimed' && state.balance.phase !== 'shard-ready') {
      if (balancePushTimer.current) clearTimeout(balancePushTimer.current);
      balancePushLock.current = false; setBalanceResistedBlock(null); setBalanceChargeStep(0); setBalanceCallout(null);
      audio.stopBalance(); audio.play('balance-slide'); setBalanceResetVersion(value => value + 1); updateState(resetBalance);
    }
  }, [state.scene, state.light.phase, state.balance.phase, props.paused, updateState, audio]);
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
    } else if (near.type === 'balance-block') {
      if (balancePushLock.current || state.balance.phase !== 'routing') return;
      const block = state.balance.blocks[near.id], [blockX, blockZ] = gridToWorld(block), [playerX, playerZ] = playerPosition.current;
      if (Math.hypot(blockX - playerX, blockZ - playerZ) >= 1.62) return;
      const dx = blockX - playerX, dz = blockZ - playerZ;
      const direction: PushDirection = Math.abs(dx) > Math.abs(dz)
        ? { x: dx >= 0 ? 1 : -1, row: 0 } : { x: 0, row: dz >= 0 ? 1 : -1 };
      const outcome = pushBalanceBlock(state.balance, near.id, direction);
      if (outcome.result !== 'moved') {
        setBalanceResistedBlock(near.id); audio.play('balance-blocked');
        if (balancePushTimer.current) clearTimeout(balancePushTimer.current);
        balancePushTimer.current = setTimeout(() => setBalanceResistedBlock(null), 260);
        return;
      }
      balancePushLock.current = true; setBalanceResistedBlock(null);
      updateState(previous => moveBalanceBlock(previous, near.id, direction)); audio.play('balance-slide');
      const weights = plateWeights(outcome.next), targets = balanceLayouts[outcome.next.layout].targets;
      if (Object.keys(weights).some(plate => weights[plate as keyof typeof weights] > targets[plate as keyof typeof targets])) audio.play('balance-over');
      else if (outcome.balanced.length) audio.play('balance-plate');
      else audio.play('balance-under');
      balancePushTimer.current = setTimeout(() => { balancePushLock.current = false; }, reducedMotion ? 110 : 310);
    } else if (near.type === 'balance-shard') {
      if (balanceClaimingLock.current || state.balance.phase !== 'shard-ready') return;
      balanceClaimingLock.current = true; setBalanceClaiming(true); audio.play('balance-shard-claim');
      claimTimer.current = setTimeout(() => {
        updateState(claimBalanceShard); nearRef.current = null; setNearby(null); setBalanceClaiming(false); setFlash(true); setTimeout(() => setFlash(false), 180); setBanner('PORTAL SHARD III ACQUIRED');
        setTimeout(() => setBanner(null), 2100);
      }, reducedMotion ? 120 : 700);
    } else if (near.type === 'echo-shard') {
      if (echoClaimingLock.current || state.echo.phase !== 'shard-ready') return;
      echoClaimingLock.current = true; setEchoClaiming(true); audio.play('echo-shard-claim');
      claimTimer.current = setTimeout(() => {
        updateState(claimEchoShard); nearRef.current = null; setNearby(null); setEchoClaiming(false); setFlash(true); setTimeout(() => setFlash(false), 180); setBanner('PORTAL SHARD II ACQUIRED');
        setTimeout(() => setBanner(null), 2100);
      }, reducedMotion ? 120 : 700);
    } else if (near.type === 'shard') {
      if (claimingLock.current || state.light.phase !== 'shard-ready') return;
      claimingLock.current = true; setClaiming(true); audio.play('shard-claim');
      claimTimer.current = setTimeout(() => {
        updateState(claimShard); nearRef.current = null; setNearby(null); setClaiming(false); setFlash(true); setTimeout(() => setFlash(false), 180); setBanner('PORTAL SHARD I ACQUIRED');
        setTimeout(() => setBanner(null), 2100);
      }, reducedMotion ? 120 : 700);
    }
  }, [props.paused, status, state.light.phase, state.echo.phase, state.balance, reducedMotion, audio, updateState, exitRoom]);
  const input = useMovementInput(props.paused || status !== 'ready', interact);
  useEffect(() => { let active = true; setStatus('loading'); void props.client.read().then(snapshot => {
    if (!active) return;
    if (snapshot.friendId !== props.friendId) throw new Error('Selected Friend changed. Please re-enter the game.');
    setState(restoreGameState(sessionProgressStore.read(props.friendId, fixedRunSeed)));
    setStatus('ready');
  }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : 'Unable to open the game.'); setStatus('error'); } });
  return () => { active = false; }; }, [props.client, props.friendId]);
  useEffect(() => () => { audio.dispose(); if (rotationTimer.current) clearTimeout(rotationTimer.current); if (claimTimer.current) clearTimeout(claimTimer.current); if (balancePushTimer.current) clearTimeout(balancePushTimer.current); for (const timer of echoEffectTimers.current) clearTimeout(timer); }, [audio]);
  useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReducedMotion(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => {
    nearRef.current = null; setNearby(null); input.setTouch({ x: 0, z: 0 });
    echoOccupiedRune.current = null;
    if (state.scene === 'TEMPLE_BALANCE' && !balanceIntroSeen.current) {
      balanceIntroSeen.current = true; setIntro(true); const timer = setTimeout(() => setIntro(false), 2600); return () => clearTimeout(timer);
    }
    if (state.scene === 'ECHO_GARDEN' && !echoIntroSeen.current) {
      echoIntroSeen.current = true; setIntro(true); const timer = setTimeout(() => setIntro(false), 2600); return () => clearTimeout(timer);
    }
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
  useEffect(() => {
    if (state.scene !== 'ECHO_GARDEN' || state.echo.phase !== 'playback' || props.paused || intro) return;
    const timeline = echoPlayback(state.echo);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (work: () => void, delay: number) => { timers.push(setTimeout(work, delay)); };
    setEchoCallout(null);
    later(() => audio.play('echo-sequence-start'), 100);
    for (const event of timeline.events) {
      later(() => { setEchoActiveRune(event.rune); audio.playEchoRune(event.rune); }, event.atMs);
      later(() => setEchoActiveRune(null), event.offMs);
    }
    later(() => { setEchoActiveRune(null); setEchoCallout('YOUR TURN'); updateState(startEchoInput); }, timeline.inputAtMs);
    return () => { timers.forEach(clearTimeout); audio.stopEcho(); };
  }, [state.scene, state.echo.phase, state.echo.round, props.paused, intro, audio, updateState]);
  useEffect(() => {
    if (state.scene !== 'ECHO_GARDEN' || state.echo.phase !== 'input' || !echoCallout) return;
    const timer = setTimeout(() => setEchoCallout(null), 1050);
    return () => clearTimeout(timer);
  }, [state.scene, state.echo.phase, echoCallout]);
  useEffect(() => {
    if (state.scene !== 'ECHO_GARDEN' || state.echo.phase !== 'retry' || props.paused) return;
    setEchoCallout('LISTEN AGAIN');
    const timer = setTimeout(() => { setEchoWrongRune(null); setEchoCallout(null); updateState(replayEchoRound); }, 850);
    return () => clearTimeout(timer);
  }, [state.scene, state.echo.phase, props.paused, updateState]);
  useEffect(() => {
    if (state.scene !== 'ECHO_GARDEN' || state.echo.phase !== 'round-complete' || props.paused) return;
    setEchoPulseAll(true); setEchoCallout(`ECHO ${['I', 'II', 'III'][state.echo.round]} RESTORED`);
    audio.play('echo-round-complete');
    const pulse = setTimeout(() => setEchoPulseAll(false), 650);
    const next = setTimeout(() => { setEchoCallout(null); updateState(nextEchoRound); }, 1700);
    return () => { clearTimeout(pulse); clearTimeout(next); };
  }, [state.scene, state.echo.phase, state.echo.round, props.paused, updateState, audio]);
  useEffect(() => {
    if (state.scene !== 'ECHO_GARDEN' || state.echo.phase !== 'finale' || props.paused) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setEchoCallout('THE GARDEN REMEMBERS'); audio.play('echo-complete');
    for (let i = 0; i < 5; i++) {
      timers.push(setTimeout(() => { setEchoActiveRune(i as RuneId); audio.playEchoRune(i as RuneId); }, 220 + i * 210));
    }
    timers.push(setTimeout(() => { setEchoActiveRune(null); setEchoPulseAll(true); }, 1440));
    timers.push(setTimeout(() => { setEchoPulseAll(false); audio.play('echo-shard-materialize'); updateState(materializeEchoShard); setEchoCallout(null); }, 2450));
    return () => { timers.forEach(clearTimeout); audio.stopEcho(); };
  }, [state.scene, state.echo.phase, props.paused, updateState, audio]);
  useEffect(() => {
    if (state.scene !== 'TEMPLE_BALANCE' || state.balance.phase !== 'mechanism' || props.paused) return;
    setBalanceCallout(state.balance.stage === 1 ? 'FIRST COUNTERWEIGHT RAISED' : 'GATE RELEASED');
    audio.play('balance-chain');
    const timer = setTimeout(() => { setBalanceCallout(null); updateState(settleBalance); }, reducedMotion ? 400 : 1050);
    return () => clearTimeout(timer);
  }, [state.scene, state.balance.phase, state.balance.stage, props.paused, reducedMotion, audio, updateState]);
  useEffect(() => {
    if (state.scene !== 'TEMPLE_BALANCE' || state.balance.phase !== 'finale' || props.paused) return;
    setBalanceCallout('THE TEMPLE IS BALANCED'); setBalanceChargeStep(0); audio.play('balance-complete');
    const timers = [
      setTimeout(() => { setBalanceChargeStep(1); audio.play('balance-chain'); }, 380),
      setTimeout(() => { setBalanceChargeStep(2); audio.play('balance-plate'); }, 850),
      setTimeout(() => { setBalanceChargeStep(3); audio.play('balance-bridge'); }, 1410),
      setTimeout(() => { setBalanceChargeStep(4); audio.play('balance-shard-materialize'); updateState(materializeBalanceShard); setBalanceCallout(null); }, reducedMotion ? 900 : 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [state.scene, state.balance.phase, props.paused, reducedMotion, audio, updateState]);
  const seals = traceLight(state.light).seals;
  const previousSeals = useRef(seals);
  useEffect(() => {
    if (state.scene === 'TEMPLE_LIGHT' && seals > previousSeals.current && state.light.phase === 'routing') audio.play('seal-activate');
    previousSeals.current = seals;
  }, [seals, state.scene, state.light.phase, audio]);
  useEffect(() => {
    if (state.scene !== 'ISLAND' || state.islandEvent === null || props.paused) return;
    setUnlockProgress(0);
    const start = performance.now(); let activated = false;
    const interval = setInterval(() => {
      const value = Math.min(1, (performance.now() - start) / (reducedMotion ? 500 : 2800));
      setUnlockProgress(value);
      if (!activated && value > 0.76) { activated = true; audio.play(state.islandEvent === 3 ? 'balance-portal-unlock' : state.islandEvent === 2 ? 'echo-portal-unlock' : 'portal-unlock'); }
      if (value >= 1) { clearInterval(interval); updateState(finishIslandEvent); }
    }, 35);
    return () => clearInterval(interval);
  }, [state.scene, state.islandEvent, props.paused, reducedMotion, updateState, audio]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key.toLowerCase() === 'r' && !event.repeat) reset(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [reset]);
  const onEchoRuneEntry = useCallback((rune: RuneId) => {
    if (props.paused || transitionLock.current) return;
    const result = submitEchoRune(echoStateRef.current, rune);
    if (result.verdict === 'ignored') return;
    echoStateRef.current = result.next;
    updateState(previous => enterEchoRune(previous, rune));
    setEchoCallout(null);
    if (result.verdict === 'wrong') {
      setEchoWrongRune(rune); audio.play('echo-wrong');
    } else {
      setEchoActiveRune(rune); audio.playEchoRune(rune);
      scheduleEcho(() => setEchoActiveRune(current => current === rune ? null : current), 460);
    }
  }, [props.paused, updateState, audio, scheduleEcho]);
  const reportPosition = useCallback((x: number, z: number) => {
    playerPosition.current = [x, z];
    if (gameShell.current) { gameShell.current.dataset.playerX = x.toFixed(2); gameShell.current.dataset.playerZ = z.toFixed(2); }
    let next: Nearby | null = null;
    if (state.scene === 'ISLAND') {
      for (let i = 0; i < portalConfig.length; i++) {
        const p = portalConfig[i];
        if (Math.hypot(x - p.x, z - p.z) < 2.25) {
          const status = portalStatus(state, i + 1);
          next = i < 3 && status !== 'locked' ? { type: 'portal', id: i + 1, label: `ENTER PORTAL ${['I', 'II', 'III'][i]}`, actionable: true }
            : { type: 'unavailable', id: i + 1, label: status === 'active' ? `${p.name} · PHASE ${i + 2}` : 'PORTAL LOCKED', actionable: false };
          break;
        }
      }
    } else if (state.scene === 'TEMPLE_LIGHT') {
      if (state.light.phase === 'shard-ready' && Math.hypot(x - 4, z) < 1.7) next = { type: 'shard', id: 0, label: 'CLAIM SHARD', actionable: true };
      if (!next && state.light.phase === 'routing') {
        let best = 1.72;
        crystalPositions.forEach((p, i) => { const distance = Math.hypot(x - p[0], z - p[2]); if (distance < best) { best = distance; next = { type: 'crystal', id: i, label: `ROTATE CRYSTAL ${'ABC'[i]}`, actionable: true }; } });
      }
      if (!next && Math.hypot(x, z - 5.35) < 1.7) next = { type: 'exit', id: 0, label: state.light.phase === 'claimed' ? 'RETURN TO ISLAND' : 'LEAVE TEMPLE', actionable: true };
    } else if (state.scene === 'ECHO_GARDEN') {
      const rune = echoRunes.findIndex(entry => Math.hypot(x - entry.x, z - entry.z) < echoTriggerRadius);
      const occupied = rune < 0 ? null : rune as RuneId;
      if (occupied !== echoOccupiedRune.current) { echoOccupiedRune.current = occupied; if (occupied !== null) onEchoRuneEntry(occupied); }
      if (state.echo.phase === 'shard-ready' && Math.hypot(x, z) < 1.7) next = { type: 'echo-shard', id: 2, label: 'CLAIM SHARD', actionable: true };
      if (!next && Math.hypot(x, z - 6.25) < 1.65) next = { type: 'exit', id: 0, label: state.echo.phase === 'claimed' ? 'RETURN TO ISLAND' : 'LEAVE GARDEN', actionable: true };
    } else {
      if (state.balance.phase === 'shard-ready' && Math.hypot(x, z + 6.1) < 1.75) next = { type: 'balance-shard', id: 3, label: 'CLAIM SHARD', actionable: true };
      if (!next && Math.abs(x) < 1.4 && z > 6.65 && z < 8.2) next = { type: 'exit', id: 0, label: state.balance.phase === 'claimed' ? 'RETURN TO ISLAND' : 'LEAVE TEMPLE', actionable: true };
      if (!next && state.balance.phase === 'routing') {
        let best = 1.62;
        state.balance.blocks.forEach((cell, id) => { const [bx, bz] = gridToWorld(cell), distance = Math.hypot(x - bx, z - bz); if (distance < best) { best = distance; next = { type: 'balance-block', id, label: `PUSH BLOCK ${String.fromCharCode(65 + id)} · WEIGHT ${'I'.repeat(balanceLayouts[state.balance.layout].blocks[id].weight)}`, actionable: true }; } });
      }
    }
    if (!sameNearby(nearRef.current, next)) { nearRef.current = next; setNearby(next); }
  }, [state.scene, state.light.phase, state.echo.phase, state.balance, state.completedPortals, onEchoRuneEntry]);
  if (status !== 'ready') return <div className="startup" role={status === 'error' ? 'alert' : 'status'}><strong>FRIEND PORTALS</strong><p>{status === 'error' ? error : 'Opening the island…'}</p>{status === 'error' && <button onClick={() => { setStatus('loading'); void props.client.read().then(() => setStatus('ready')).catch(cause => { setError(String(cause)); setStatus('error'); }); }}>RETRY</button>}</div>;
  return <main ref={gameShell} className="game-shell" aria-label="Friend Portals game" data-run-seed={state.runSeed}>
    <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 42, near: 0.1, far: 90, position: [10, 14, 18] }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      {state.scene === 'ISLAND' ? <Island state={state} identitySeed={Number(props.friendId % 1000n)} reducedMotion={reducedMotion} unlockProgress={unlockProgress} />
        : state.scene === 'TEMPLE_LIGHT' ? <LightTemple light={state.light} highlightedCrystal={nearby?.type === 'crystal' ? nearby.id : null} resetVersion={resetVersion} beamBroken={beamBroken} chargeStep={chargeStep} claiming={claiming} playerPosition={playerPosition} reducedMotion={reducedMotion} />
        : state.scene === 'ECHO_GARDEN' ? <EchoGarden echo={state.echo} activeRune={echoActiveRune} wrongRune={echoWrongRune} pulseAll={echoPulseAll} claiming={echoClaiming} playerPosition={playerPosition} reducedMotion={reducedMotion} />
          : <BalanceTemple balance={state.balance} nearbyBlock={nearby?.type === 'balance-block' ? nearby.id : null} resistedBlock={balanceResistedBlock} resetVersion={balanceResetVersion} chargeStep={balanceChargeStep} claiming={balanceClaiming} playerPosition={playerPosition} reducedMotion={reducedMotion} />}
      <Player key={state.scene} cameraOffset={state.scene === 'ISLAND' ? [10, 14, 18] : state.scene === 'TEMPLE_LIGHT' ? [7.5, 10, 13] : state.scene === 'ECHO_GARDEN' ? [7, 11, 13] : [8, 11, 15]} reducedMotion={reducedMotion} identity={session.identity} vector={input.vector} onPosition={reportPosition} bounds={state.scene === 'ISLAND' ? 9.45 : state.scene === 'TEMPLE_LIGHT' ? 6.3 : state.scene === 'ECHO_GARDEN' ? 7.7 : 8.8} spawn={state.scene === 'ISLAND' ? [0, -3.9] : state.scene === 'TEMPLE_LIGHT' ? [0, 2.5] : state.scene === 'ECHO_GARDEN' ? [0, 3.9] : [0, 6.35]} canMove={state.scene === 'TEMPLE_BALANCE' ? (x, z) => balanceWalkable(state.balance, x, z) : undefined} />
    </Canvas>
    <HUD friend={session.identity.label} scene={state.scene} nearby={nearby?.label ?? null} onInteract={interact} muted={muted} onToggleMute={() => { const next = !muted; setMuted(next); audio.setMuted(next); }} shards={state.completedPortals.length} seals={seals} canReset={state.scene === 'TEMPLE_LIGHT' && state.light.phase === 'routing' || state.scene === 'TEMPLE_BALANCE' && state.balance.phase !== 'claimed' && state.balance.phase !== 'shard-ready'} onReset={reset} intro={intro} banner={banner} portalStatuses={[1, 2, 3, 4].map(portal => portalStatus(state, portal))} echo={state.echo} echoCallout={echoCallout} balance={state.balance} balanceCallout={balanceCallout} />
    <MobileControls onMove={input.setTouch} onInteract={interact} canInteract={Boolean(nearby?.actionable)} paused={props.paused} />
    {flash && <div className="shard-flash" aria-hidden="true" />}
    <div className="portrait-hint">Rotate your device to landscape for the best view.</div>
  </main>;
}
