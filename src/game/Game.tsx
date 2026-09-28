import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameComponentProps } from '@rarefriends/friendsdk/runtime';
import { gameSession } from '../sdk/friendSdkAdapter';
import { initialGameState, enterTestRoom, returnToIsland, type GameState } from './GameState';
import { useMovementInput } from '../input/useMovementInput';
import { AudioManager } from '../audio/AudioManager';
import { Island } from '../world/Island';
import { TestRoom } from '../rooms/TestRoom';
import { Player } from '../player/Player';
import { portalConfig } from '../portals/Portal';
import { HUD } from '../ui/HUD';
import { MobileControls } from '../ui/MobileControls';
import '../../style.css';
export default function Game(props: GameComponentProps) {
  const session = gameSession(props);
  const [state, setState] = useState<GameState>(initialGameState);
  const [nearby, setNearby] = useState<string | null>(null);
  const nearRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const audio = useMemo(() => new AudioManager(), []);
  const openScene = useCallback(() => {
    if (props.paused || !nearRef.current) return;
    audio.play('interaction');
    if (state.scene === 'ISLAND' && nearRef.current === 'ENTER PORTAL I') setState(enterTestRoom);
    else if (state.scene === 'PORTAL_1_TEST') setState(returnToIsland);
  }, [state.scene, props.paused, audio]);
  const input = useMovementInput(props.paused || status !== 'ready', openScene);
  useEffect(() => { let active = true; setStatus('loading'); void props.client.read().then(snapshot => {
    if (!active) return;
    if (snapshot.friendId !== props.friendId) throw new Error('Selected Friend changed. Please re-enter the game.');
    setStatus('ready');
  }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : 'Unable to open the game.'); setStatus('error'); } });
  return () => { active = false; }; }, [props.client, props.friendId]);
  useEffect(() => () => audio.dispose(), [audio]);
  useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReducedMotion(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => { nearRef.current = null; setNearby(null); input.setTouch({ x: 0, z: 0 }); }, [state.scene]);
  const reportPosition = useCallback((x: number, z: number) => {
    let next: string | null = null;
    if (state.scene === 'ISLAND') {
      const first = portalConfig[0];
      if (Math.hypot(x - first.x, z - first.z) < 2.25) next = 'ENTER PORTAL I';
      else if (portalConfig.slice(1).some(p => Math.hypot(x - p.x, z - p.z) < 2.25)) next = 'PORTAL LOCKED';
    } else if (Math.hypot(x, z - 4.1) < 2.1) next = 'RETURN TO ISLAND';
    if (nearRef.current !== next) { nearRef.current = next; setNearby(next); }
  }, [state.scene]);
  const interact = () => { if (nearby !== 'PORTAL LOCKED') openScene(); };
  if (status !== 'ready') return <div className="startup" role={status === 'error' ? 'alert' : 'status'}><strong>FRIEND PORTALS</strong><p>{status === 'error' ? error : 'Opening the island…'}</p>{status === 'error' && <button onClick={() => { setStatus('loading'); void props.client.read().then(() => setStatus('ready')).catch(cause => { setError(String(cause)); setStatus('error'); }); }}>RETRY</button>}</div>;
  return <main className="game-shell" aria-label="Friend Portals game">
    <Canvas key={state.scene} shadows dpr={[1, 1.5]} camera={{ fov: 42, near: 0.1, far: 90, position: [10, 14, 18] }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      {state.scene === 'ISLAND' ? <Island state={state} identitySeed={Number(props.friendId % 1000n)} reducedMotion={reducedMotion} /> : <TestRoom reducedMotion={reducedMotion} />}
      <Player reducedMotion={reducedMotion} identity={session.identity} vector={input.vector} onPosition={reportPosition} bounds={state.scene === 'ISLAND' ? 9.45 : 5.6} spawn={state.scene === 'ISLAND' ? [0, -3.9] : [0, -3.2]} />
    </Canvas>
    <HUD friend={session.identity.label} scene={state.scene} nearby={nearby} onInteract={interact} onReturn={() => setState(returnToIsland)} muted={muted} onToggleMute={() => { const next = !muted; setMuted(next); audio.setMuted(next); }} />
    <MobileControls onMove={input.setTouch} onInteract={interact} canInteract={Boolean(nearby && nearby !== 'PORTAL LOCKED')} paused={props.paused} />
    <div className="portrait-hint">Rotate your device to landscape for the best view.</div>
  </main>;
}
