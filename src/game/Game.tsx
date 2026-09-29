import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameComponentProps } from '@rarefriends/friendsdk/runtime';
import type { GenerationSprites } from '@rarefriends/friendsdk/sprites';
import { gameSession } from '../sdk/friendSdkAdapter';
import { loadCanonicalFriend } from '../sdk/friendSpriteAdapter';
import { activateRestoration, completeRestoration, startNewJourney, claimShard, claimEchoShard, claimBalanceShard, claimCelestialShard, enterEchoRune, startEchoInput, replayEchoRound, nextEchoRound, materializeEchoShard, materializeBalanceShard, moveBalanceBlock, resetBalance, resetCelestial, settleBalance, enterPortal, finishIslandEvent, gameProgress, portalStatus, resetPuzzle, restoreGameState, returnToIsland, revealShard, revealCelestialShard, rotateCrystal, saveCelestialState, type GameState } from './GameState';
import { sessionProgressStore } from './ProgressStore';
import { crystalPositions, traceLight, type CrystalId } from '../portals/light/LightPuzzleState';
import { echoRunes, echoTriggerRadius, type RuneId } from '../portals/echo/echoConfig';
import { submitEchoRune } from '../portals/echo/EchoPuzzleState';
import { echoPlayback } from '../portals/echo/EchoSequence';
import { EchoGarden } from '../portals/echo/EchoGarden';
import { balanceWalkable, plateWeights, pushBalanceBlock, type PushDirection } from '../portals/balance/BalancePuzzleState';
import { balanceLayouts, gridToWorld } from '../portals/balance/balanceLayouts';
import { BalanceTemple } from '../portals/balance/BalanceTemple';
import { CelestialObservatory } from '../portals/celestial/CelestialObservatory';
import { celestialControlPositions } from '../portals/celestial/CelestialControl';
import { angularError, advanceCelestial, beginCelestialMotion, lockCelestialRing, PERFECT_WINDOW, resetCelestialPuzzle, showConstellationClue, targetAngle, type CelestialPuzzleState } from '../portals/celestial/CelestialPuzzleState';
import { celestialConfigForSeed, ringNames, type RingId } from '../portals/celestial/celestialConfig';
import { useMovementInput } from '../input/useMovementInput';
import { AudioManager } from '../audio/AudioManager';
import { Island } from '../world/Island';
import { LightTemple } from '../portals/light/LightTemple';
import { Player } from '../player/Player';
import { portalConfig } from '../portals/Portal';
import { HUD } from '../ui/HUD';
import { MobileControls } from '../ui/MobileControls';
import { CompletionScreen } from '../ui/CompletionScreen';
import { journeySigilForSeed } from '../finale/JourneySigilConfig';
import { RESTORATION_SECONDS, restorationStage, restorationStages, type RestorationStage } from '../finale/RestorationState';
import '../../style.css';

type Nearby = Readonly<{ type: 'portal' | 'crystal' | 'shard' | 'echo-shard' | 'balance-shard' | 'balance-block' | 'celestial-control' | 'celestial-observe' | 'celestial-shard' | 'monument' | 'monument-review' | 'exit' | 'unavailable'; id: number; label: string; actionable: boolean }>;
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
  const [sprites, setSprites] = useState<GenerationSprites | null>(null);
  const [artworkRetry, setArtworkRetry] = useState(0);
  const [friendReaction, setFriendReaction] = useState(0);
  const [friendDeparting, setFriendDeparting] = useState(false);
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
  const [celestialCallout, setCelestialCallout] = useState<string | null>(null);
  const [celestialFinalStep, setCelestialFinalStep] = useState(0);
  const [celestialMissedRing, setCelestialMissedRing] = useState<RingId | null>(null);
  const [celestialPerfectRing, setCelestialPerfectRing] = useState<RingId | null>(null);
  const [celestialClaiming, setCelestialClaiming] = useState(false);
  const [restorationSeconds, setRestorationSeconds] = useState(0);
  const [completionOpen, setCompletionOpen] = useState(false);
  const finaleInteractionLock = useRef(false);
  const finalePlayedStages = useRef(new Set<RestorationStage>());
  const previousRestorationPhase = useRef(state.restoration.phase);
  const sigil = useMemo(() => journeySigilForSeed(state.runSeed), [state.runSeed]);
  const introSeen = useRef(false);
  const echoIntroSeen = useRef(false);
  const balanceIntroSeen = useRef(false);
  const celestialIntroSeen = useRef(false);
  const echoOccupiedRune = useRef<RuneId | null>(null);
  const echoStateRef = useRef(state.echo); echoStateRef.current = state.echo;
  const echoClaimingLock = useRef(false);
  const balanceClaimingLock = useRef(false);
  const balancePushLock = useRef(false);
  const balancePushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celestialClaimingLock = useRef(false);
  const celestialPerfectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celestialLastTick = useRef(0);
  const celestialConfig = useMemo(() => celestialConfigForSeed(state.runSeed), [state.runSeed]);
  const celestialMotion = useRef<{ base: CelestialPuzzleState; at: number }>({ base: state.celestial, at: performance.now() });
  const echoEffectTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const rotating = useRef(false);
  const claimingLock = useRef(false);
  const transitionLock = useRef(false);
  const departurePending = useRef(false);
  const departureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const liveCelestial = useCallback(() => {
    const motion = celestialMotion.current;
    return advanceCelestial(motion.base, celestialConfig, props.paused ? 0 : (performance.now() - motion.at) / 1000);
  }, [celestialConfig, props.paused]);
  const setCelestialSnapshot = useCallback((next: CelestialPuzzleState) => {
    celestialMotion.current = { base: next, at: performance.now() };
    updateState(previous => saveCelestialState(previous, next));
  }, [updateState]);
  const onCelestialSymbolPass = useCallback((ring: RingId) => {
    if (props.paused || ring !== celestialMotion.current.base.lockedCount) return;
    const now = performance.now();
    if (now - celestialLastTick.current > 280) { celestialLastTick.current = now; audio.play('celestial-tick'); }
  }, [props.paused, audio]);
  const exitRoom = useCallback(() => {
    if (transitionLock.current) return;
    transitionLock.current = true;
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    if (claimTimer.current) clearTimeout(claimTimer.current);
    if (balancePushTimer.current) clearTimeout(balancePushTimer.current);
    if (celestialPerfectTimer.current) clearTimeout(celestialPerfectTimer.current);
    rotating.current = false; claimingLock.current = false; echoClaimingLock.current = false; balanceClaimingLock.current = false; balancePushLock.current = false; celestialClaimingLock.current = false;
    stopEchoEffects(); setEchoClaiming(false); echoOccupiedRune.current = null;
    audio.stopBalance(); setBalanceClaiming(false); setBalanceResistedBlock(null); setBalanceCallout(null);
    audio.stopCelestial(); setCelestialClaiming(false); setCelestialMissedRing(null); setCelestialPerfectRing(null); setCelestialCallout(null);
    setBeamBroken(false); setClaiming(false);
    const snapshot = liveCelestial();
    updateState(previous => returnToIsland(previous.scene === 'CELESTIAL_OBSERVATORY' ? saveCelestialState(previous, snapshot) : previous));
    setTimeout(() => { transitionLock.current = false; }, 350);
  }, [updateState, stopEchoEffects, audio, liveCelestial]);
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
    } else if (state.scene === 'CELESTIAL_OBSERVATORY' && state.celestial.phase !== 'claimed' && state.celestial.phase !== 'shard-ready') {
      const next = resetCelestialPuzzle(state.celestial, state.runSeed);
      if (celestialPerfectTimer.current) clearTimeout(celestialPerfectTimer.current);
      audio.stopCelestial(); audio.play('celestial-control'); setCelestialMissedRing(null); setCelestialPerfectRing(null); setCelestialFinalStep(0); setCelestialCallout(null);
      celestialMotion.current = { base: next, at: performance.now() };
      updateState(resetCelestial);
    }
  }, [state.scene, state.light.phase, state.balance.phase, state.celestial, state.runSeed, props.paused, updateState, audio]);
  const interact = useCallback(() => {
    audio.unlock();
    const near = nearRef.current;
    if (!near?.actionable || props.paused || status !== 'ready' || transitionLock.current || departurePending.current || completionOpen) return;
    if (near.type === 'monument') {
      if (finaleInteractionLock.current || state.restoration.phase !== 'dormant' || state.completedPortals.length !== 4) return;
      finaleInteractionLock.current = true;
      nearRef.current = null; setNearby(null);
      audio.play('finale-awaken'); audio.playFriend('anticipation', 0.35);
      updateState(previous => activateRestoration(previous, Date.now()));
    } else if (near.type === 'monument-review') {
      if (state.restoration.phase === 'complete') setCompletionOpen(true);
    } else if (near.type === 'portal') {
      departurePending.current = true; setFriendDeparting(true);
      audio.play('interaction'); audio.playFriend('action-start', 0.4);
      departureTimer.current = setTimeout(() => {
        departurePending.current = false; transitionLock.current = true;
        updateState(previous => enterPortal(previous, near.id)); setFriendDeparting(false);
        setTimeout(() => { transitionLock.current = false; }, 350);
      }, reducedMotion ? 0 : 135);
    } else if (near.type === 'exit') {
      departurePending.current = true; setFriendDeparting(true);
      audio.play('interaction'); audio.playFriend('action-start', 0.32);
      departureTimer.current = setTimeout(() => {
        departurePending.current = false; exitRoom(); setFriendDeparting(false);
      }, reducedMotion ? 0 : 135);
    } else if (near.type === 'crystal') {
      if (rotating.current || state.light.phase !== 'routing') return;
      rotating.current = true; setBeamBroken(true); audio.play('crystal-rotate'); audio.playFriend('select', 0.28);
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
    } else if (near.type === 'celestial-observe') {
      const live = liveCelestial();
      if (live.phase !== 'running') return;
      setCelestialSnapshot(showConstellationClue(live)); audio.play('celestial-control'); setCelestialCallout(null);
    } else if (near.type === 'celestial-control') {
      const ring = near.id as RingId, [px, , pz] = celestialControlPositions[ring], [x, z] = playerPosition.current;
      if (Math.hypot(x - px, z - pz) > 1.58) return;
      const result = lockCelestialRing(liveCelestial(), ring);
      if (result.verdict === 'ignored') return;
      setCelestialSnapshot(result.next); audio.play('celestial-control');
      if (result.verdict === 'miss') { setCelestialMissedRing(ring); setCelestialCallout('ALMOST · WATCH THE MARKER'); audio.play('celestial-miss'); }
      else {
        const perfect = result.error <= PERFECT_WINDOW;
        setCelestialMissedRing(null); setCelestialPerfectRing(perfect ? ring : null);
        if (celestialPerfectTimer.current) clearTimeout(celestialPerfectTimer.current);
        if (perfect) celestialPerfectTimer.current = setTimeout(() => setCelestialPerfectRing(null), 700);
        setCelestialCallout(perfect ? 'PERFECT ALIGNMENT' : result.verdict === 'finale' ? 'THE STARS REMEMBER' : 'RING ALIGNED');
        audio.play(perfect ? 'celestial-perfect' : 'celestial-lock');
      }
    } else if (near.type === 'celestial-shard') {
      if (celestialClaimingLock.current || state.celestial.phase !== 'shard-ready') return;
      celestialClaimingLock.current = true; setCelestialClaiming(true); audio.play('celestial-shard-claim');
      claimTimer.current = setTimeout(() => {
        updateState(claimCelestialShard); celestialMotion.current = { base: { ...celestialMotion.current.base, phase: 'claimed' }, at: performance.now() };
        nearRef.current = null; setNearby(null); setCelestialClaiming(false); setFlash(true); setTimeout(() => setFlash(false), 220); setBanner('FINAL PORTAL SHARD ACQUIRED');
        setTimeout(() => setBanner(null), 2500); setFriendReaction(value => value + 1); audio.playFriend('reward', 0.55);
      }, reducedMotion ? 120 : 820);
    } else if (near.type === 'balance-shard') {
      if (balanceClaimingLock.current || state.balance.phase !== 'shard-ready') return;
      balanceClaimingLock.current = true; setBalanceClaiming(true); audio.play('balance-shard-claim');
      claimTimer.current = setTimeout(() => {
        updateState(claimBalanceShard); nearRef.current = null; setNearby(null); setBalanceClaiming(false); setFlash(true); setTimeout(() => setFlash(false), 180); setBanner('PORTAL SHARD III ACQUIRED');
        setTimeout(() => setBanner(null), 2100); setFriendReaction(value => value + 1); audio.playFriend('reward', 0.5);
      }, reducedMotion ? 120 : 700);
    } else if (near.type === 'echo-shard') {
      if (echoClaimingLock.current || state.echo.phase !== 'shard-ready') return;
      echoClaimingLock.current = true; setEchoClaiming(true); audio.play('echo-shard-claim');
      claimTimer.current = setTimeout(() => {
        updateState(claimEchoShard); nearRef.current = null; setNearby(null); setEchoClaiming(false); setFlash(true); setTimeout(() => setFlash(false), 180); setBanner('PORTAL SHARD II ACQUIRED');
        setTimeout(() => setBanner(null), 2100); setFriendReaction(value => value + 1); audio.playFriend('reward', 0.5);
      }, reducedMotion ? 120 : 700);
    } else if (near.type === 'shard') {
      if (claimingLock.current || state.light.phase !== 'shard-ready') return;
      claimingLock.current = true; setClaiming(true); audio.play('shard-claim');
      claimTimer.current = setTimeout(() => {
        updateState(claimShard); nearRef.current = null; setNearby(null); setClaiming(false); setFlash(true); setTimeout(() => setFlash(false), 180); setBanner('PORTAL SHARD I ACQUIRED');
        setTimeout(() => setBanner(null), 2100); setFriendReaction(value => value + 1); audio.playFriend('reward', 0.5);
      }, reducedMotion ? 120 : 700);
    }
  }, [props.paused, status, completionOpen, state.restoration.phase, state.completedPortals.length, state.light.phase, state.echo.phase, state.balance, state.celestial.phase, reducedMotion, audio, updateState, exitRoom, liveCelestial, setCelestialSnapshot]);
  const input = useMovementInput(props.paused || status !== 'ready' || state.restoration.phase === 'playing' || completionOpen, interact);
  useEffect(() => { let active = true; setStatus('loading'); setSprites(null); void props.client.read().then(async snapshot => {
    if (!active) return;
    if (snapshot.friendId !== props.friendId) throw new Error('Selected Friend changed. Please re-enter the game.');
    const artwork = await loadCanonicalFriend(props.friendId);
    if (!active) return;
    setSprites(artwork);
    setState(restoreGameState(sessionProgressStore.read(props.friendId, fixedRunSeed)));
    setStatus('ready');
  }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : 'Unable to open the game.'); setStatus('error'); } });
  return () => { active = false; }; }, [props.client, props.friendId, artworkRetry]);
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('keydown', unlock);
    return () => window.removeEventListener('keydown', unlock);
  }, [audio]);
  useEffect(() => () => { audio.dispose(); if (departureTimer.current) clearTimeout(departureTimer.current); if (rotationTimer.current) clearTimeout(rotationTimer.current); if (claimTimer.current) clearTimeout(claimTimer.current); if (balancePushTimer.current) clearTimeout(balancePushTimer.current); if (celestialPerfectTimer.current) clearTimeout(celestialPerfectTimer.current); for (const timer of echoEffectTimers.current) clearTimeout(timer); }, [audio]);
  const previousFriendScene = useRef(state.scene);
  useEffect(() => {
    if (previousFriendScene.current !== state.scene) audio.playFriend('action-ready', 0.26);
    previousFriendScene.current = state.scene;
  }, [state.scene, audio]);
  useEffect(() => {
    const current = celestialMotion.current;
    celestialMotion.current = { base: props.paused ? advanceCelestial(current.base, celestialConfig, (performance.now() - current.at) / 1000) : current.base, at: performance.now() };
  }, [props.paused, celestialConfig]);
  useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReducedMotion(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => {
    nearRef.current = null; setNearby(null); input.setTouch({ x: 0, z: 0 });
    echoOccupiedRune.current = null;
    if (state.scene === 'CELESTIAL_OBSERVATORY') {
      celestialMotion.current = { base: state.celestial, at: performance.now() };
      audio.play('celestial-ambience');
      if (!celestialIntroSeen.current) { celestialIntroSeen.current = true; setIntro(true); const timer = setTimeout(() => setIntro(false), 1800); return () => clearTimeout(timer); }
    }
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
  useEffect(() => {
    if (state.scene !== 'CELESTIAL_OBSERVATORY' || state.celestial.phase !== 'clue' || props.paused) return;
    setCelestialCallout(null);
    const timer = setTimeout(() => { setCelestialSnapshot(beginCelestialMotion(celestialMotion.current.base)); audio.play('celestial-ring'); }, 5000);
    return () => clearTimeout(timer);
  }, [state.scene, state.celestial.phase, props.paused, audio, setCelestialSnapshot]);
  useEffect(() => {
    if (state.scene !== 'CELESTIAL_OBSERVATORY' || state.celestial.phase !== 'retry' || props.paused) return;
    const timer = setTimeout(() => { setCelestialMissedRing(null); setCelestialCallout(null); setCelestialSnapshot(beginCelestialMotion(celestialMotion.current.base)); audio.play('celestial-ring'); }, reducedMotion ? 450 : 760);
    return () => clearTimeout(timer);
  }, [state.scene, state.celestial.phase, props.paused, reducedMotion, audio, setCelestialSnapshot]);
  useEffect(() => {
    if (state.scene !== 'CELESTIAL_OBSERVATORY' || state.celestial.phase !== 'finale' || props.paused) return;
    audio.stopCelestial(); setCelestialCallout('THE STARS REMEMBER'); setCelestialFinalStep(0);
    const timers = [
      setTimeout(() => { setCelestialFinalStep(1); audio.play('celestial-lock'); }, 550),
      setTimeout(() => { setCelestialFinalStep(2); audio.play('celestial-formation'); }, 1450),
      setTimeout(() => { setCelestialFinalStep(3); audio.play('celestial-star'); }, 3000),
      setTimeout(() => { setCelestialFinalStep(4); audio.play('celestial-star'); }, 4300),
      setTimeout(() => { setCelestialCallout(null); updateState(revealCelestialShard); audio.play('celestial-shard-materialize'); }, reducedMotion ? 2400 : 5650),
    ];
    return () => timers.forEach(clearTimeout);
  }, [state.scene, state.celestial.phase, props.paused, reducedMotion, audio, updateState]);
  useEffect(() => {
    if (state.scene !== 'CELESTIAL_OBSERVATORY') return;
    const timer = setInterval(() => {
      if (!gameShell.current) return;
      const current = liveCelestial();
      for (const ring of [0, 1, 2] as const) {
        gameShell.current.dataset[`celestialAngle${ring}`] = current.angles[ring].toFixed(4);
        gameShell.current.dataset[`celestialError${ring}`] = angularError(current.angles[ring], targetAngle(current, ring)).toFixed(4);
      }
    }, 110);
    return () => clearInterval(timer);
  }, [state.scene, liveCelestial]);
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
      if (!activated && value > 0.76) { activated = true; audio.play(state.islandEvent === 4 ? 'celestial-formation' : state.islandEvent === 3 ? 'balance-portal-unlock' : state.islandEvent === 2 ? 'echo-portal-unlock' : 'portal-unlock'); }
      if (value >= 1) { clearInterval(interval); updateState(finishIslandEvent); }
    }, 35);
    return () => clearInterval(interval);
  }, [state.scene, state.islandEvent, props.paused, reducedMotion, updateState, audio]);
  useEffect(() => {
    if (state.restoration.phase !== 'playing' || state.restoration.startedAt === null) return;
    const startedAt = state.restoration.startedAt;
    const tick = () => {
      if (document.hidden || props.paused) return;
      const elapsed = Math.min(RESTORATION_SECONDS, Math.max(0, (Date.now() - startedAt) / 1000));
      setRestorationSeconds(elapsed);
      const stage = restorationStage(elapsed);
      if (!finalePlayedStages.current.has(stage)) {
        for (const entry of restorationStages) if (entry.at <= elapsed) finalePlayedStages.current.add(entry.id);
        const cue = ({ light: 'finale-light', echo: 'finale-echo', balance: 'finale-balance', celestial: 'finale-celestial', sockets: 'finale-sockets', monument: 'finale-transform', sigil: 'finale-sigil', restored: 'final-completion' } as const)[stage as Exclude<RestorationStage, 'awakening'>];
        if (cue) audio.play(cue);
      }
      if (elapsed >= RESTORATION_SECONDS) updateState(completeRestoration);
    };
    tick();
    const timer = setInterval(tick, 70);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [state.restoration.phase, state.restoration.startedAt, props.paused, updateState, audio]);
  useEffect(() => {
    if (state.restoration.phase === 'complete' && previousRestorationPhase.current !== 'complete') {
      setRestorationSeconds(RESTORATION_SECONDS);
      setCompletionOpen(true);
    }
    previousRestorationPhase.current = state.restoration.phase;
  }, [state.restoration.phase]);
  const beginNewJourney = useCallback(() => {
    audio.stopFinale(); audio.stopEcho(); audio.stopBalance(); audio.stopCelestial();
    finaleInteractionLock.current = false; finalePlayedStages.current.clear();
    introSeen.current = false; echoIntroSeen.current = false; balanceIntroSeen.current = false; celestialIntroSeen.current = false;
    nearRef.current = null; setNearby(null); playerPosition.current = [0, -3.9];
    setCompletionOpen(false); setRestorationSeconds(0); setBanner(null); setFlash(false); setUnlockProgress(1);
    updateState(previous => startNewJourney(previous));
  }, [audio, updateState]);
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
    if (gameShell.current) { gameShell.current.dataset.playerX = x.toFixed(2); gameShell.current.dataset.playerZ = z.toFixed(2); gameShell.current.dataset.celestialVoices = String(audio.celestialVoiceCount()); }
    let next: Nearby | null = null;
    if (state.scene === 'ISLAND' && state.restoration.phase === 'playing') {
      next = null;
    } else if (state.scene === 'ISLAND') {
      if (state.completedPortals.length === 4 && Math.hypot(x, z) < 2.8) {
        next = state.restoration.phase === 'complete'
          ? { type: 'monument-review', id: 0, label: 'VIEW JOURNEY SIGIL', actionable: true }
          : { type: 'monument', id: 0, label: 'RESTORE THE MONUMENT', actionable: true };
      }
      for (let i = 0; i < portalConfig.length; i++) {
        if (next) break;
        const p = portalConfig[i];
        if (Math.hypot(x - p.x, z - p.z) < 2.25) {
          const status = portalStatus(state, i + 1);
          next = status !== 'locked' ? { type: 'portal', id: i + 1, label: `ENTER PORTAL ${['I', 'II', 'III', 'IV'][i]}`, actionable: true }
            : { type: 'unavailable', id: i + 1, label: 'PORTAL LOCKED', actionable: false };
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
    } else if (state.scene === 'TEMPLE_BALANCE') {
      if (state.balance.phase === 'shard-ready' && Math.hypot(x, z + 6.1) < 1.75) next = { type: 'balance-shard', id: 3, label: 'CLAIM SHARD', actionable: true };
      if (!next && Math.abs(x) < 1.4 && z > 6.65 && z < 8.2) next = { type: 'exit', id: 0, label: state.balance.phase === 'claimed' ? 'RETURN TO ISLAND' : 'LEAVE TEMPLE', actionable: true };
      if (!next && state.balance.phase === 'routing') {
        let best = 1.62;
        state.balance.blocks.forEach((cell, id) => { const [bx, bz] = gridToWorld(cell), distance = Math.hypot(x - bx, z - bz); if (distance < best) { best = distance; next = { type: 'balance-block', id, label: `PUSH BLOCK ${String.fromCharCode(65 + id)} · WEIGHT ${'I'.repeat(balanceLayouts[state.balance.layout].blocks[id].weight)}`, actionable: true }; } });
      }
    } else if (state.scene === 'CELESTIAL_OBSERVATORY') {
      if (state.celestial.phase === 'shard-ready' && Math.hypot(x, z + 1.3) < 2.0) next = { type: 'celestial-shard', id: 4, label: 'CLAIM FINAL SHARD', actionable: true };
      if (!next && Math.abs(x) < 1.35 && z > 6.65 && z < 8.1) next = { type: 'exit', id: 0, label: state.celestial.phase === 'claimed' ? 'RETURN TO ISLAND' : 'LEAVE OBSERVATORY', actionable: true };
      if (!next && state.celestial.phase === 'running') {
        const index = state.celestial.lockedCount;
        if (index < 3) { const ring = index as RingId, [cx, , cz] = celestialControlPositions[ring]; if (Math.hypot(x - cx, z - cz) < 1.55) next = { type: 'celestial-control', id: ring, label: `LOCK ${ringNames[ring]} RING`, actionable: true }; }
      }
      if (!next && state.celestial.phase === 'running' && Math.hypot(x, z - 2.95) < 1.18) next = { type: 'celestial-observe', id: 0, label: 'VIEW CONSTELLATION', actionable: true };
    }
    if (!sameNearby(nearRef.current, next)) { nearRef.current = next; setNearby(next); }
  }, [state.scene, state.restoration.phase, state.light.phase, state.echo.phase, state.balance, state.celestial.phase, state.celestial.lockedCount, state.completedPortals, onEchoRuneEntry, audio]);
  if (status !== 'ready' || !sprites || sprites.tokenId !== props.friendId) return <div className="startup" role={status === 'error' ? 'alert' : 'status'}><strong>FRIEND PORTALS</strong><p>{status === 'error' ? `Canonical Friend unavailable: ${error}` : 'SUMMONING FRIEND...'}</p>{status === 'error' && <button onClick={() => { setStatus('loading'); setArtworkRetry(value => value + 1); }}>RETRY</button>}</div>;
  return <main ref={gameShell} onPointerDownCapture={() => audio.unlock()} className="game-shell" aria-label="Friend Portals game" data-friend-token={sprites.tokenId.toString()} data-friend-family={sprites.familyName} data-friend-artwork="canonical" data-run-seed={state.runSeed} data-light-variant={state.light.variant} data-balance-layout={state.balance.layout} data-celestial-constellation={state.celestial.constellation} data-sigil-id={sigil.id} data-restoration={state.restoration.phase}>
    <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 42, near: 0.1, far: 90, position: [10, 14, 18] }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      {state.scene === 'ISLAND' ? <Island state={state} identitySeed={Number(props.friendId % 1000n)} reducedMotion={reducedMotion} unlockProgress={unlockProgress} restorationSeconds={restorationSeconds} sigil={sigil} />
        : state.scene === 'TEMPLE_LIGHT' ? <LightTemple light={state.light} highlightedCrystal={nearby?.type === 'crystal' ? nearby.id : null} resetVersion={resetVersion} beamBroken={beamBroken} chargeStep={chargeStep} claiming={claiming} playerPosition={playerPosition} reducedMotion={reducedMotion} />
        : state.scene === 'ECHO_GARDEN' ? <EchoGarden echo={state.echo} activeRune={echoActiveRune} wrongRune={echoWrongRune} pulseAll={echoPulseAll} claiming={echoClaiming} playerPosition={playerPosition} reducedMotion={reducedMotion} />
          : state.scene === 'TEMPLE_BALANCE' ? <BalanceTemple balance={state.balance} nearbyBlock={nearby?.type === 'balance-block' ? nearby.id : null} resistedBlock={balanceResistedBlock} resetVersion={balanceResetVersion} chargeStep={balanceChargeStep} claiming={balanceClaiming} playerPosition={playerPosition} reducedMotion={reducedMotion} />
            : <CelestialObservatory state={state.celestial} config={celestialConfig} liveState={liveCelestial} finalStep={celestialFinalStep} missedRing={celestialMissedRing} perfectRing={celestialPerfectRing} claiming={celestialClaiming} playerPosition={playerPosition} reducedMotion={reducedMotion} onSymbolPass={onCelestialSymbolPass} />}
      <Player key={`${state.runSeed}:${state.scene}`} cameraOffset={state.scene === 'ISLAND' ? [10, 14, 18] : state.scene === 'TEMPLE_LIGHT' ? [7.5, 10, 13] : state.scene === 'ECHO_GARDEN' ? [7, 11, 13] : state.scene === 'TEMPLE_BALANCE' ? [8, 11, 15] : [8, 12, 16]} reducedMotion={reducedMotion} sprites={sprites} reaction={friendReaction} departing={friendDeparting} vector={input.vector} onPosition={reportPosition} onStep={() => audio.play('footstep')} bounds={state.scene === 'ISLAND' ? 9.45 : state.scene === 'TEMPLE_LIGHT' ? 6.3 : state.scene === 'ECHO_GARDEN' ? 7.7 : state.scene === 'TEMPLE_BALANCE' ? 8.8 : 8.25} spawn={state.scene === 'ISLAND' ? [0, -3.9] : state.scene === 'TEMPLE_LIGHT' ? [0, 2.5] : state.scene === 'ECHO_GARDEN' ? [0, 3.9] : [0, 6.35]} canMove={state.scene === 'TEMPLE_BALANCE' ? (x, z) => balanceWalkable(state.balance, x, z) : undefined} cinematicSeconds={state.restoration.phase === 'playing' ? restorationSeconds : null} celebrate={state.restoration.phase === 'complete' && state.scene === 'ISLAND'} />
    </Canvas>
    <HUD friend={session.identity.label} scene={state.scene} nearby={nearby?.label ?? null} onInteract={interact} muted={muted} onToggleMute={() => { const next = !muted; setMuted(next); audio.setMuted(next); }} shards={state.completedPortals.length} seals={seals} canReset={state.scene === 'TEMPLE_LIGHT' && state.light.phase === 'routing' || state.scene === 'TEMPLE_BALANCE' && state.balance.phase !== 'claimed' && state.balance.phase !== 'shard-ready' || state.scene === 'CELESTIAL_OBSERVATORY' && state.celestial.phase !== 'claimed' && state.celestial.phase !== 'shard-ready'} onReset={reset} intro={intro} banner={banner} portalStatuses={[1, 2, 3, 4].map(portal => portalStatus(state, portal))} echo={state.echo} echoCallout={echoCallout} balance={state.balance} balanceCallout={balanceCallout} celestial={state.celestial} celestialCallout={celestialCallout} restorationPhase={state.restoration.phase} restorationStage={state.restoration.phase === 'playing' ? restorationStage(restorationSeconds) : null} />
    <MobileControls onMove={input.setTouch} onInteract={interact} canInteract={Boolean(nearby?.actionable)} paused={props.paused || state.restoration.phase === 'playing' || completionOpen} />
    {completionOpen && state.restoration.phase === 'complete' && <CompletionScreen friend={session.identity.label} sigil={sigil} onExplore={() => setCompletionOpen(false)} onNewJourney={beginNewJourney} />}
    {flash && <div className="shard-flash" aria-hidden="true" />}
    <div className="portrait-hint">Rotate your device to landscape for the best view.</div>
  </main>;
}
