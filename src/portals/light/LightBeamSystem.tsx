import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3, type Group } from 'three';
import { traceLight, type BeamSegment } from './LightPuzzleState';
function BeamLink({ segment, index, charged, reducedMotion }: { segment: BeamSegment; index: number; charged: boolean; reducedMotion: boolean }) {
  const particle = useRef<Group>(null);
  const shape = useMemo(() => {
    const from = new Vector3(...segment.from), to = new Vector3(...segment.to);
    const direction = to.clone().sub(from), length = direction.length();
    return { from, to, length, midpoint: from.clone().add(to).multiplyScalar(0.5), rotation: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()) };
  }, [segment]);
  useFrame(({ clock }) => {
    if (!particle.current) return;
    const phase = reducedMotion ? 0.55 : (clock.elapsedTime * (charged ? 1.55 : 1.1) + index * 0.27) % 1;
    particle.current.position.copy(shape.from).lerp(shape.to, phase);
  });
  return <>
    <group position={shape.midpoint} quaternion={shape.rotation}>
      <mesh><cylinderGeometry args={[charged ? 0.19 : 0.13, charged ? 0.19 : 0.13, shape.length, 6]} /><meshBasicMaterial color="#f6c963" transparent opacity={segment.terminal ? 0.13 : 0.18} depthWrite={false} /></mesh>
      <mesh><cylinderGeometry args={[0.038, 0.038, shape.length, 5]} /><meshBasicMaterial color={segment.terminal ? '#d1b384' : '#fffbe1'} transparent opacity={segment.terminal ? 0.5 : 1} /></mesh>
    </group>
    <group ref={particle}><mesh><octahedronGeometry args={[segment.terminal ? 0.055 : 0.085, 0]} /><meshBasicMaterial color="#fff8d4" transparent opacity={segment.terminal ? 0.42 : 0.95} /></mesh></group>
    <mesh position={shape.to}><sphereGeometry args={[segment.terminal ? 0.09 : 0.16, 8, 6]} /><meshBasicMaterial color={segment.terminal ? '#bcad83' : '#ffe7a0'} transparent opacity={segment.terminal ? 0.38 : 0.55} depthWrite={false} /></mesh>
  </>;
}
export function LightBeamSystem({ orientations, broken, charged, reducedMotion }: {
  orientations: readonly [number, number, number]; broken: boolean; charged: boolean; reducedMotion: boolean;
}) {
  const trace = useMemo(() => traceLight(orientations), [orientations]);
  if (broken) return null;
  return <group>{trace.segments.map((segment, index) => <BeamLink key={`${index}-${segment.to.join(',')}`} segment={segment} index={index} charged={charged} reducedMotion={reducedMotion} />)}</group>;
}
