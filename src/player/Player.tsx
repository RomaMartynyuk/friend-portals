import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector3, type Group } from 'three';
import { FriendAvatar } from './FriendAvatar';
import type { FriendIdentity } from '../sdk/friendIdentity';
import type { InputVector } from '../input/useMovementInput';
export function Player({ identity, vector, onPosition, bounds, spawn, reducedMotion, cameraOffset, canMove, cinematicSeconds, celebrate }: {
  identity: FriendIdentity; vector: () => InputVector; onPosition: (x: number, z: number) => void;
  bounds: number; spawn: [number, number]; reducedMotion: boolean; cameraOffset: readonly [number, number, number]; canMove?: (x: number, z: number) => boolean;
  cinematicSeconds?: number | null; celebrate?: boolean;
}) {
  const group = useRef<Group>(null);
  const moving = useRef(false);
  const { camera } = useThree();
  const worldDirection = useRef(new Vector3());
  const offset = useMemo(() => new Vector3(...cameraOffset), [cameraOffset[0], cameraOffset[1], cameraOffset[2]]);
  const forward = useMemo(() => new Vector3(-offset.x, 0, -offset.z).normalize(), [offset]);
  const right = useMemo(() => new Vector3(-forward.z, 0, forward.x), [forward]);
  const lastReport = useRef(0);
  const lookTarget = useRef(new Vector3(spawn[0], 0.8, spawn[1]));
  useLayoutEffect(() => {
    camera.position.set(spawn[0] + offset.x, offset.y, spawn[1] + offset.z);
    camera.lookAt(spawn[0], 0.8, spawn[1]);
  }, [camera, offset, spawn[0], spawn[1]]);
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
      if (Math.hypot(x, z) < bounds && (!canMove || canMove(x, z))) { group.current.position.x = x; group.current.position.z = z; }
      group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, Math.atan2(dir.x, dir.z), 1 - Math.exp(-12 * delta));
    }
    const target = group.current.position;
    const cinematic = cinematicSeconds !== null && cinematicSeconds !== undefined;
    const sigilCloseup = cinematic && cinematicSeconds >= 8.5;
    const portalBias = !cinematic ? [0, 0] : cinematicSeconds < 2.4 ? [0, -1.1] : cinematicSeconds < 3.8 ? [1.1, 0] : cinematicSeconds < 5.2 ? [0, 1.1] : cinematicSeconds < 6.7 ? [-1.1, 0] : [0, 0];
    const focus = cinematic ? new Vector3(portalBias[0], sigilCloseup ? 2.15 : 0.9, portalBias[1]) : new Vector3(target.x, target.y + 0.8, target.z);
    const cinematicOffset = cinematic ? sigilCloseup ? new Vector3(8.1, 11.6, 14.3) : new Vector3(12.4, 18.2, 22) : offset;
    camera.position.lerp(focus.clone().add(cinematicOffset), 1 - Math.exp(-(cinematic ? 1.6 : 4) * delta));
    lookTarget.current.lerp(focus, 1 - Math.exp(-3 * delta));
    camera.lookAt(lookTarget.current);
    if (state.clock.elapsedTime - lastReport.current > 0.08) { lastReport.current = state.clock.elapsedTime; onPosition(target.x, target.z); }
  });
  return <group ref={group} position={[spawn[0], 0, spawn[1]]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}><circleGeometry args={[0.46, 16]} /><meshBasicMaterial color="#27353b" transparent opacity={0.25} depthWrite={false} /></mesh>
    <FriendAvatar identity={identity} moving={moving} reducedMotion={reducedMotion} celebrate={celebrate ?? false} />
  </group>;
}
