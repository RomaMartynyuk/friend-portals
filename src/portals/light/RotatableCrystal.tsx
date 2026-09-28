import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';
import { crystalPositions, type CrystalId } from './LightPuzzleState';
export function RotatableCrystal({ id, orientation, resetVersion, highlighted, locked, reducedMotion }: {
  id: CrystalId; orientation: number; resetVersion: number; highlighted: boolean; locked: boolean; reducedMotion: boolean;
}) {
  const position = crystalPositions[id];
  const rotor = useRef<Group>(null);
  const target = useRef(0);
  const previous = useRef(orientation);
  const previousReset = useRef(resetVersion);
  useEffect(() => {
    if (resetVersion !== previousReset.current) {
      target.current = 0; previousReset.current = resetVersion;
    } else if (orientation !== previous.current) target.current += Math.PI / 2;
    previous.current = orientation;
  }, [orientation, resetVersion]);
  useFrame((_, delta) => {
    if (!rotor.current) return;
    rotor.current.rotation.y = reducedMotion ? target.current : MathUtils.damp(rotor.current.rotation.y, target.current, 13, delta);
  });
  return <group position={[position[0], 0, position[2]]}>
    <mesh castShadow receiveShadow position={[0, 0.48, 0]}><cylinderGeometry args={[0.68, 0.8, 0.95, 8]} /><meshStandardMaterial color="#d1c5a7" flatShading roughness={1} /></mesh>
    <mesh position={[0, 0.96, 0]}><cylinderGeometry args={[0.57, 0.65, 0.12, 8]} /><meshStandardMaterial color={highlighted && !locked ? '#fff0bb' : '#222a32'} emissive={highlighted && !locked ? '#8a6a28' : '#000000'} emissiveIntensity={0.4} /></mesh>
    <group ref={rotor} position={[0, 1.33, 0]}>
      <mesh castShadow rotation={[0, Math.PI / 4, 0]}><octahedronGeometry args={[0.55, 0]} /><meshStandardMaterial color={highlighted ? '#fff2bd' : '#e6dba9'} emissive={highlighted ? '#8b6a2b' : '#735b2a'} emissiveIntensity={highlighted ? 0.6 : 0.2} flatShading /></mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.5, 0.055, 4, 6]} /><meshStandardMaterial color="#263037" metalness={0.1} roughness={0.8} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.5, 0.055, 4, 6]} /><meshStandardMaterial color="#263037" /></mesh>
      <mesh position={[0, 0, 0.55]}><octahedronGeometry args={[0.13, 0]} /><meshBasicMaterial color="#fff6c9" /></mesh>
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}><ringGeometry args={[0.85, 0.94, 8]} /><meshBasicMaterial color={highlighted && !locked ? '#f4db8a' : '#5b635c'} transparent opacity={highlighted && !locked ? 0.9 : 0.4} side={2} /></mesh>
  </group>;
}
