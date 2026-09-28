import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector3, type Group } from 'three';
import { FriendAvatar } from './FriendAvatar';
import type { FriendIdentity } from '../sdk/friendIdentity';
import type { InputVector } from '../input/useMovementInput';
const cameraOffset = new Vector3(10, 14, 18);
const forward = new Vector3(-8, 0, -14).normalize();
const right = new Vector3(14, 0, -8).normalize();
export function Player({ identity, vector, onPosition, bounds, spawn, reducedMotion }: {
  identity: FriendIdentity; vector: () => InputVector; onPosition: (x: number, z: number) => void;
  bounds: number; spawn: [number, number]; reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  const moving = useRef(false);
  const { camera } = useThree();
  const worldDirection = useRef(new Vector3());
  const lastReport = useRef(0);
  useFrame((state, rawDelta) => {
    if (!group.current) return;
    const delta = Math.min(rawDelta, 0.05);
    const input = vector();
    const dir = worldDirection.current.copy(right).multiplyScalar(input.x).addScaledVector(forward, -input.z);
    moving.current = dir.lengthSq() > 0.001;
    if (moving.current) {
      dir.normalize();
      const x = group.current.position.x + dir.x * 4.6 * delta;
      const z = group.current.position.z + dir.z * 4.6 * delta;
      if (Math.hypot(x, z) < bounds) { group.current.position.x = x; group.current.position.z = z; }
      group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, Math.atan2(dir.x, dir.z), 1 - Math.exp(-12 * delta));
    }
    const target = group.current.position;
    camera.position.lerp(new Vector3(target.x + cameraOffset.x, target.y + cameraOffset.y, target.z + cameraOffset.z), 1 - Math.exp(-4 * delta));
    camera.lookAt(target.x, target.y + 0.8, target.z);
    if (state.clock.elapsedTime - lastReport.current > 0.08) { lastReport.current = state.clock.elapsedTime; onPosition(target.x, target.z); }
  });
  return <group ref={group} position={[spawn[0], 0, spawn[1]]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}><circleGeometry args={[0.46, 16]} /><meshBasicMaterial color="#27353b" transparent opacity={0.25} depthWrite={false} /></mesh>
    <FriendAvatar identity={identity} moving={moving} reducedMotion={reducedMotion} />
  </group>;
}
