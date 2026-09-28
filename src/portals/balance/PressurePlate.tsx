import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';
import type { PlateId } from './balanceLayouts';

export function PressurePlate({ id, target, weight, emphasized, reducedMotion }: {
  id: PlateId; target: number; weight: number; emphasized: boolean; reducedMotion: boolean;
}) {
  const top = useRef<Group>(null);
  const x = id === 'A' ? -3.25 : id === 'B' ? 0 : 3.25;
  const width = id === 'B' ? 3.58 : 2.42;
  const balanced = weight === target, over = weight > target;
  const color = over ? '#bf7667' : balanced ? '#ffe0a0' : '#956f56';
  useFrame((_, delta) => {
    if (!top.current) return;
    const height = balanced ? -0.12 : over ? -0.055 : weight ? -0.035 : 0.025;
    top.current.position.y = reducedMotion ? height : MathUtils.damp(top.current.position.y, height, 7, delta);
  });
  return <group position={[x, 0, 2.24]}>
    <mesh receiveShadow position={[0, 0.045, 0]}><boxGeometry args={[width + 0.16, 0.22, 2.8]} /><meshStandardMaterial color="#252628" flatShading /></mesh>
    <group ref={top}>
      <mesh receiveShadow position={[0, 0.17, 0]}><boxGeometry args={[width, 0.19, 2.6]} /><meshStandardMaterial color={balanced ? '#b5875c' : over ? '#74514b' : '#655847'} roughness={1} flatShading /></mesh>
      <mesh position={[0, 0.276, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[width - 0.22, 2.38]} /><meshBasicMaterial color={color} transparent opacity={balanced ? 0.14 : over ? 0.1 : 0.045} depthWrite={false} /></mesh>
      {Array.from({ length: target }, (_, index) => <mesh key={index} position={[(index - (target - 1) / 2) * 0.33, 0.285, -0.94]}><boxGeometry args={[0.17, 0.035, 0.47]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={balanced ? 0.9 : emphasized ? 0.3 : 0.13} /></mesh>)}
      <mesh position={[0, 0.285, 0.86]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.25, 0.045, 4, 6]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={balanced ? 0.7 : emphasized ? 0.23 : 0.08} /></mesh>
    </group>
    {balanced && emphasized && <pointLight position={[0, 1.2, 0]} color="#ffc486" intensity={0.8} distance={3.3} />}
  </group>;
}
