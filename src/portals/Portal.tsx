import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, Group } from 'three';
import type { PortalStatus } from '../game/GameState';
export const portalConfig = [
  { name: 'TEMPLE OF LIGHT', color: '#f7d87a', x: 0, z: -6.4 },
  { name: 'ECHO GARDEN', color: '#78d9b1', x: 6.4, z: 0 },
  { name: 'TEMPLE OF BALANCE', color: '#f19a70', x: 0, z: 6.4 },
  { name: 'CELESTIAL MECHANISM', color: '#a8a2f4', x: -6.4, z: 0 },
] as const;
export function Portal({ index, status, reducedMotion }: { index: number; status: PortalStatus; reducedMotion: boolean }) {
  const info = portalConfig[index];
  const core = useRef<Mesh>(null);
  const particles = useRef<Group>(null);
  useFrame(({ clock }) => { if (core.current) core.current.scale.setScalar(status !== 'locked' && !reducedMotion ? 1 + Math.sin(clock.elapsedTime * 2 + index) * 0.05 : 1); if (particles.current && !reducedMotion) particles.current.rotation.y = clock.elapsedTime * (status === 'locked' ? 0.08 : 0.3); });
  const angle = Math.atan2(info.x, info.z);
  return <group position={[info.x, 0, info.z]} rotation={[0, angle, 0]}>
    <mesh receiveShadow position={[0, 0.18, 0]}><cylinderGeometry args={[1.62, 1.85, 0.36, 8]} /><meshStandardMaterial color="#8d8a77" flatShading /></mesh>
    {[-1.12, 1.12].map(x => <mesh key={x} castShadow position={[x, 1.55, 0]}><boxGeometry args={[0.48, 3.05, 0.55]} /><meshStandardMaterial color="#d4c9ac" roughness={1} /></mesh>)}
    <mesh castShadow position={[0, 3.14, 0]}><boxGeometry args={[2.85, 0.49, 0.65]} /><meshStandardMaterial color="#d4c9ac" roughness={1} /></mesh>
    <mesh ref={core} position={[0, 1.65, 0]}><planeGeometry args={[1.96, 2.62]} /><meshBasicMaterial color={status === 'locked' ? '#34404a' : status === 'complete' ? '#fff0bc' : info.color} transparent opacity={status === 'locked' ? 0.52 : status === 'complete' ? 0.52 : 0.73} side={2} depthWrite={false} /></mesh>
    <mesh position={[0, 1.75, 0.08]}><torusGeometry args={[0.57, 0.07, 5, 6]} /><meshStandardMaterial color={status === 'locked' ? '#7d8789' : '#fff0b8'} emissive={status === 'locked' ? '#1a2328' : info.color} emissiveIntensity={status === 'locked' ? 0.1 : 1.5} flatShading /></mesh>
    <mesh position={[0, 1.75, 0.13]}><octahedronGeometry args={[0.18, 0]} /><meshBasicMaterial color={status === 'locked' ? '#899195' : '#fff9dc'} /></mesh>
    <group ref={particles} position={[0, 1.7, 0]}>{Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return <mesh key={i} position={[Math.cos(a) * 1.5, Math.sin(a * 2) * 0.75, Math.sin(a) * 0.75]}><octahedronGeometry args={[status === 'locked' ? 0.045 : 0.075, 0]} /><meshBasicMaterial color={status === 'locked' ? '#82918e' : info.color} transparent opacity={status === 'locked' ? 0.3 : 0.85} /></mesh>; })}</group>
    {status === 'complete' && <group position={[0, 3.8, 0]}><mesh><octahedronGeometry args={[0.34, 0]} /><meshStandardMaterial color="#fff5cd" emissive="#e0b363" emissiveIntensity={0.8} /></mesh><mesh rotation={[0, 0, Math.PI / 4]}><torusGeometry args={[0.47, 0.045, 4, 4]} /><meshBasicMaterial color="#fff1b5" /></mesh></group>}
    <pointLight color={info.color} intensity={status === 'active' ? 2.2 : status === 'complete' ? 1.3 : 0.15} distance={5} position={[0, 2.4, 0]} />
  </group>;
}
