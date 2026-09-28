import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';

export function BalanceShard({ claiming, playerPosition, reducedMotion }: { claiming: boolean; playerPosition: React.RefObject<[number, number]>; reducedMotion: boolean }) {
  const group = useRef<Group>(null), started = useRef<number | null>(null);
  const origin = new Vector3(0, 2.35, -6.1);
  useFrame(({ clock }) => {
    if (!group.current) return;
    if (claiming) {
      started.current ??= clock.elapsedTime;
      const t = Math.min(1, (clock.elapsedTime - started.current) / 0.7);
      group.current.position.copy(origin).lerp(new Vector3(playerPosition.current[0], 1.35, playerPosition.current[1]), t * t * (3 - 2 * t));
      group.current.position.y += Math.sin(Math.PI * t) * 1.15;
      group.current.scale.setScalar(Math.max(0.03, 1 - t * 0.95));
      group.current.rotation.y += 0.13;
    } else {
      group.current.position.set(0, reducedMotion ? 2.35 : 2.35 + Math.sin(clock.elapsedTime * 1.9) * 0.12, -6.1);
      if (!reducedMotion) group.current.rotation.y += 0.022;
    }
  });
  return <group ref={group} position={[0, 2.35, -6.1]}>
    <mesh castShadow rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[0.5, 0]} /><meshStandardMaterial color="#fff1ca" emissive="#df9659" emissiveIntensity={0.95} flatShading /></mesh>
    <mesh rotation={[0, 0, Math.PI / 4]}><torusGeometry args={[0.68, 0.05, 4, 4]} /><meshBasicMaterial color="#ffce86" /></mesh>
    {Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return <mesh key={i} position={[Math.cos(a) * 0.82, Math.sin(a * 2) * 0.33, Math.sin(a) * 0.82]}><octahedronGeometry args={[0.07, 0]} /><meshBasicMaterial color="#ffe0aa" /></mesh>; })}
  </group>;
}
