import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3, type Group } from 'three';
import type { JourneySigilConfig } from './JourneySigilConfig';

function Stroke({ from, to, color, width = 0.035 }: { from: readonly [number, number]; to: readonly [number, number]; color: string; width?: number }) {
  const start = new Vector3(from[0], from[1], 0), end = new Vector3(to[0], to[1], 0);
  const direction = end.clone().sub(start), midpoint = start.clone().add(end).multiplyScalar(0.5);
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={midpoint} quaternion={quaternion}><cylinderGeometry args={[width, width, direction.length(), 5]} /><meshBasicMaterial color={color} /></mesh>;
}
function geometryFor(config: JourneySigilConfig): [number, number][] {
  const skew = (config.lightFacet - 1.5) * 0.08;
  if (config.shape === 'spire') return [[0, 1.08], [0.7, -0.2], [0, -0.95], [-0.7, -0.2]];
  if (config.shape === 'split') return [[-0.9, 0.65], [-0.18, -0.65], [0.18, 0.65], [0.9, -0.65]];
  if (config.shape === 'arc') return [[-0.9, -0.5], [-0.56, 0.58], [0, 0.96], [0.56, 0.58], [0.9, -0.5]];
  return [[0, 1.05], [0.8 + skew, 0], [0, -1.05], [-0.8 + skew, 0]];
}
export function JourneySigil({ config, revealed, reducedMotion }: { config: JourneySigilConfig; revealed: number; reducedMotion: boolean }) {
  const root = useRef<Group>(null);
  const nodes = config.nodeAngles.map(angle => [Math.sin(angle) * 1.75, Math.cos(angle) * 1.75] as const);
  const figure = geometryFor(config);
  useFrame(({ clock }) => {
    if (!root.current) return;
    root.current.position.y = 5.1 + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.3) * 0.08);
    root.current.rotation.y = reducedMotion ? 0.2 : 0.2 + Math.sin(clock.elapsedTime * 0.38) * 0.12;
  });
  if (revealed <= 0) return null;
  return <group ref={root} rotation={[0, 0, config.rotation]} scale={Math.min(1, revealed * 1.35)}>
    <mesh position={[0, 0, -0.12]}><circleGeometry args={[2.48, 8]} /><meshBasicMaterial color="#263b46" transparent opacity={0.24} side={2} depthWrite={false} /></mesh>
    {nodes.map((node, index) => <group key={index}>
      {index <= revealed * 5 && <><Stroke from={[0, 0]} to={node} color={['#f8e4aa', '#a6e7cf', '#f4b181', '#c0b7ff'][index]} width={0.026} /><mesh position={[node[0], node[1], 0]}><octahedronGeometry args={[0.13, 0]} /><meshBasicMaterial color={['#f8e4aa', '#a6e7cf', '#f4b181', '#c0b7ff'][index]} /></mesh></>}
      {index > 0 && index <= revealed * 5 && <Stroke from={nodes[index - 1]} to={node} color={config.accent} width={0.022} />}
    </group>)}
    {revealed > 0.6 && <Stroke from={nodes[3]} to={nodes[0]} color={config.accent} width={0.022} />}
    {figure.slice(1).map((point, index) => <Stroke key={index} from={figure[index] as [number, number]} to={point as [number, number]} color={config.accent} width={0.055} />)}
    {config.shape === 'diamond' && <Stroke from={figure[figure.length - 1] as [number, number]} to={figure[0] as [number, number]} color={config.accent} width={0.055} />}
    {Array.from({ length: config.balanceBars }, (_, i) => <Stroke key={`bar-${i}`} from={[-0.28, -0.38 - i * 0.13]} to={[0.28, -0.38 - i * 0.13]} color="#f1c79c" width={0.025} />)}
    <Stroke from={[0, 0.2]} to={[(-1.5 + config.lightFacet) * 0.13, 0.72]} color="#ffe6ad" width={0.027} />
    {Array.from({ length: config.orbitMarks }, (_, i) => { const a = i * Math.PI * 2 / config.orbitMarks + config.rotation; return <mesh key={`orbit-${i}`} position={[Math.sin(a) * 2.42, Math.cos(a) * 2.42, 0]}><boxGeometry args={[0.045, 0.12, 0.03]} /><meshBasicMaterial color={config.accent} /></mesh>; })}
    {Array.from({ length: config.celestialPoints }, (_, i) => { const a = i * Math.PI * 2 / config.celestialPoints + config.rotation; return <mesh key={`star-${i}`} position={[Math.sin(a) * 2.18, Math.cos(a) * 2.18, 0]}><octahedronGeometry args={[0.045, 0]} /><meshBasicMaterial color="#d9d3ff" /></mesh>; })}
    <mesh><octahedronGeometry args={[0.18 + config.echoOffset * 0.008, 0]} /><meshBasicMaterial color="#fffbee" /></mesh>
  </group>;
}

export function JourneySigilEmblem({ config }: { config: JourneySigilConfig }) {
  const nodes = config.nodeAngles.map(angle => [50 + Math.sin(angle) * 29, 50 - Math.cos(angle) * 29]);
  const figure = geometryFor(config).map(([x, y]) => `${50 + x * 16},${50 - y * 16}`).join(' ');
  return <svg className="journey-sigil-emblem" viewBox="0 0 100 100" role="img" aria-label="Your Journey Sigil">
    <circle cx="50" cy="50" r="35" fill="none" stroke={config.accent} strokeWidth="0.75" opacity="0.75" />
    {nodes.map(([x, y], i) => <g key={i}><line x1="50" y1="50" x2={x} y2={y} stroke={['#f8e4aa', '#a6e7cf', '#f4b181', '#c0b7ff'][i]} strokeWidth="1.1" /><circle cx={x} cy={y} r="2.7" fill={['#f8e4aa', '#a6e7cf', '#f4b181', '#c0b7ff'][i]} /></g>)}
    <polygon points={figure} fill="none" stroke={config.accent} strokeWidth="2.3" strokeLinejoin="round" transform={`rotate(${config.rotation * 180 / Math.PI} 50 50)`} />
    {Array.from({ length: config.balanceBars }, (_, i) => <line key={i} x1="45" x2="55" y1={57 + i * 2.5} y2={57 + i * 2.5} stroke="#f1c79c" strokeWidth="1" />)}
    <line x1="50" y1="47" x2={50 + (-1.5 + config.lightFacet) * 2.6} y2="36" stroke="#ffe6ad" strokeWidth="1" />
    {Array.from({ length: config.orbitMarks }, (_, i) => { const a = i * Math.PI * 2 / config.orbitMarks + config.rotation; return <circle key={`orbit-${i}`} cx={50 + Math.sin(a) * 40} cy={50 - Math.cos(a) * 40} r="0.75" fill={config.accent} />; })}
    {Array.from({ length: config.celestialPoints }, (_, i) => { const a = i * Math.PI * 2 / config.celestialPoints + config.rotation; return <circle key={`star-${i}`} cx={50 + Math.sin(a) * 36} cy={50 - Math.cos(a) * 36} r="0.65" fill="#d9d3ff" />; })}
    <circle cx="50" cy="50" r="2" fill="#fffbee" />
  </svg>;
}
