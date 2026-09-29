import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { FriendIdentity } from '../sdk/friendIdentity';
export function FriendAvatar({ identity, moving, reducedMotion, celebrate = false }: { identity: FriendIdentity; moving: React.RefObject<boolean>; reducedMotion: boolean; celebrate?: boolean }) {
  const body = useRef<Group>(null);
  const celebrationStarted = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!body.current) return;
    const t = clock.elapsedTime;
    if (celebrate && celebrationStarted.current === null) celebrationStarted.current = t;
    if (!celebrate) celebrationStarted.current = null;
    if (reducedMotion) { body.current.position.y = 0; body.current.rotation.z = 0; return; }
    if (celebrationStarted.current !== null && t - celebrationStarted.current < 1.65) {
      const elapsed = t - celebrationStarted.current;
      body.current.position.y = Math.abs(Math.sin(elapsed * Math.PI * 2.4)) * (1 - elapsed / 1.65) * 0.38;
      body.current.rotation.z = Math.sin(elapsed * Math.PI * 2) * 0.12;
      return;
    }
    body.current.position.y = moving.current ? Math.abs(Math.sin(t * 10)) * 0.075 : Math.sin(t * 2) * 0.035;
    body.current.rotation.z = moving.current ? Math.sin(t * 10) * 0.035 : 0;
  });
  return <group ref={body}>
    <mesh castShadow position={[0, 0.65, 0]}><boxGeometry args={[0.65, 0.8, 0.44]} /><meshStandardMaterial color={identity.accent} roughness={1} /></mesh>
    <mesh castShadow position={[0, 1.36, 0]}><boxGeometry args={[0.82, 0.66, 0.64]} /><meshStandardMaterial color="#f4d9af" roughness={1} /></mesh>
    <mesh castShadow position={[-0.27, 1.83, 0]} rotation={[0, 0, 0.2]}><coneGeometry args={[0.18, 0.5, 4]} /><meshStandardMaterial color={identity.accent} /></mesh>
    <mesh castShadow position={[0.27, 1.83, 0]} rotation={[0, 0, -0.2]}><coneGeometry args={[0.18, 0.5, 4]} /><meshStandardMaterial color={identity.accent} /></mesh>
    {[-0.18, 0.18].map(x => <mesh key={x} position={[x, 1.4, 0.327]}><boxGeometry args={[0.09, 0.12, 0.025]} /><meshBasicMaterial color="#26344c" /></mesh>)}
    <mesh position={[0, 1.22, 0.33]}><boxGeometry args={[0.18, 0.035, 0.025]} /><meshBasicMaterial color="#9f6260" /></mesh>
    {[-0.23, 0.23].map(x => <mesh key={x} castShadow position={[x, 0.15, 0.04]}><boxGeometry args={[0.22, 0.32, 0.35]} /><meshStandardMaterial color="#41485b" /></mesh>)}
    <mesh castShadow position={[0, 0.85, -0.38]}><boxGeometry args={[0.5, 0.48, 0.2]} /><meshStandardMaterial color="#617565" /></mesh>
  </group>;
}
