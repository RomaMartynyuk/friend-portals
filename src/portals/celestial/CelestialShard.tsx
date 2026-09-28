import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';

export function CelestialShard({ claiming, playerPosition, reducedMotion }: { claiming: boolean; playerPosition: React.RefObject<[number, number]>; reducedMotion: boolean }) {
  const group = useRef<Group>(null), started = useRef<number | null>(null);
  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    if (claiming && started.current === null) started.current = clock.elapsedTime;
    const progress = claiming ? Math.min(1, (clock.elapsedTime - (started.current ?? clock.elapsedTime)) / (reducedMotion ? 0.15 : 0.65)) : 0;
    const [x, z] = playerPosition.current;
    group.current.position.x = MathUtils.lerp(0, x, progress * progress);
    group.current.position.y = 3.15 + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 2.5) * 0.12) + Math.sin(progress * Math.PI) * 0.8 - progress * 1.8;
    group.current.position.z = MathUtils.lerp(-1.3, z, progress * progress);
    group.current.rotation.y += delta * (claiming ? 8 : 0.8);
    group.current.scale.setScalar(1 - progress * 0.8);
  });
  return <group ref={group} position={[0, 3.15, -1.3]}>
    <mesh castShadow><octahedronGeometry args={[0.52, 0]} /><meshStandardMaterial color="#eeeaff" emissive="#aaa6f6" emissiveIntensity={1.1} metalness={0.35} roughness={0.28} flatShading /></mesh>
    <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}><torusGeometry args={[0.71, 0.045, 4, 8]} /><meshBasicMaterial color="#c3bdff" /></mesh>
    {Array.from({ length: 8 }, (_, index) => { const a = index * Math.PI / 4; return <mesh key={index} position={[Math.cos(a) * 0.85, Math.sin(a * 2) * 0.28, Math.sin(a) * 0.85]}><octahedronGeometry args={[0.055, 0]} /><meshBasicMaterial color="#f3efff" /></mesh>; })}
    <pointLight color="#aaa8ff" intensity={1.5} distance={5} />
  </group>;
}
