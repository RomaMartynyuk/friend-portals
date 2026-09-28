import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
export function PortalShard({ claiming, playerPosition, reducedMotion }: { claiming: boolean; playerPosition: React.RefObject<[number, number]>; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const claimTime = useRef<number | null>(null);
  const start = new Vector3(4, 2.9, 0);
  useFrame(({ clock }) => {
    if (!group.current) return;
    if (claiming) {
      claimTime.current ??= clock.elapsedTime;
      const t = Math.min(1, (clock.elapsedTime - claimTime.current) / 0.68);
      const target = new Vector3(playerPosition.current[0], 1.25, playerPosition.current[1]);
      group.current.position.copy(start).lerp(target, t * t * (3 - 2 * t));
      group.current.position.y += Math.sin(Math.PI * t) * 1.5;
      group.current.scale.setScalar(Math.max(0.02, 1 - t * 0.92));
      group.current.rotation.y += 0.1;
    } else {
      group.current.position.set(4, reducedMotion ? 2.9 : 2.9 + Math.sin(clock.elapsedTime * 2) * 0.16, 0);
      if (!reducedMotion) group.current.rotation.y += 0.015;
    }
  });
  return <group ref={group} position={[4, 2.9, 0]}>
    <mesh castShadow><octahedronGeometry args={[0.48, 0]} /><meshStandardMaterial color="#fff6d0" emissive="#e5b55f" emissiveIntensity={0.8} flatShading /></mesh>
    <mesh rotation={[0, 0, Math.PI / 4]}><torusGeometry args={[0.64, 0.045, 4, 4]} /><meshBasicMaterial color="#ffe6a3" /></mesh>
    <mesh position={[0, 0, 0.51]}><octahedronGeometry args={[0.13, 0]} /><meshBasicMaterial color="#ffffff" /></mesh>
    {Array.from({ length: 5 }, (_, i) => { const a = i * Math.PI * 2 / 5; return <mesh key={i} position={[Math.cos(a) * 0.85, Math.sin(a) * 0.6, Math.sin(a) * 0.85]}><octahedronGeometry args={[0.055, 0]} /><meshBasicMaterial color="#fff0b8" /></mesh>; })}
  </group>;
}
