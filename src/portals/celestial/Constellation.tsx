import { useMemo } from 'react';
import { Quaternion, Vector3 } from 'three';
import { seededRandom } from '../../game/seededRun';
import { CelestialGlyph } from './CelestialGlyph';
import { constellations, type CelestialConfig } from './celestialConfig';
import type { CelestialPhase } from './CelestialPuzzleState';

function StarLink({ from, to, bright }: { from: readonly [number, number, number]; to: readonly [number, number, number]; bright: boolean }) {
  const first = new Vector3(...from), last = new Vector3(...to), vector = last.clone().sub(first);
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), vector.clone().normalize());
  return <mesh position={first.add(last).multiplyScalar(0.5)} quaternion={rotation}>
    <cylinderGeometry args={[0.025, 0.025, vector.length(), 5]} />
    <meshBasicMaterial color={bright ? '#e5dcff' : '#858ab6'} transparent opacity={bright ? 0.82 : 0.16} depthWrite={false} />
  </mesh>;
}

export function Constellation({ config, phase, revealStep }: { config: CelestialConfig; phase: CelestialPhase; revealStep: number }) {
  const shape = constellations[config.constellation];
  const positions = useMemo(() => shape.stars.map((height, index) => [(-2.2 + index * 2.2), 3.15 + height * 0.65, -3.65 - (index % 2) * 0.25] as const), [shape]);
  const bright = phase === 'clue' || phase === 'shard-ready' || phase === 'claimed' || phase === 'finale' && revealStep >= 3;
  const shown = phase === 'finale' ? revealStep : bright ? 3 : 0;
  const sky = useMemo(() => {
    const random = seededRandom(config.skySeed), points = new Float32Array(135 * 3);
    for (let i = 0; i < 135; i++) {
      const angle = random() * Math.PI * 2, radius = 8 + random() * 28;
      points[i * 3] = Math.sin(angle) * radius;
      points[i * 3 + 1] = 2.5 + random() * 15;
      points[i * 3 + 2] = Math.cos(angle) * radius - 3;
    }
    return points;
  }, [config.skySeed]);
  return <>
    <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[sky, 3]} /></bufferGeometry><pointsMaterial color="#dadcff" size={0.105} sizeAttenuation transparent opacity={0.73} depthWrite={false} /></points>
    {positions.map((position, index) => <group key={index} position={[...position]}>
      <mesh><octahedronGeometry args={[shown > index ? 0.24 : 0.13, 0]} /><meshBasicMaterial color={shown > index ? '#fff7ff' : '#777da9'} transparent opacity={shown > index ? 0.98 : 0.28} /></mesh>
      <group position={[0, 0, 0.25]}><CelestialGlyph symbol={shape.targets[index]} color={shown > index ? '#f3edff' : '#8187af'} scale={0.82} opacity={shown > index ? 0.94 : 0.27} /></group>
      {shown > index && <pointLight color="#a8acff" intensity={0.55} distance={3} />}
    </group>)}
    {(phase !== 'finale' || shown >= 2) && <StarLink from={positions[0]} to={positions[1]} bright={bright} />}
    {(phase !== 'finale' || shown >= 3) && <StarLink from={positions[1]} to={positions[2]} bright={bright} />}
    {(phase === 'finale' && revealStep >= 4 || phase === 'shard-ready' || phase === 'claimed') && <StarLink from={positions[1]} to={[0, 1.7, -1.3]} bright />}
  </>;
}
