import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
export function CentralMonument({ reducedMotion, reacting, completedPortals, restorationSeconds = 0, restored = false }: { reducedMotion: boolean; reacting: boolean; completedPortals: readonly number[]; restorationSeconds?: number; restored?: boolean }) {
  const ready = completedPortals.length === 4;
  const rise = restored ? 1 : Math.max(0, Math.min(1, (restorationSeconds - 8.1) / 1.45));
  const crystal = useRef<Group>(null);
  useFrame(({ clock }) => { if (crystal.current && !reducedMotion) { crystal.current.rotation.y = clock.elapsedTime * 0.35; crystal.current.position.y = 2.75 + Math.sin(clock.elapsedTime * 1.5) * 0.08; } });
  return <group>
    <mesh castShadow receiveShadow position={[0, 0.26, 0]}><cylinderGeometry args={[2.05, 2.25, 0.52, 8]} /><meshStandardMaterial color="#d0c6a8" flatShading /></mesh>
    <mesh castShadow receiveShadow position={[0, 0.6, 0]}><cylinderGeometry args={[1.33, 1.52, 0.35, 8]} /><meshStandardMaterial color="#a6a18b" flatShading /></mesh>
    {Array.from({ length: 4 }, (_, i) => { const a = i * Math.PI / 2 + Math.PI / 4; return <group key={i} position={[Math.cos(a) * (1.18 + rise * 0.23), rise * 0.65, Math.sin(a) * (1.18 + rise * 0.23)]} rotation={[0, a + rise * 0.13, 0]}><mesh castShadow position={[0, 1.48, 0]}><boxGeometry args={[0.42, 1.7, 0.42]} /><meshStandardMaterial color={restored ? '#efe0bb' : '#d8cbae'} /></mesh>{rise > 0 && <mesh position={[0, 2.38, 0]}><octahedronGeometry args={[0.14, 0]} /><meshBasicMaterial color={['#ffe3a3', '#a7eace', '#f2b588', '#c7bbff'][i]} /></mesh>}</group>; })}
    {Array.from({ length: 4 }, (_, i) => { const a = i * Math.PI / 2; const active = completedPortals.includes(i + 1); const color = ['#f5dd9a', '#9de9cc', '#efaa80', '#b7aef4'][i]; return <mesh key={i} position={[Math.sin(a) * 0.93, 0.94, Math.cos(a) * 0.93]}><octahedronGeometry args={[0.19, 0]} /><meshStandardMaterial color={active ? color : '#777d75'} emissive={active ? color : '#111c1b'} emissiveIntensity={active ? 0.8 : 0.08} /></mesh>; })}
    <group ref={crystal} scale={1 + rise * 0.32}><mesh castShadow><octahedronGeometry args={[0.7, 0]} /><meshStandardMaterial color={restored ? '#fffbee' : ready ? '#dfd6ff' : '#9bbdb1'} emissive={restored ? '#fff4d3' : ready ? '#a8a0ed' : '#6ca898'} emissiveIntensity={restored ? 1.4 : reacting ? 1.1 : ready ? 0.8 : 0.35} flatShading /></mesh></group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.8, 0]}><torusGeometry args={[0.86, 0.06, 4, 8]} /><meshStandardMaterial color={ready ? '#e6dcff' : '#f4e6b7'} emissive={ready ? '#9d94e5' : '#ccb975'} emissiveIntensity={ready ? 0.78 : 0.45} /></mesh>
    {ready && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.1, 0]}><ringGeometry args={[1.13, 1.17, 32]} /><meshBasicMaterial color="#c5bbf6" transparent opacity={0.55} side={2} /></mesh>}
    {rise > 0 && Array.from({ length: 4 }, (_, i) => { const a = i * Math.PI / 2; return <mesh key={`channel-${i}`} rotation={[-Math.PI / 2, 0, a]} position={[Math.sin(a) * 0.55, 0.96 + rise * 0.1, Math.cos(a) * 0.55]}><planeGeometry args={[0.09, 0.92]} /><meshBasicMaterial color={['#ffe4a9', '#a8e8d2', '#efb28a', '#c6baff'][i]} transparent opacity={rise * 0.8} side={2} /></mesh>; })}
    {restored && <group position={[0, 3.1, 0]}><mesh rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.88, 0.08, 6, 24]} /><meshBasicMaterial color="#fff2d8" /></mesh><mesh><octahedronGeometry args={[0.24, 0]} /><meshBasicMaterial color="#fffdfa" /></mesh></group>}
  </group>;
}
