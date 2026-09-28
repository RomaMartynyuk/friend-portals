import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';
import type { LightPhase } from './LightPuzzleState';
import { lightNodes } from './LightPuzzleState';
export function PortalCore({ phase, chargeStep, reducedMotion }: { phase: LightPhase; chargeStep: number; reducedMotion: boolean }) {
  const rings = useRef<Group>(null);
  const open = phase === 'shard-ready' || phase === 'claimed';
  const charged = phase !== 'routing';
  useFrame(({ clock }, delta) => {
    if (!rings.current) return;
    if (!reducedMotion) rings.current.rotation.y += delta * (charged ? 0.7 : 0.16);
    rings.current.scale.setScalar(MathUtils.damp(rings.current.scale.x, open ? 1.25 : 1, 5, delta));
    rings.current.position.y = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.5) * 0.08;
  });
  return <group position={[lightNodes.core[0], 0, lightNodes.core[2]]}>
    <mesh castShadow position={[0, 0.55, 0]}><cylinderGeometry args={[0.95, 1.2, 1.1, 8]} /><meshStandardMaterial color="#242a30" flatShading /></mesh>
    <mesh castShadow position={[0, 1.12, 0]}><cylinderGeometry args={[0.84, 0.95, 0.13, 8]} /><meshStandardMaterial color="#e7d8b6" /></mesh>
    <group ref={rings} position={[0, 1.7, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.76, 0.095, 5, 8]} /><meshStandardMaterial color={charged ? '#fff0bc' : '#787d79'} emissive={charged ? '#d4a449' : '#161918'} emissiveIntensity={charged ? 0.65 + chargeStep * 0.2 : 0.1} /></mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.58, 0.07, 5, 8]} /><meshStandardMaterial color={charged ? '#fff7d5' : '#858982'} emissive={charged ? '#e5c179' : '#141919'} emissiveIntensity={charged ? 0.8 : 0.1} /></mesh>
      <mesh><octahedronGeometry args={[0.25, 0]} /><meshStandardMaterial color={open ? '#fff6d0' : '#353f43'} emissive={open ? '#f4cc7c' : '#111518'} emissiveIntensity={open ? 1.2 : 0.08} /></mesh>
    </group>
    {charged && <pointLight color="#f6d389" intensity={open ? 2 : 0.7 + chargeStep * 0.25} distance={4.5} position={[0, 2, 0]} />}
  </group>;
}
