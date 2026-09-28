import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, MeshBasicMaterial } from 'three';
import { sealPositions } from './LightPuzzleState';
export function LightReceiver({ index, active, pulse, reducedMotion }: { index: number; active: boolean; pulse: boolean; reducedMotion: boolean }) {
  const node = sealPositions[index];
  const burst = useRef<Mesh>(null);
  const elapsed = useRef(10);
  useEffect(() => { if (active) elapsed.current = 0; }, [active]);
  useFrame((_, delta) => {
    if (!burst.current) return;
    elapsed.current += delta;
    const t = reducedMotion ? 1 : Math.min(1, elapsed.current / 0.65);
    burst.current.scale.setScalar(0.5 + t * 1.5);
    (burst.current.material as MeshBasicMaterial).opacity = active ? (1 - t) * 0.7 : 0;
  });
  return <group position={[node[0], 0, node[2]]}>
    <mesh castShadow position={[0, 0.47, 0]}><cylinderGeometry args={[0.6, 0.71, 0.94, 8]} /><meshStandardMaterial color="#292d32" flatShading /></mesh>
    <mesh position={[0, 0.96, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.52, 8]} /><meshStandardMaterial color={active ? '#fae5a8' : '#555b59'} emissive={active ? '#ddac51' : '#080a0c'} emissiveIntensity={active ? (pulse ? 1.2 : 0.55) : 0.1} side={2} /></mesh>
    <mesh position={[0, 0.98, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.32, 0.052, 4, 6]} /><meshBasicMaterial color={active ? '#fff9d9' : '#88908a'} /></mesh>
    <mesh position={[0, 0.99, 0]} rotation={[-Math.PI / 2, 0, 0.5]}><boxGeometry args={[0.08, 0.55, 0.03]} /><meshBasicMaterial color={active ? '#fff9d9' : '#88908a'} /></mesh>
    <mesh ref={burst} position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.44, 0.52, 8]} /><meshBasicMaterial color="#fff2ba" transparent opacity={0} depthWrite={false} /></mesh>
    {active && Array.from({ length: 4 }, (_, i) => { const a = i * Math.PI / 2; return <mesh key={i} position={[Math.cos(a) * 0.6, 1.25 + (i % 2) * 0.12, Math.sin(a) * 0.6]}><octahedronGeometry args={[0.07, 0]} /><meshBasicMaterial color="#ffeaba" /></mesh>; })}
  </group>;
}
