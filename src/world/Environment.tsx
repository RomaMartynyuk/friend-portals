import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { createWorldCosmetics } from './worldCosmetics';
import type { RunSeed } from '../game/seededRun';
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return <group position={[x, 0, z]} scale={scale}>
    <mesh castShadow position={[0, 0.63, 0]}><cylinderGeometry args={[0.17, 0.24, 1.25, 5]} /><meshStandardMaterial color="#715847" flatShading /></mesh>
    <mesh castShadow position={[0, 1.55, 0]}><coneGeometry args={[0.88, 1.65, 6]} /><meshStandardMaterial color="#3e766a" flatShading /></mesh>
    <mesh castShadow position={[0, 2.13, 0]}><coneGeometry args={[0.66, 1.15, 6]} /><meshStandardMaterial color="#52917b" flatShading /></mesh>
  </group>;
}
export function Environment({ runSeed, identitySeed, reducedMotion }: { runSeed: RunSeed; identitySeed: number; reducedMotion: boolean }) {
  const cloud = useRef<Group>(null);
  const cosmetics = useMemo(() => createWorldCosmetics(runSeed, identitySeed), [runSeed, identitySeed]);
  useFrame(({ clock }) => { if (cloud.current && !reducedMotion) cloud.current.rotation.y = clock.elapsedTime * 0.012; });
  return <>
    <color attach="background" args={[cosmetics.sky]} />
    <fog attach="fog" args={[cosmetics.sky, 22, 56]} />
    <ambientLight intensity={1.25} color="#dbe9d7" />
    <hemisphereLight args={['#e9f1e5', '#526f6b', 1.45]} />
    <directionalLight position={[8, 15, 9]} intensity={2.6} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-bias={-0.0005} />
    <group ref={cloud} position={[0, -7.3, 0]}>
      {cosmetics.clouds.map(item => <mesh key={item.id} position={[item.x, item.height, item.z]} scale={[3.4 * item.scale, 0.8, 2.5 * item.scale]}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#f1f2e8" transparent opacity={0.48} depthWrite={false} /></mesh>)}
    </group>
    <mesh castShadow receiveShadow position={[0, -1.35, 0]}><cylinderGeometry args={[10.3, 8.6, 2.7, 16]} /><meshStandardMaterial color="#686b62" flatShading roughness={1} /></mesh>
    <mesh castShadow position={[0, -3.0, 0]}><coneGeometry args={[7.5, 4.3, 12]} /><meshStandardMaterial color="#666a61" flatShading roughness={1} /></mesh>
    <mesh receiveShadow position={[0, -0.04, 0]}><cylinderGeometry args={[10.28, 10.28, 0.12, 16]} /><meshStandardMaterial color="#75a481" flatShading roughness={1} /></mesh>
    {Array.from({ length: 4 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, i * Math.PI / 2]} position={[Math.sin(i * Math.PI / 2) * 3.55, 0.028, Math.cos(i * Math.PI / 2) * 3.55]}><planeGeometry args={[1.3, 5.8]} /><meshStandardMaterial color="#b9ad8b" roughness={1} side={2} /></mesh>)}
    {cosmetics.props.map(p => p.kind === 'tree' ? <Tree key={p.id} x={p.x} z={p.z} scale={p.scale} /> : <group key={p.id} position={[p.x, 0.08, p.z]}>
      <mesh castShadow rotation={[0, p.id, 0]} scale={[p.scale, p.scale * 0.7, p.scale * 0.8]}><dodecahedronGeometry args={[0.48, 0]} /><meshStandardMaterial color={p.crystal ? '#a39f8c' : '#b5af93'} flatShading /></mesh>
      {p.crystal && <mesh position={[0.3, 0.32, 0.2]}><octahedronGeometry args={[0.16, 0]} /><meshStandardMaterial color="#ecc5b5" emissive="#e39f9b" emissiveIntensity={0.25} /></mesh>}
    </group>)}
    {cosmetics.flowers.map(flower => <group key={flower.id} position={[flower.x, 0.08, flower.z]}>
      <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.035, 0.035, 0.36, 4]} /><meshStandardMaterial color="#507e65" /></mesh>
      <mesh position={[0, 0.37, 0]}><octahedronGeometry args={[0.13, 0]} /><meshStandardMaterial color={flower.color} /></mesh>
    </group>)}
  </>;
}
