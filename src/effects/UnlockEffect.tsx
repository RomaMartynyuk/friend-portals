import { useMemo } from 'react';
import { Quaternion, Vector3 } from 'three';
import { portalConfig } from '../portals/Portal';
function EnergyPath({ from, to, fraction }: { from: Vector3; to: Vector3; fraction: number }) {
  const length = from.distanceTo(to);
  const geometry = useMemo(() => {
    const end = from.clone().lerp(to, fraction);
    const direction = end.clone().sub(from);
    return { midpoint: from.clone().add(end).multiplyScalar(0.5), rotation: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.lengthSq() ? direction.normalize() : new Vector3(0, 1, 0)) };
  }, [from, to, fraction]);
  if (fraction <= 0) return null;
  return <>
    <mesh position={geometry.midpoint} quaternion={geometry.rotation}><cylinderGeometry args={[0.055, 0.055, length * fraction, 5]} /><meshBasicMaterial color="#fff0ba" transparent opacity={0.85} /></mesh>
    <mesh position={from.clone().lerp(to, fraction)}><octahedronGeometry args={[0.23, 0]} /><meshBasicMaterial color="#fff6d2" /></mesh>
  </>;
}
export function UnlockEffect({ progress }: { progress: number }) {
  const first = useMemo(() => new Vector3(portalConfig[0].x, 2.25, portalConfig[0].z), []);
  const center = useMemo(() => new Vector3(0, 2.75, 0), []);
  const second = useMemo(() => new Vector3(portalConfig[1].x, 2.25, portalConfig[1].z), []);
  return <group>
    <EnergyPath from={first} to={center} fraction={Math.min(1, progress * 2)} />
    <EnergyPath from={center} to={second} fraction={Math.max(0, Math.min(1, (progress - 0.48) * 2))} />
    {progress > 0.45 && <mesh position={[0, 2.75, 0]} scale={1 + Math.sin(progress * 18) * 0.12}><octahedronGeometry args={[0.88, 0]} /><meshBasicMaterial color="#fff0b8" transparent opacity={0.24} depthWrite={false} /></mesh>}
    {progress > 0.85 && Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return <mesh key={i} position={[portalConfig[1].x + Math.cos(a) * 1.3, 1.2 + i * 0.26, portalConfig[1].z + Math.sin(a) * 1.3]}><octahedronGeometry args={[0.1, 0]} /><meshBasicMaterial color="#a8f1d4" /></mesh>; })}
  </group>;
}
