import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3, type Group, type Mesh } from 'three';
import type { EchoPuzzleState } from './EchoPuzzleState';
import { echoRunes, type RuneId } from './echoConfig';
import { EchoRune } from './EchoRune';
import { EchoShrine } from './EchoShrine';
import { EchoShard } from './EchoShard';
function EchoEnergy({ x, z, reducedMotion }: { x: number; z: number; reducedMotion: boolean }) {
  const start = useMemo(() => new Vector3(x, 0.6, z), [x, z]);
  const end = useMemo(() => new Vector3(0, 1.55, 0), []);
  const length = start.distanceTo(end);
  const midpoint = useMemo(() => start.clone().add(end).multiplyScalar(0.5), [start, end]);
  const rotation = useMemo(() => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), end.clone().sub(start).normalize()), [start, end]);
  const pulse = useRef<Mesh>(null);
  useFrame(({ clock }) => { if (pulse.current) pulse.current.position.copy(start).lerp(end, reducedMotion ? 0.55 : (clock.elapsedTime * 1.7 + x * 0.1 + z * 0.1) % 1); });
  return <>
    <mesh position={midpoint} quaternion={rotation}><cylinderGeometry args={[0.025, 0.025, length, 5]} /><meshBasicMaterial color="#b6ffe5" transparent opacity={0.72} /></mesh>
    <mesh ref={pulse}><octahedronGeometry args={[0.16, 0]} /><meshBasicMaterial color="#effff5" /></mesh>
  </>;
}
function EchoTree({ x, z, size }: { x: number; z: number; size: number }) {
  return <group position={[x, 0, z]} scale={size}>
    <mesh castShadow position={[0, 0.6, 0]}><cylinderGeometry args={[0.13, 0.19, 1.2, 5]} /><meshStandardMaterial color="#4b4b43" flatShading /></mesh>
    <mesh castShadow position={[0, 1.55, 0]}><coneGeometry args={[0.78, 1.55, 6]} /><meshStandardMaterial color="#386a61" flatShading /></mesh>
    <mesh castShadow position={[0, 2.1, 0]}><coneGeometry args={[0.57, 1.0, 6]} /><meshStandardMaterial color="#4b8975" flatShading /></mesh>
  </group>;
}
function EchoExit({ active }: { active: boolean }) {
  return <group position={[0, 0, 6.25]}>
    <mesh castShadow receiveShadow position={[0, 0.13, 0]}><cylinderGeometry args={[1.25, 1.5, 0.26, 8]} /><meshStandardMaterial color="#345056" flatShading /></mesh>
    {[-0.91, 0.91].map(x => <mesh key={x} castShadow position={[x, 1.48, 0]}><boxGeometry args={[0.39, 2.8, 0.52]} /><meshStandardMaterial color="#314a4d" /></mesh>)}
    <mesh castShadow position={[0, 2.95, 0]}><boxGeometry args={[2.23, 0.4, 0.54]} /><meshStandardMaterial color="#314a4d" /></mesh>
    <mesh position={[0, 1.5, 0]}><planeGeometry args={[1.55, 2.3]} /><meshBasicMaterial color={active ? '#a4f2db' : '#4c7774'} transparent opacity={active ? 0.74 : 0.25} side={2} depthWrite={false} /></mesh>
    <mesh position={[0, 1.52, 0.04]}><torusGeometry args={[0.47, 0.065, 4, 6]} /><meshStandardMaterial color={active ? '#d3ffee' : '#658e86'} emissive={active ? '#78cfac' : '#102b2b'} emissiveIntensity={active ? 0.8 : 0.1} /></mesh>
    {active && <pointLight color="#8fe9c9" intensity={1.3} distance={4} position={[0, 1.5, 0]} />}
  </group>;
}
export function EchoGarden({ echo, activeRune, wrongRune, pulseAll, claiming, playerPosition, reducedMotion }: {
  echo: EchoPuzzleState; activeRune: RuneId | null; wrongRune: RuneId | null; pulseAll: boolean;
  claiming: boolean; playerPosition: React.RefObject<[number, number]>; reducedMotion: boolean;
}) {
  const motes = useRef<Group>(null);
  useFrame(({ clock }) => { if (motes.current && !reducedMotion) motes.current.rotation.y = clock.elapsedTime * 0.025; });
  const awake = echo.completedRounds;
  return <>
    <color attach="background" args={['#536c73']} />
    <fog attach="fog" args={['#536c73', 19, 49]} />
    <ambientLight intensity={1.05} color="#bed8ce" />
    <hemisphereLight args={['#b9dfd1', '#314e55', 1.35]} />
    <directionalLight position={[-5, 11, 7]} intensity={2.1} color="#d3e2ca" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-11} shadow-camera-right={11} shadow-camera-top={11} shadow-camera-bottom={-11} />
    <group position={[0, -5.3, 0]}>{Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return <mesh key={i} position={[Math.cos(a) * 10.5, (i % 3) * 0.34, Math.sin(a) * 10.5]} scale={[3.0, 0.65, 1.9]}><sphereGeometry args={[1, 8, 5]} /><meshBasicMaterial color="#b4c7bf" transparent opacity={0.16} depthWrite={false} /></mesh>; })}</group>
    <mesh castShadow receiveShadow position={[0, -0.78, 0]}><cylinderGeometry args={[8.45, 7.75, 1.55, 12]} /><meshStandardMaterial color="#314744" flatShading roughness={1} /></mesh>
    <mesh receiveShadow position={[0, -0.035, 0]}><cylinderGeometry args={[8.3, 8.3, 0.09, 12]} /><meshStandardMaterial color="#628a6e" flatShading roughness={1} /></mesh>
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[7.6, 7.85, 12]} /><meshStandardMaterial color="#354f52" side={2} /></mesh>
    {echoRunes.map((rune, i) => { const length = Math.hypot(rune.x, rune.z), angle = Math.atan2(rune.x, rune.z); return <mesh key={i} receiveShadow position={[rune.x * 0.48, 0.045, rune.z * 0.48]} rotation={[0, angle, 0]}><boxGeometry args={[0.63, 0.05, length * 0.9]} /><meshStandardMaterial color="#7e9380" roughness={1} /></mesh>; })}
    {[[-5.2, 0.6], [5.2, 0.6]].map(([x, z], i) => <mesh key={i} position={[x, 0.05, z]}><cylinderGeometry args={[1.15, 1.15, 0.055, 10]} /><meshStandardMaterial color="#639e96" emissive="#377d79" emissiveIntensity={0.18} transparent opacity={0.78} /></mesh>)}
    {[[5.9,-3.4,0.85],[-5.9,-3.7,0.9],[5.7,3.7,0.78],[-5.8,3.9,0.84],[0,-6.9,0.7]].map(([x,z,size], i) => <EchoTree key={i} x={x} z={z} size={size} />)}
    {Array.from({ length: 42 }, (_, i) => { const a = i * 2.39996, r = 4.5 + (i * 1.73) % 2.65; const x = Math.cos(a) * r, z = Math.sin(a) * r; const lit = i % 3 < awake; return <group key={i} position={[x, 0.04, z]}>
      <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.025, 0.035, 0.28, 4]} /><meshStandardMaterial color="#395f4e" /></mesh>
      <mesh position={[0, 0.3, 0]}><octahedronGeometry args={[0.1, 0]} /><meshStandardMaterial color={i % 2 ? '#c7dac0' : '#a9d8ca'} emissive={lit ? '#78caaa' : '#183c35'} emissiveIntensity={lit ? 0.5 : 0.08} /></mesh>
    </group>; })}
    {Array.from({ length: 7 }, (_, i) => { const a = i * Math.PI * 2 / 7; return <group key={i} position={[Math.cos(a) * 7.35, 0, Math.sin(a) * 7.35]}>
      <mesh castShadow position={[0, 0.46, 0]}><boxGeometry args={[0.45, 0.92, 0.44]} /><meshStandardMaterial color="#526d68" /></mesh>
      <mesh position={[0, 0.97, 0]}><octahedronGeometry args={[0.17, 0]} /><meshStandardMaterial color={awake >= 2 ? '#afe6d0' : '#667f79'} emissive={awake >= 2 ? '#78bea3' : '#1b3936'} emissiveIntensity={awake >= 2 ? 0.45 : 0.06} /></mesh>
    </group>; })}
    <EchoShrine completedRounds={awake} phase={echo.phase} pulse={pulseAll || echo.phase === 'playback' || echo.phase === 'retry'} reducedMotion={reducedMotion} />
    {echo.phase === 'finale' && pulseAll && echoRunes.map((rune, i) => <EchoEnergy key={i} x={rune.x} z={rune.z} reducedMotion={reducedMotion} />)}
    {echoRunes.map((_, i) => <EchoRune key={i} id={i as RuneId} active={pulseAll || activeRune === i} wrong={wrongRune === i} awake={awake > 0} reducedMotion={reducedMotion} />)}
    <EchoExit active={echo.phase === 'claimed'} />
    {(echo.phase === 'shard-ready' || claiming) && <EchoShard claiming={claiming} playerPosition={playerPosition} reducedMotion={reducedMotion} />}
    <group ref={motes}>{Array.from({ length: 26 + awake * 6 }, (_, i) => { const a = i * 2.39996, r = 1.1 + (i * 1.47) % 6.3; return <mesh key={i} position={[Math.cos(a) * r, 0.85 + (i % 6) * 0.45, Math.sin(a) * r]} rotation={[0, a, 0.4]}><octahedronGeometry args={[i % 5 ? 0.035 : 0.065, 0]} /><meshBasicMaterial color={i % 3 ? '#c7e8d3' : '#a3dbcf'} transparent opacity={awake >= 2 ? 0.6 : 0.33} /></mesh>; })}</group>
    {Array.from({ length: 5 }, (_, i) => { const a = i * 1.256; return <mesh key={i} position={[Math.cos(a) * 10, -1.7 + (i % 2), Math.sin(a) * 10]} rotation={[0, a, 0.5]}><dodecahedronGeometry args={[0.55, 0]} /><meshStandardMaterial color="#43595b" flatShading /></mesh>; })}
  </>;
}
