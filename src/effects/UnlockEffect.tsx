import { useMemo } from 'react';
import { Quaternion, Vector3 } from 'three';
import { portalConfig } from '../portals/Portal';
function EnergyPath({ from, to, fraction, color }: { from: Vector3; to: Vector3; fraction: number; color: string }) {
  const length = from.distanceTo(to);
  const geometry = useMemo(() => {
    const end = from.clone().lerp(to, fraction);
    const direction = end.clone().sub(from);
    return { midpoint: from.clone().add(end).multiplyScalar(0.5), rotation: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.lengthSq() ? direction.normalize() : new Vector3(0, 1, 0)) };
  }, [from, to, fraction]);
  if (fraction <= 0) return null;
  return <>
    <mesh position={geometry.midpoint} quaternion={geometry.rotation}><cylinderGeometry args={[0.055, 0.055, length * fraction, 5]} /><meshBasicMaterial color={color} transparent opacity={0.85} /></mesh>
    <mesh position={from.clone().lerp(to, fraction)}><octahedronGeometry args={[0.23, 0]} /><meshBasicMaterial color="#f5fff0" /></mesh>
  </>;
}
export function UnlockEffect({ progress, fromPortal }: { progress: number; fromPortal: 1 | 2 | 3 }) {
  const source = portalConfig[fromPortal - 1], target = portalConfig[fromPortal];
  const first = useMemo(() => new Vector3(source.x, 2.25, source.z), [source]);
  const center = useMemo(() => new Vector3(0, 2.75, 0), []);
  const second = useMemo(() => new Vector3(target.x, 2.25, target.z), [target]);
  return <group>
    <EnergyPath from={first} to={center} fraction={Math.min(1, progress * 2)} color={source.color} />
    <EnergyPath from={center} to={second} fraction={Math.max(0, Math.min(1, (progress - 0.48) * 2))} color={target.color} />
    {progress > 0.45 && <mesh position={[0, 2.75, 0]} scale={1 + Math.sin(progress * 18) * 0.12}><octahedronGeometry args={[0.88, 0]} /><meshBasicMaterial color={source.color} transparent opacity={0.24} depthWrite={false} /></mesh>}
    {progress > 0.85 && Array.from({ length: fromPortal === 3 ? 15 : 8 }, (_, i) => { const a = i * Math.PI * 2 / (fromPortal === 3 ? 15 : 8); return <mesh key={i} position={[target.x + Math.cos(a) * 1.3, 1.2 + i * 0.16, target.z + Math.sin(a) * 1.3]}><octahedronGeometry args={[0.1, 0]} /><meshBasicMaterial color={target.color} /></mesh>; })}
  </group>;
}
