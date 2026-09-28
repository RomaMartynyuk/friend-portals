import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
export function EchoShard({ claiming, playerPosition, reducedMotion }: { claiming: boolean; playerPosition: React.RefObject<[number, number]>; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const started = useRef<number | null>(null);
  const origin = new Vector3(0, 2.85, 0);
  useFrame(({ clock }) => {
    if (!group.current) return;
    if (claiming) {
      started.current ??= clock.elapsedTime;
      const t = Math.min(1, (clock.elapsedTime - started.current) / 0.7);
      group.current.position.copy(origin).lerp(new Vector3(playerPosition.current[0], 1.3, playerPosition.current[1]), t * t * (3 - 2 * t));
      group.current.position.y += Math.sin(Math.PI * t) * 1.25;
      group.current.scale.setScalar(Math.max(0.03, 1 - t * 0.94));
      group.current.rotation.y += 0.13;
    } else {
      group.current.position.set(0, reducedMotion ? 2.85 : 2.85 + Math.sin(clock.elapsedTime * 1.8) * 0.14, 0);
      if (!reducedMotion) group.current.rotation.y += 0.018;
    }
  });
  return <group ref={group} position={[0, 2.85, 0]}>
    <mesh castShadow rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[0.47, 0]} /><meshStandardMaterial color="#dffff2" emissive="#80d8ba" emissiveIntensity={0.9} flatShading /></mesh>
    <mesh rotation={[0, 0, Math.PI / 4]}><torusGeometry args={[0.65, 0.045, 4, 4]} /><meshBasicMaterial color="#bbffe5" /></mesh>
    {Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return <mesh key={i} position={[Math.cos(a) * 0.78, Math.sin(a * 2) * 0.42, Math.sin(a) * 0.78]}><octahedronGeometry args={[0.065, 0]} /><meshBasicMaterial color="#e6fff6" /></mesh>; })}
  </group>;
}
