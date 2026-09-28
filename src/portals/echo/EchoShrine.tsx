import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { EchoPhase } from './EchoPuzzleState';
export function EchoShrine({ completedRounds, phase, pulse, reducedMotion }: { completedRounds: number; phase: EchoPhase; pulse: boolean; reducedMotion: boolean }) {
  const crown = useRef<Group>(null);
  useFrame(({ clock }) => { if (crown.current && !reducedMotion) crown.current.rotation.y = Math.sin(clock.elapsedTime * 0.55) * 0.12; });
  const restored = phase === 'claimed' || phase === 'shard-ready' || phase === 'finale';
  return <group>
    <mesh castShadow receiveShadow position={[0, 0.28, 0]}><cylinderGeometry args={[1.17, 1.35, 0.56, 8]} /><meshStandardMaterial color="#283e42" flatShading /></mesh>
    <mesh castShadow receiveShadow position={[0, 0.62, 0]}><cylinderGeometry args={[0.83, 0.99, 0.18, 8]} /><meshStandardMaterial color="#527a73" flatShading /></mesh>
    <group ref={crown} position={[0, 1.28, 0]}>
      <mesh><octahedronGeometry args={[0.45, 0]} /><meshStandardMaterial color={restored ? '#d7fff2' : '#638a80'} emissive={restored ? '#8ddac2' : '#1d4e47'} emissiveIntensity={restored ? 0.7 : pulse ? 0.4 : 0.1} /></mesh>
      {Array.from({ length: 3 }, (_, i) => { const a = i * Math.PI * 2 / 3 - Math.PI / 2; const active = i < completedRounds; return <group key={i} position={[Math.cos(a) * 0.89, 0.15, Math.sin(a) * 0.89]}>
        <mesh><octahedronGeometry args={[0.24, 0]} /><meshStandardMaterial color={active ? '#dfffee' : '#314b4d'} emissive={active ? '#70cfad' : '#102c2f'} emissiveIntensity={active ? 0.8 : 0.1} /></mesh>
      </group>; })}
    </group>
    <mesh position={[0, 0.75, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.15, 0.055, 4, 8]} /><meshBasicMaterial color={pulse || restored ? '#a5e4d1' : '#4f7773'} transparent opacity={pulse || restored ? 0.8 : 0.3} /></mesh>
    {pulse && <pointLight color="#a6f2d5" intensity={1.2} distance={4} position={[0, 2, 0]} />}
  </group>;
}
