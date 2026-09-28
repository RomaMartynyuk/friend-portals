import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return <group position={[x, 0, z]} scale={scale}>
    <mesh castShadow position={[0, 0.63, 0]}><cylinderGeometry args={[0.17, 0.24, 1.25, 5]} /><meshStandardMaterial color="#715847" flatShading /></mesh>
    <mesh castShadow position={[0, 1.55, 0]}><coneGeometry args={[0.88, 1.65, 6]} /><meshStandardMaterial color="#3e766a" flatShading /></mesh>
    <mesh castShadow position={[0, 2.13, 0]}><coneGeometry args={[0.66, 1.15, 6]} /><meshStandardMaterial color="#52917b" flatShading /></mesh>
  </group>;
}
export function Environment({ identitySeed, reducedMotion }: { identitySeed: number; reducedMotion: boolean }) {
  const cloud = useRef<Group>(null);
  const props = useMemo(() => {
    let seed = identitySeed + 421;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    return Array.from({ length: 43 }, (_, i) => { const a = rand() * Math.PI * 2, r = 3.1 + rand() * 6.2; return { i, x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.55 + rand() * 0.55, type: rand() }; }).filter(p => Math.abs(p.x) > 1.35 && Math.abs(p.z) > 1.35);
  }, [identitySeed]);
  useFrame(({ clock }) => { if (cloud.current && !reducedMotion) cloud.current.rotation.y = clock.elapsedTime * 0.012; });
  return <>
    <color attach="background" args={['#b8d4d0']} />
    <fog attach="fog" args={['#b8d4d0', 22, 56]} />
    <ambientLight intensity={1.25} color="#dbe9d7" />
    <hemisphereLight args={['#e9f1e5', '#526f6b', 1.45]} />
    <directionalLight position={[8, 15, 9]} intensity={2.6} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-bias={-0.0005} />
    <group ref={cloud} position={[0, -7.3, 0]}>
      {Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return <mesh key={i} position={[Math.cos(a) * 12, Math.sin(i * 2) * 0.65, Math.sin(a) * 12]} scale={[3.4, 0.8, 2.5]}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#f1f2e8" transparent opacity={0.48} depthWrite={false} /></mesh>; })}
    </group>
    <mesh castShadow receiveShadow position={[0, -1.35, 0]}><cylinderGeometry args={[10.3, 8.6, 2.7, 16]} /><meshStandardMaterial color="#686b62" flatShading roughness={1} /></mesh>
    <mesh castShadow position={[0, -3.0, 0]}><coneGeometry args={[7.5, 4.3, 12]} /><meshStandardMaterial color="#666a61" flatShading roughness={1} /></mesh>
    <mesh receiveShadow position={[0, -0.04, 0]}><cylinderGeometry args={[10.28, 10.28, 0.12, 16]} /><meshStandardMaterial color="#75a481" flatShading roughness={1} /></mesh>
    {Array.from({ length: 4 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, i * Math.PI / 2]} position={[Math.sin(i * Math.PI / 2) * 3.55, 0.028, Math.cos(i * Math.PI / 2) * 3.55]}><planeGeometry args={[1.3, 5.8]} /><meshStandardMaterial color="#b9ad8b" roughness={1} side={2} /></mesh>)}
    {props.map(p => p.type > 0.55 ? <Tree key={p.i} x={p.x} z={p.z} scale={p.s} /> : <group key={p.i} position={[p.x, 0.08, p.z]}>
      <mesh castShadow rotation={[0, p.i, 0]} scale={[p.s, p.s * 0.7, p.s * 0.8]}><dodecahedronGeometry args={[0.48, 0]} /><meshStandardMaterial color={p.type > 0.24 ? '#a39f8c' : '#b5af93'} flatShading /></mesh>
      {p.type < 0.16 && <mesh position={[0.3, 0.32, 0.2]}><octahedronGeometry args={[0.16, 0]} /><meshStandardMaterial color="#ecc5b5" emissive="#e39f9b" emissiveIntensity={0.25} /></mesh>}
    </group>)}
    {Array.from({ length: 35 }, (_, i) => { const a = i * 2.4, r = 2.4 + (i * 1.37) % 7; const x = Math.cos(a) * r, z = Math.sin(a) * r; return <group key={i} position={[x, 0.08, z]}>
      <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.035, 0.035, 0.36, 4]} /><meshStandardMaterial color="#507e65" /></mesh>
      <mesh position={[0, 0.37, 0]}><octahedronGeometry args={[0.13, 0]} /><meshStandardMaterial color={i % 3 === 0 ? '#e8d89a' : i % 3 === 1 ? '#d9b1bb' : '#dfebe0'} /></mesh>
    </group>; })}
  </>;
}
