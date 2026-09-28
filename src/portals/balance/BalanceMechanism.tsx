import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';
import type { BalancePuzzleState } from './BalancePuzzleState';

export function BalanceMechanism({ balance, chargeStep, reducedMotion }: { balance: BalancePuzzleState; chargeStep: number; reducedMotion: boolean }) {
  const beam = useRef<Group>(null), left = useRef<Group>(null), right = useRef<Group>(null), bridge = useRef<Group>(null), gate = useRef<Group>(null);
  const final = balance.stage === 3;
  useFrame((_, delta) => {
    const speed = reducedMotion ? 1000 : 3.5;
    if (beam.current) beam.current.rotation.z = MathUtils.damp(beam.current.rotation.z, final ? 0 : balance.stage >= 2 ? -0.08 : balance.stage >= 1 ? 0.09 : 0.23, speed, delta);
    if (left.current) left.current.position.y = MathUtils.damp(left.current.position.y, balance.stage >= 1 ? 1.7 : 0.9, speed, delta);
    if (right.current) right.current.position.y = MathUtils.damp(right.current.position.y, balance.stage >= 2 ? 0.9 : 1.7, speed, delta);
    if (bridge.current) bridge.current.position.y = MathUtils.damp(bridge.current.position.y, final ? 0.08 : balance.stage >= 1 ? -1.45 : -2.8, speed, delta);
    if (gate.current) gate.current.position.y = MathUtils.damp(gate.current.position.y, balance.stage >= 2 ? 2.8 : 0, speed, delta);
  });
  return <group>
    <group position={[0, 0, -2.28]}>
      {[-4.65, 4.65].map(x => <group key={x} position={[x, 0, 0]}>
        <mesh castShadow position={[0, 2.55, 0]}><boxGeometry args={[0.67, 5.1, 0.7]} /><meshStandardMaterial color="#332f2e" flatShading /></mesh>
        <mesh castShadow position={[0, 5.1, 0]}><boxGeometry args={[1.0, 0.45, 1.0]} /><meshStandardMaterial color="#aa8058" metalness={0.32} roughness={0.7} /></mesh>
      </group>)}
      <group ref={beam} position={[0, 4.52, 0]}>
        <mesh castShadow><boxGeometry args={[9.55, 0.36, 0.55]} /><meshStandardMaterial color="#8b6b4e" flatShading /></mesh>
        <mesh position={[0, 0, 0.31]}><boxGeometry args={[9.1, 0.06, 0.06]} /><meshStandardMaterial color="#d2a469" metalness={0.48} roughness={0.5} /></mesh>
        {[-3.2, 3.2].map(x => <mesh key={x} position={[x, 0.25, 0]}><cylinderGeometry args={[0.31, 0.31, 0.19, 8]} /><meshStandardMaterial color="#ba8a59" metalness={0.52} roughness={0.55} /></mesh>)}
      </group>
      <mesh position={[0, 4.54, 0.03]}><cylinderGeometry args={[0.48, 0.48, 0.65, 8]} /><meshStandardMaterial color="#2d2928" metalness={0.25} /></mesh>
      <group ref={left} position={[-3.25, 0.9, 0]}>
        <mesh castShadow position={[0, 0.78, 0]}><boxGeometry args={[1.22, 1.55, 1.2]} /><meshStandardMaterial color="#594a3d" flatShading /></mesh>
        <mesh position={[0, 1.75, 0]}><cylinderGeometry args={[0.08, 0.08, 3.2, 5]} /><meshStandardMaterial color="#b08d63" metalness={0.55} /></mesh>
        <mesh position={[0, 0.8, 0.62]}><boxGeometry args={[0.56, 0.44, 0.04]} /><meshStandardMaterial color={balance.stage >= 1 ? '#efc083' : '#806550'} emissive={balance.stage >= 1 ? '#d28e50' : '#24170e'} emissiveIntensity={0.5} /></mesh>
      </group>
      <group ref={right} position={[3.25, 1.7, 0]}>
        <mesh castShadow position={[0, 0.78, 0]}><boxGeometry args={[1.22, 1.55, 1.2]} /><meshStandardMaterial color="#594a3d" flatShading /></mesh>
        <mesh position={[0, 1.75, 0]}><cylinderGeometry args={[0.08, 0.08, 3.2, 5]} /><meshStandardMaterial color="#b08d63" metalness={0.55} /></mesh>
        <mesh position={[0, 0.8, 0.62]}><boxGeometry args={[0.56, 0.44, 0.04]} /><meshStandardMaterial color={balance.stage >= 2 ? '#efc083' : '#806550'} emissive={balance.stage >= 2 ? '#d28e50' : '#24170e'} emissiveIntensity={0.5} /></mesh>
      </group>
    </group>
    <group ref={bridge} position={[0, -2.8, -2.2]}>
      {Array.from({ length: 4 }, (_, index) => <group key={index} position={[0, 0, 1.56 - index * 1.18]}>
        <mesh castShadow receiveShadow><boxGeometry args={[2.42, 0.35, 1.08]} /><meshStandardMaterial color={final ? '#a68867' : '#604e42'} flatShading /></mesh>
        <mesh position={[0, 0.19, 0]}><boxGeometry args={[2.08, 0.04, 0.63]} /><meshStandardMaterial color={chargeStep >= index + 1 ? '#e1ad69' : '#544039'} emissive={chargeStep >= index + 1 ? '#c88743' : '#000000'} emissiveIntensity={chargeStep >= index + 1 ? 0.7 : 0} /></mesh>
      </group>)}
    </group>
    <group ref={gate} position={[0, 0, -4.25]}>
      {[-1.48, 1.48].map(x => <mesh key={x} castShadow position={[x, 1.55, 0]}><boxGeometry args={[0.45, 3.1, 0.6]} /><meshStandardMaterial color="#303032" /></mesh>)}
      <mesh castShadow position={[0, 2.55, 0]}><boxGeometry args={[3.25, 0.45, 0.62]} /><meshStandardMaterial color="#a37650" metalness={0.18} /></mesh>
      <mesh position={[0, 1.2, 0]}><boxGeometry args={[2.4, 2.3, 0.19]} /><meshStandardMaterial color="#594636" metalness={0.2} /></mesh>
    </group>
    {chargeStep >= 3 && <pointLight color="#efb473" intensity={1.4} distance={6} position={[0, 3, -4.6]} />}
  </group>;
}
