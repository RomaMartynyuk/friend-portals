import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
export function CentralMonument({ reducedMotion, reacting }: { reducedMotion: boolean; reacting: boolean }) {
  const crystal = useRef<Group>(null);
  useFrame(({ clock }) => { if (crystal.current && !reducedMotion) { crystal.current.rotation.y = clock.elapsedTime * 0.35; crystal.current.position.y = 2.75 + Math.sin(clock.elapsedTime * 1.5) * 0.08; } });
  return <group>
    <mesh castShadow receiveShadow position={[0, 0.26, 0]}><cylinderGeometry args={[2.05, 2.25, 0.52, 8]} /><meshStandardMaterial color="#d0c6a8" flatShading /></mesh>
    <mesh castShadow receiveShadow position={[0, 0.6, 0]}><cylinderGeometry args={[1.33, 1.52, 0.35, 8]} /><meshStandardMaterial color="#a6a18b" flatShading /></mesh>
    {Array.from({ length: 4 }, (_, i) => { const a = i * Math.PI / 2 + Math.PI / 4; return <mesh key={i} castShadow position={[Math.cos(a) * 1.18, 1.48, Math.sin(a) * 1.18]} rotation={[0, a, 0]}><boxGeometry args={[0.42, 1.7, 0.42]} /><meshStandardMaterial color="#d8cbae" /></mesh>; })}
    <group ref={crystal}><mesh castShadow><octahedronGeometry args={[0.7, 0]} /><meshStandardMaterial color="#9bbdb1" emissive="#6ca898" emissiveIntensity={reacting ? 0.9 : 0.35} flatShading /></mesh></group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.8, 0]}><torusGeometry args={[0.86, 0.06, 4, 8]} /><meshStandardMaterial color="#f4e6b7" emissive="#ccb975" emissiveIntensity={0.45} /></mesh>
  </group>;
}
