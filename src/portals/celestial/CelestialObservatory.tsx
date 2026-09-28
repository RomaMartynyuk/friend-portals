import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';
import { CelestialControl } from './CelestialControl';
import { CelestialGlyph } from './CelestialGlyph';
import { CelestialRing } from './CelestialRing';
import { CelestialShard } from './CelestialShard';
import { Constellation } from './Constellation';
import { constellations, type CelestialConfig, type RingId } from './celestialConfig';
import type { CelestialPuzzleState } from './CelestialPuzzleState';

function ObservatoryExit({ active }: { active: boolean }) {
  return <group position={[0, 0, 7.05]}>
    <mesh receiveShadow position={[0, 0.12, 0]}><cylinderGeometry args={[1.17, 1.32, 0.24, 8]} /><meshStandardMaterial color="#55576f" flatShading /></mesh>
    {[-0.94, 0.94].map(x => <mesh key={x} castShadow position={[x, 1.55, 0]}><boxGeometry args={[0.39, 3.0, 0.55]} /><meshStandardMaterial color="#55556d" metalness={0.18} roughness={0.8} /></mesh>)}
    <mesh castShadow position={[0, 3.1, 0]}><boxGeometry args={[2.34, 0.42, 0.58]} /><meshStandardMaterial color="#77778d" /></mesh>
    <mesh position={[0, 1.65, 0]}><planeGeometry args={[1.56, 2.45]} /><meshBasicMaterial color={active ? '#a4a5ed' : '#343553'} transparent opacity={active ? 0.68 : 0.27} side={2} depthWrite={false} /></mesh>
    <mesh position={[0, 1.7, 0.04]}><torusGeometry args={[0.48, 0.065, 5, 8]} /><meshStandardMaterial color={active ? '#d1caff' : '#737590'} emissive={active ? '#8d89d4' : '#22243d'} emissiveIntensity={active ? 0.9 : 0.1} /></mesh>
    {active && <pointLight position={[0, 1.8, 0]} color="#9597df" intensity={1.3} distance={4} />}
  </group>;
}

export function CelestialObservatory({ state, config, liveState, finalStep, missedRing, perfectRing, claiming, playerPosition, reducedMotion, onSymbolPass }: {
  state: CelestialPuzzleState; config: CelestialConfig; liveState: () => CelestialPuzzleState; finalStep: number;
  missedRing: RingId | null; perfectRing: RingId | null; claiming: boolean; playerPosition: React.RefObject<[number, number]>;
  reducedMotion: boolean; onSymbolPass: (ring: RingId) => void;
}) {
  const dust = useRef<Group>(null), crown = useRef<Group>(null), astrolabe = useRef<Group>(null);
  const shape = constellations[config.constellation], complete = state.phase === 'shard-ready' || state.phase === 'claimed';
  useFrame(({ clock }, delta) => {
    if (dust.current && !reducedMotion) dust.current.rotation.y = clock.elapsedTime * 0.012;
    if (crown.current && !reducedMotion) crown.current.rotation.y = state.phase === 'finale' || complete ? clock.elapsedTime * 0.19 : 0;
    if (astrolabe.current) astrolabe.current.rotation.y = MathUtils.damp(astrolabe.current.rotation.y, state.phase === 'finale' && finalStep >= 2 || complete ? 0.28 : 0, reducedMotion ? 1000 : 0.85, delta);
  });
  return <>
    <color attach="background" args={[config.skySeed & 1 ? '#111626' : '#15162a']} />
    <fog attach="fog" args={['#151729', 19, 55]} />
    <ambientLight intensity={0.53} color="#a8a9d1" />
    <hemisphereLight args={['#7f86b8', '#171823', 0.8]} />
    <directionalLight position={[-6, 12, 7]} intensity={1.6} color="#c7c4ed" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
    <pointLight position={[0, 5.5, -1.3]} color="#8d8cdd" intensity={complete || finalStep >= 4 ? 3.1 : 1.3} distance={12} />
    <Constellation config={config} phase={state.phase} revealStep={finalStep} />
    <mesh castShadow receiveShadow position={[0, -0.7, 0]}><cylinderGeometry args={[8.5, 7.9, 1.3, 12]} /><meshStandardMaterial color="#282a3e" flatShading roughness={1} /></mesh>
    <mesh receiveShadow position={[0, -0.035, 0]}><cylinderGeometry args={[8.34, 8.34, 0.08, 12]} /><meshStandardMaterial color="#474960" flatShading roughness={0.95} /></mesh>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}><ringGeometry args={[7.54, 7.69, 48]} /><meshBasicMaterial color="#8585ae" transparent opacity={0.42} side={2} /></mesh>
    {Array.from({ length: 12 }, (_, index) => { const a = index * Math.PI / 6; return <mesh key={index} position={[Math.sin(a) * 7.72, 0.14, Math.cos(a) * 7.72]} rotation={[0, a, 0]}><boxGeometry args={[0.11, 0.16, 0.65]} /><meshStandardMaterial color={index % 3 === 0 ? '#aaa6c9' : '#666a90'} emissive={index % 3 === 0 ? '#7775ac' : '#18192d'} emissiveIntensity={0.25} /></mesh>; })}
    <group ref={astrolabe} position={[0, 0, -1.3]}>
    <mesh receiveShadow castShadow position={[0, 0.09, 0]}><cylinderGeometry args={[4.17, 4.35, 0.32, 32]} /><meshStandardMaterial color="#272a41" metalness={0.25} roughness={0.7} flatShading /></mesh>
    <mesh position={[0, 0.285, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[3.88, 3.99, 64]} /><meshBasicMaterial color="#70739d" transparent opacity={0.44} side={2} /></mesh>
    {([0, 1, 2] as const).map(index => <CelestialRing key={index} index={index} target={shape.targets[index]} state={state} angleNow={() => liveState().angles[index]} onSymbolPass={onSymbolPass} />)}
    {([3.55, 2.62, 1.68] as const).map((radius, index) => (finalStep >= index + 1 || complete) && <group key={index}>
      <mesh position={[0, 0.58 + index * 0.07, -radius / 2]}><boxGeometry args={[0.05 + index * 0.014, 0.035, radius]} /><meshBasicMaterial color={index === 2 ? '#f0eaff' : '#a8a5e8'} transparent opacity={0.58} depthWrite={false} /></mesh>
      <mesh position={[0, 0.62 + index * 0.07, -radius]}><octahedronGeometry args={[0.13, 0]} /><meshBasicMaterial color="#eeeaff" /></mesh>
    </group>)}
    <group ref={crown} position={[0, 1.65, 0]}>
      <mesh castShadow><icosahedronGeometry args={[0.75, 0]} /><meshStandardMaterial color={complete || finalStep >= 4 ? '#c6c3ef' : '#5c618a'} emissive={complete || finalStep >= 4 ? '#8d88de' : '#25264a'} emissiveIntensity={complete || finalStep >= 4 ? 1.1 : 0.2} metalness={0.3} flatShading /></mesh>
      <mesh rotation={[0.55, 0, 0.45]}><torusGeometry args={[1.14, 0.055, 5, 24]} /><meshStandardMaterial color="#9294c2" emissive="#434370" emissiveIntensity={0.35} /></mesh>
      <mesh rotation={[-0.4, 0.65, -0.2]}><torusGeometry args={[1.0, 0.044, 5, 24]} /><meshBasicMaterial color="#9799d0" transparent opacity={0.75} /></mesh>
    </group>
    </group>
    {([0, 1, 2] as const).map(index => <CelestialControl key={index} ring={index} active={index === state.lockedCount && state.phase === 'running'} locked={index < state.lockedCount} missed={missedRing === index} perfect={perfectRing === index} />)}
    <group position={[0, 0, 2.95]}>
      <mesh castShadow position={[0, 0.4, 0]}><cylinderGeometry args={[0.72, 0.88, 0.8, 8]} /><meshStandardMaterial color="#45475e" flatShading /></mesh>
      <mesh position={[0, 0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.61, 8]} /><meshBasicMaterial color="#24263f" /></mesh>
      <group position={[0, 0.91, 0]} rotation={[-Math.PI / 2, 0, 0]}><CelestialGlyph symbol="STAR" color="#c5c4f4" scale={0.68} /></group>
      <mesh position={[0, 1.1, 0]}><octahedronGeometry args={[0.22, 0]} /><meshBasicMaterial color="#c7c9fa" /></mesh>
    </group>
    <ObservatoryExit active={state.phase === 'claimed'} />
    {(state.phase === 'shard-ready' || claiming) && <CelestialShard claiming={claiming} playerPosition={playerPosition} reducedMotion={reducedMotion} />}
    {Array.from({ length: 8 }, (_, index) => { const a = index * Math.PI / 4 + 0.35; return <group key={index} position={[Math.sin(a) * 10.4, -1.45 - index % 3 * 0.35, Math.cos(a) * 10.4]} rotation={[0.18, a, 0.2]}><mesh castShadow><dodecahedronGeometry args={[0.8 + index % 3 * 0.23, 0]} /><meshStandardMaterial color="#34374f" flatShading /></mesh></group>; })}
    <group position={[0, -5.0, -3]}>{Array.from({ length: 9 }, (_, index) => { const a = index * 2.4; return <mesh key={index} position={[Math.sin(a) * 12, index % 3 * 0.5, Math.cos(a) * 12]} scale={[2.7, 0.5, 1.6]}><sphereGeometry args={[1, 8, 5]} /><meshBasicMaterial color="#9199c4" transparent opacity={0.08} depthWrite={false} /></mesh>; })}</group>
    <group ref={dust}>{Array.from({ length: 34 }, (_, index) => { const a = index * 2.3999, radius = 1.8 + (index * 1.29) % 7; return <mesh key={index} position={[Math.sin(a) * radius, 0.9 + index % 8 * 0.37, Math.cos(a) * radius]}><octahedronGeometry args={[index % 5 ? 0.026 : 0.055, 0]} /><meshBasicMaterial color={index % 2 ? '#c8c4ee' : '#999dda'} transparent opacity={0.53} /></mesh>; })}</group>
  </>;
}
