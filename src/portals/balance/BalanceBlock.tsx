import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';
import { gridToWorld, type Cell, type Weight } from './balanceLayouts';

export function BalanceBlock({ id, weight, cell, resetVersion, highlighted, resisted, reducedMotion }: {
  id: number; weight: Weight; cell: Cell; resetVersion: number; highlighted: boolean; resisted: boolean; reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  const previousReset = useRef(resetVersion);
  const [x, z] = gridToWorld(cell);
  const size = 0.65 + weight * 0.12;
  useLayoutEffect(() => { if (group.current) group.current.position.set(x, 0, z); }, []);
  useEffect(() => {
    if (resetVersion !== previousReset.current && group.current) { group.current.position.set(x, 0, z); previousReset.current = resetVersion; }
  }, [x, z, resetVersion]);
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.position.x = reducedMotion ? x : MathUtils.damp(group.current.position.x, x, 11, delta);
    group.current.position.z = reducedMotion ? z : MathUtils.damp(group.current.position.z, z, 11, delta);
    group.current.rotation.z = reducedMotion ? 0 : MathUtils.damp(group.current.rotation.z, resisted ? 0.075 : 0, 14, delta);
  });
  return <group ref={group}>
    <mesh castShadow receiveShadow position={[0, size * 0.52, 0]}><boxGeometry args={[size, size, size]} /><meshStandardMaterial color={resisted ? '#a86c5d' : highlighted ? '#c8ad83' : '#a58b69'} flatShading roughness={1} /></mesh>
    <mesh position={[0, size * 0.52, size * 0.52 + 0.006]}><planeGeometry args={[size * 0.73, size * 0.7]} /><meshStandardMaterial color="#403b36" /></mesh>
    {Array.from({ length: weight }, (_, mark) => <mesh key={mark} position={[(mark - (weight - 1) / 2) * 0.2, size * 0.5, size * 0.52 + 0.018]}><boxGeometry args={[0.1, 0.39, 0.025]} /><meshBasicMaterial color={highlighted ? '#ffe3a1' : '#dfbe85'} /></mesh>)}
    <mesh position={[0, size + 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[size * 0.28, size * 0.34, 4]} /><meshStandardMaterial color={highlighted ? '#ffe2a4' : '#57473e'} emissive={highlighted ? '#b87943' : '#1b1512'} emissiveIntensity={highlighted ? 0.5 : 0.08} /></mesh>
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[size * 0.66, 8]} /><meshBasicMaterial color="#171b1f" transparent opacity={0.28} depthWrite={false} /></mesh>
    {weight === 3 && <mesh castShadow position={[0, size + 0.11, 0]}><boxGeometry args={[size * 0.46, 0.18, size * 0.46]} /><meshStandardMaterial color="#4c4740" metalness={0.26} roughness={0.75} /></mesh>}
    {id % 2 === 1 && <mesh position={[size * 0.51, size * 0.5, 0]}><boxGeometry args={[0.02, size * 0.7, 0.075]} /><meshStandardMaterial color="#6f5947" /></mesh>}
  </group>;
}
