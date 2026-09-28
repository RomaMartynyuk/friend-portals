import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
export function TestRoom({ reducedMotion }: { reducedMotion: boolean }) {
  const gem = useRef<Mesh>(null);
  useFrame(({ clock }) => { if (gem.current && !reducedMotion) { gem.current.rotation.y = clock.elapsedTime * 0.55; gem.current.position.y = 2.7 + Math.sin(clock.elapsedTime * 1.8) * 0.09; } });
  return <>
    <color attach="background" args={['#343944']} />
    <fog attach="fog" args={['#343944', 14, 31]} />
    <ambientLight intensity={1.1} color="#d0ccbb" />
    <directionalLight position={[5, 10, 6]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} />
    <mesh receiveShadow position={[0, -0.38, 0]}><cylinderGeometry args={[6.5, 6.5, 0.76, 8]} /><meshStandardMaterial color="#8b8985" flatShading /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><ringGeometry args={[3.9, 4.35, 8]} /><meshStandardMaterial color="#c6bd9b" side={2} /></mesh>
    {Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return <group key={i} position={[Math.cos(a) * 5.45, 0, Math.sin(a) * 5.45]}>
      <mesh castShadow position={[0, 1.1, 0]}><cylinderGeometry args={[0.28, 0.38, 2.2, 6]} /><meshStandardMaterial color="#c7bc9f" flatShading /></mesh>
      <mesh position={[0, 2.3, 0]}><octahedronGeometry args={[0.37, 0]} /><meshStandardMaterial color="#f1d992" emissive="#f4c660" emissiveIntensity={0.75} /></mesh>
    </group>; })}
    <mesh castShadow position={[0, 0.55, -1.1]}><cylinderGeometry args={[1.2, 1.5, 1.1, 8]} /><meshStandardMaterial color="#b8ad95" flatShading /></mesh>
    <mesh ref={gem} position={[0, 2.7, -1.1]}><octahedronGeometry args={[0.85, 0]} /><meshStandardMaterial color="#fff0ba" emissive="#e6b95d" emissiveIntensity={0.8} /></mesh>
    <group position={[0, 0, 4.1]}>
      <mesh castShadow position={[-0.95, 1.25, 0]}><boxGeometry args={[0.4, 2.5, 0.48]} /><meshStandardMaterial color="#d8c7a4" /></mesh>
      <mesh castShadow position={[0.95, 1.25, 0]}><boxGeometry args={[0.4, 2.5, 0.48]} /><meshStandardMaterial color="#d8c7a4" /></mesh>
      <mesh castShadow position={[0, 2.57, 0]}><boxGeometry args={[2.25, 0.42, 0.48]} /><meshStandardMaterial color="#d8c7a4" /></mesh>
      <mesh position={[0, 1.26, 0]}><planeGeometry args={[1.7, 2.1]} /><meshBasicMaterial color="#b9d5c9" transparent opacity={0.65} side={2} /></mesh>
      <pointLight color="#b9d5c9" intensity={2.2} distance={5} position={[0, 1.3, 0]} />
    </group>
  </>;
}
