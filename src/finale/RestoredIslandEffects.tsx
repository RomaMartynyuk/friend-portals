import { useMemo } from 'react';
import { forkSeed, type RunSeed } from '../game/seededRun';

export function RestoredIslandEffects({ runSeed, restored, strength }: { runSeed: RunSeed; restored: boolean; strength: number }) {
  const petals = useMemo(() => Array.from({ length: 22 }, (_, i) => {
    const a = i * Math.PI * 2 / 22 + (forkSeed(runSeed, `finale:flower:${i}`) % 100) / 200;
    const radius = 2.8 + (i % 3) * 0.68;
    return [Math.sin(a) * radius, Math.cos(a) * radius] as const;
  }), [runSeed]);
  if (!restored && strength <= 0) return null;
  const amount = restored ? 1 : strength;
  return <group>
    {petals.map(([x, z], i) => <group key={i} position={[x, 0.04, z]} scale={Math.max(0.01, amount)}>
      <mesh position={[0, 0.1, 0]}><octahedronGeometry args={[0.13, 0]} /><meshBasicMaterial color={i % 4 === 0 ? '#eac2ec' : i % 3 === 0 ? '#b8ead7' : '#ffedc5'} transparent opacity={0.68 * amount} /></mesh>
    </group>)}
    {[0, 1, 2, 3].map(i => <mesh key={i} rotation={[-Math.PI / 2, 0, i * Math.PI / 2]} position={[Math.sin(i * Math.PI / 2) * 2.35, 0.08, Math.cos(i * Math.PI / 2) * 2.35]}>
      <planeGeometry args={[0.12, 2.6]} /><meshBasicMaterial color={['#f6df9c', '#9be4ca', '#efad80', '#b8b1ee'][i]} transparent opacity={0.18 + 0.25 * amount} side={2} depthWrite={false} />
    </mesh>)}
    <pointLight color="#fff5d9" position={[0, 3.2, 0]} intensity={amount * 1.4} distance={8} />
  </group>;
}
