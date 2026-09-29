import { Quaternion, Vector3 } from 'three';

function Beam({ from, to, color, radius = 0.045, opacity = 1 }: { from: readonly [number, number, number]; to: readonly [number, number, number]; color: string; radius?: number; opacity?: number }) {
  const start = new Vector3(...from), end = new Vector3(...to), direction = end.clone().sub(start);
  const middle = start.clone().add(end).multiplyScalar(0.5);
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={middle} quaternion={quaternion}><cylinderGeometry args={[radius, radius, direction.length(), 6]} /><meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} /></mesh>;
}
const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function PortalEnergy({ seconds, complete }: { seconds: number; complete: boolean }) {
  const light = complete ? 1 : clamp((seconds - 1) / 1.25);
  const echo = complete ? 1 : clamp((seconds - 2.4) / 1.35);
  const balance = complete ? 1 : clamp((seconds - 3.8) / 1.35);
  const celestial = complete ? 1 : clamp((seconds - 5.2) / 1.4);
  const faint = complete ? 0.27 : 1;
  return <group>
    {light > 0 && <group>
      <Beam from={[0, 1.8, -6.4]} to={[0, 1.05, -6.4 + 5.47 * light]} color="#fff8d6" radius={0.075} opacity={faint} />
      <Beam from={[0, 1.8, -6.4]} to={[0, 1.05, -6.4 + 5.47 * light]} color="#f4d783" radius={0.19} opacity={faint * 0.27} />
      {!complete && <mesh position={[0, 1.05 + 0.75 * (1 - light), -6.4 + 5.47 * light]}><octahedronGeometry args={[0.18, 0]} /><meshBasicMaterial color="#fffbed" /></mesh>}
    </group>}
    {echo > 0 && Array.from({ length: 3 }, (_, i) => {
      const t = clamp(echo * 1.5 - i * 0.24);
      if (t <= 0) return null;
      const x = 6.4 - 5.47 * t;
      return <group key={i} position={[x, 0.65 + t * 0.38, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.48 + (1 - t) * 0.32, 0.035, 5, 24]} /><meshBasicMaterial color="#a6f1d5" transparent opacity={(complete ? 0.1 : 0.7) * (0.45 + 0.55 * t)} depthWrite={false} /></mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.72 + (1 - t) * 0.2, 0.015, 4, 24]} /><meshBasicMaterial color="#72d6bc" transparent opacity={complete ? 0.08 : 0.42} depthWrite={false} /></mesh>
      </group>;
    })}
    {balance > 0 && Array.from({ length: 7 }, (_, i) => {
      const active = complete || balance >= (i + 1) / 7;
      return active ? <group key={i} position={[0, 0.08, 5.6 - i * 0.72]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.72, 0.27]} /><meshBasicMaterial color="#edb979" transparent opacity={complete ? 0.18 : 0.83} depthWrite={false} side={2} /></mesh>
        {!complete && <mesh position={[0, 0.17, 0]}><boxGeometry args={[0.2, 0.3, 0.2]} /><meshStandardMaterial color="#c28b5f" emissive="#c28b5f" emissiveIntensity={0.9} /></mesh>}
      </group> : null;
    })}
    {celestial > 0 && Array.from({ length: 14 }, (_, i) => {
      const t = complete ? i / 13 : clamp(celestial * 1.5 - i * 0.09);
      if (t <= 0) return null;
      const x = -6.4 + 5.47 * t, y = 1.6 + Math.sin(t * Math.PI) * 2.2 + (i % 3) * 0.12;
      return <mesh key={i} position={[x, y, Math.sin(i * 4.7) * 0.32]} scale={complete ? 0.5 : 1}>
        <octahedronGeometry args={[i % 4 === 0 ? 0.12 : 0.065, 0]} /><meshBasicMaterial color={i % 3 === 0 ? '#f4eeff' : '#b6b3f2'} transparent opacity={complete ? 0.38 : 1} />
      </mesh>;
    })}
    {seconds >= 6.7 && !complete && <group position={[0, 2.3, 0]}>
      {Array.from({ length: 4 }, (_, i) => { const a = i * Math.PI / 2 + seconds * 0.75; return <mesh key={i} position={[Math.sin(a) * 0.9, Math.sin(seconds * 2 + i) * 0.15, Math.cos(a) * 0.9]}><octahedronGeometry args={[0.16, 0]} /><meshBasicMaterial color={['#ffe4a0', '#a2e8d1', '#f3ad83', '#c2b8ff'][i]} /></mesh>; })}
    </group>}
  </group>;
}
