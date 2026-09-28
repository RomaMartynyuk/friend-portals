import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { CelestialGlyph } from './CelestialGlyph';
import { ringSymbols, TAU, type CelestialSymbol, type RingId } from './celestialConfig';
import type { CelestialPuzzleState } from './CelestialPuzzleState';

const radii = [3.55, 2.62, 1.68] as const;
export function CelestialRing({ index, target, state, angleNow, onSymbolPass }: {
  index: RingId; target: CelestialSymbol; state: CelestialPuzzleState; angleNow: () => number; onSymbolPass: (ring: RingId) => void;
}) {
  const moving = useRef<Group>(null), previousSector = useRef<number | null>(null);
  const radius = radii[index], symbols = ringSymbols[index];
  const locked = index < state.lockedCount || state.phase === 'shard-ready' || state.phase === 'claimed';
  useFrame(() => {
    const angle = angleNow();
    if (moving.current) moving.current.rotation.y = -angle;
    if (state.phase !== 'running' || locked || index !== state.lockedCount) { previousSector.current = null; return; }
    const sector = Math.floor(((angle % TAU + TAU) % TAU) / (TAU / symbols.length));
    if (previousSector.current !== null && previousSector.current !== sector) onSymbolPass(index);
    previousSector.current = sector;
  });
  return <group position={[0, 0.22 + index * 0.08, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[radius - 0.17, radius + 0.17, 64]} /><meshStandardMaterial color={locked ? '#8b88af' : '#4c4e6a'} emissive={locked ? '#7671be' : '#151526'} emissiveIntensity={locked ? 0.52 : 0.15} metalness={0.45} roughness={0.46} side={2} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}><ringGeometry args={[radius - 0.31, radius - 0.28, 64]} /><meshBasicMaterial color={locked ? '#b7b8fa' : '#777997'} transparent opacity={locked ? 0.72 : 0.27} side={2} /></mesh>
    <group ref={moving}>{symbols.map((symbol, symbolIndex) => {
      const a = symbolIndex * TAU / symbols.length;
      return <group key={symbol} position={[Math.sin(a) * radius, 0.17, -Math.cos(a) * radius]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh><circleGeometry args={[0.42, 8]} /><meshBasicMaterial color={locked && symbol === target ? '#8e8aba' : '#292c45'} transparent opacity={0.83} side={2} /></mesh>
        <group position={[0, 0, 0.018]}><CelestialGlyph symbol={symbol} color={locked && symbol === target ? '#fff7ff' : '#a9acdc'} scale={0.54} /></group>
      </group>;
    })}</group>
    <group position={[0, 0, -radius]}>
      <mesh position={[0, 0.26, 0]}><octahedronGeometry args={[0.2, 0]} /><meshBasicMaterial color={locked ? '#f6f0ff' : '#a5a9db'} /></mesh>
      <mesh position={[0, 0.13, -0.04]}><boxGeometry args={[0.045, 0.15, 0.85]} /><meshBasicMaterial color={locked ? '#d4c6ff' : '#777ca9'} transparent opacity={0.75} /></mesh>
    </group>
  </group>;
}
