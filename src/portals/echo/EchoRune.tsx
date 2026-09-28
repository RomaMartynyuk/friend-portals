import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshBasicMaterial, type Group, type Mesh } from 'three';
import { echoRunes, type RuneId } from './echoConfig';
function RuneSymbol({ id, color }: { id: RuneId; color: string }) {
  const bar = (key: string, x: number, y: number, width: number, height: number, angle = 0) => <mesh key={key} position={[x, y, 0]} rotation={[0, 0, angle]}><boxGeometry args={[width, height, 0.035]} /><meshBasicMaterial color={color} /></mesh>;
  return <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.31, 0]}>
    {id === 0 && <><mesh><torusGeometry args={[0.2, 0.045, 4, 8]} /><meshBasicMaterial color={color} /></mesh>{Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return bar(String(i), Math.cos(a) * 0.39, Math.sin(a) * 0.39, 0.2, 0.045, a); })}</>}
    {id === 1 && <>{bar('a', -0.18, 0, 0.09, 0.73)}{bar('b', 0.18, 0, 0.09, 0.73)}{bar('c', 0, 0, 0.38, 0.055)}</>}
    {id === 2 && <mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.42, 0.055, 4, 3]} /><meshBasicMaterial color={color} /></mesh>}
    {id === 3 && <><mesh rotation={[0, 0, Math.PI / 4]}><torusGeometry args={[0.39, 0.055, 4, 4]} /><meshBasicMaterial color={color} /></mesh><mesh><circleGeometry args={[0.08, 6]} /><meshBasicMaterial color={color} /></mesh></>}
    {id === 4 && <>{bar('a', 0, 0, 0.09, 0.78)}{bar('b', 0, 0, 0.78, 0.09)}{Array.from({ length: 4 }, (_, i) => { const a = i * Math.PI / 2; return <mesh key={i} position={[Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0]}><circleGeometry args={[0.06, 5]} /><meshBasicMaterial color={color} /></mesh>; })}</>}
  </group>;
}
export function EchoRune({ id, active, wrong, awake, reducedMotion }: { id: RuneId; active: boolean; wrong: boolean; awake: boolean; reducedMotion: boolean }) {
  const config = echoRunes[id];
  const bloom = useRef<Mesh>(null);
  const leaves = useRef<Group>(null);
  const burstTime = useRef(10);
  useEffect(() => { if (active || wrong) burstTime.current = 0; }, [active, wrong]);
  useFrame(({ clock }, delta) => {
    if (bloom.current) {
      burstTime.current += delta;
      const t = reducedMotion ? 1 : Math.min(1, burstTime.current / 0.62);
      bloom.current.scale.setScalar(0.8 + t * 1.3);
      (bloom.current.material as MeshBasicMaterial).opacity = (active || wrong) ? (1 - t) * 0.52 : 0;
    }
    if (leaves.current) leaves.current.rotation.y = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.4 + id) * (active ? 0.17 : 0.035);
  });
  const color = wrong ? '#b68b8b' : active ? '#effff4' : awake ? config.color : '#6f938f';
  return <group position={[config.x, 0, config.z]}>
    <mesh castShadow receiveShadow position={[0, 0.1, 0]}><cylinderGeometry args={[1.13, 1.23, 0.32, 8]} /><meshStandardMaterial color="#273b40" flatShading roughness={1} /></mesh>
    <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.89, 0.96, 0.07, 8]} /><meshStandardMaterial color={wrong ? '#584447' : active ? '#a4d9c8' : '#3d6263'} emissive={active ? config.color : '#102c30'} emissiveIntensity={active ? 0.7 : awake ? 0.22 : 0.05} flatShading /></mesh>
    <RuneSymbol id={id} color={color} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.32, 0]}><ringGeometry args={[0.72, 0.79, 8]} /><meshBasicMaterial color={active ? '#eaffed' : config.color} transparent opacity={active ? 0.95 : awake ? 0.38 : 0.18} side={2} /></mesh>
    <mesh ref={bloom} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.35, 0]}><ringGeometry args={[0.85, 0.95, 8]} /><meshBasicMaterial color={wrong ? '#c88080' : '#d8fff0'} transparent opacity={0} depthWrite={false} /></mesh>
    <group ref={leaves}>{Array.from({ length: 5 }, (_, i) => { const a = i * Math.PI * 2 / 5; return <group key={i} position={[Math.cos(a) * 1.34, 0, Math.sin(a) * 1.34]}>
      <mesh position={[0, 0.22, 0]}><coneGeometry args={[0.14, 0.43, 4]} /><meshStandardMaterial color="#4f9981" flatShading /></mesh>
      <mesh position={[0, 0.48, 0]}><octahedronGeometry args={[0.075, 0]} /><meshStandardMaterial color={config.color} emissive={active || awake ? config.color : '#1d4946'} emissiveIntensity={active ? 0.7 : awake ? 0.25 : 0.05} /></mesh>
    </group>; })}</group>
    {(active || wrong) && Array.from({ length: 5 }, (_, i) => { const a = i * Math.PI * 2 / 5; return <mesh key={i} position={[Math.cos(a) * 0.6, 0.65 + (i % 2) * 0.17, Math.sin(a) * 0.6]}><octahedronGeometry args={[0.075, 0]} /><meshBasicMaterial color={wrong ? '#cb9494' : '#e7fff5'} /></mesh>; })}
  </group>;
}
