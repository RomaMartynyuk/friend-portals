import type { RingId } from './celestialConfig';

const positions = [[-5.3, 0, 1.5], [0, 0, 4.65], [5.3, 0, 1.5]] as const;
export const celestialControlPositions = positions;
export function CelestialControl({ ring, active, locked, missed, perfect }: { ring: RingId; active: boolean; locked: boolean; missed: boolean; perfect: boolean }) {
  const color = missed ? '#b16f87' : perfect ? '#fff2cc' : locked ? '#c3b9ff' : active ? '#aeb4ee' : '#626784';
  return <group position={[...positions[ring]]}>
    <mesh castShadow receiveShadow position={[0, 0.47, 0]}><cylinderGeometry args={[0.64, 0.8, 0.94, 8]} /><meshStandardMaterial color="#34344b" metalness={0.25} roughness={0.72} flatShading /></mesh>
    <mesh position={[0, 0.99, 0]}><cylinderGeometry args={[0.57, 0.57, 0.07, 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={active || locked ? 0.6 : 0.13} metalness={0.4} /></mesh>
    <mesh position={[0, 1.11, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.38, 12]} /><meshBasicMaterial color="#25263b" /></mesh>
    {Array.from({ length: ring + 1 }, (_, index) => <mesh key={index} position={[0, 1.13 + index * 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.15 + index * 0.095, 0.175 + index * 0.095, 20]} /><meshBasicMaterial color={color} side={2} /></mesh>)}
    {Array.from({ length: ring + 1 }, (_, mark) => <mesh key={mark} position={[(mark - ring / 2) * 0.2, 0.38, 0.79]}><boxGeometry args={[0.09, 0.25, 0.035]} /><meshBasicMaterial color={color} /></mesh>)}
    <mesh position={[0, 1.45, 0]}><octahedronGeometry args={[active ? 0.14 : 0.09, 0]} /><meshBasicMaterial color={color} transparent opacity={active || locked ? 0.85 : 0.25} /></mesh>
    {perfect && <><mesh position={[0, 1.08, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.72, 0.78, 24]} /><meshBasicMaterial color="#fff4d8" transparent opacity={0.82} side={2} /></mesh><pointLight color="#ffefd1" intensity={1.7} distance={3.8} position={[0, 1.35, 0]} /></>}
    <group position={[0, 0.2, 0]}><mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.83, 0.88, 20]} /><meshBasicMaterial color={color} transparent opacity={active ? 0.54 : 0.16} side={2} /></mesh></group>
    <group position={[0, -0.05, 1.1]}><mesh><boxGeometry args={[1.0, 0.16, 0.2]} /><meshStandardMaterial color="#696a89" /></mesh><mesh position={[0, 0.1, 0.11]}><boxGeometry args={[0.62, 0.04, 0.02]} /><meshBasicMaterial color={color} /></mesh></group>
    <group position={[0, 0.18, -0.82]}><mesh rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.16, 0.027, 4, 8]} /><meshBasicMaterial color={color} /></mesh></group>
  </group>;
}
