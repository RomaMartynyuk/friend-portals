import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { LightPuzzleState } from './LightPuzzleState';
import { crystalPositions, lightNodes, traceLight } from './LightPuzzleState';
import { LightBeamSystem } from './LightBeamSystem';
import { RotatableCrystal } from './RotatableCrystal';
import { LightReceiver } from './LightReceiver';
import { PortalCore } from './PortalCore';
import { PortalShard } from './PortalShard';
function Dust({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => { if (group.current && !reducedMotion) group.current.rotation.y = clock.elapsedTime * 0.027; });
  return <group ref={group}>{Array.from({ length: 32 }, (_, i) => {
    const a = i * 2.39996, r = 1.3 + ((i * 2.3) % 5.4);
    return <mesh key={i} position={[Math.cos(a) * r, 1.2 + (i % 7) * 0.38, Math.sin(a) * r]}><octahedronGeometry args={[i % 4 === 0 ? 0.055 : 0.025, 0]} /><meshBasicMaterial color={i % 3 === 0 ? '#fff3cb' : '#dfd5bc'} transparent opacity={0.65} /></mesh>;
  })}</group>;
}
function ExitGate({ active }: { active: boolean }) {
  return <group position={[0, 0, 5.35]}>
    <mesh castShadow receiveShadow position={[0, 0.14, 0]}><cylinderGeometry args={[1.35, 1.5, 0.28, 8]} /><meshStandardMaterial color="#c9bca0" flatShading /></mesh>
    {[-0.93, 0.93].map(x => <mesh key={x} castShadow position={[x, 1.48, 0]}><boxGeometry args={[0.35, 2.85, 0.5]} /><meshStandardMaterial color="#e6dac0" /></mesh>)}
    <mesh castShadow position={[0, 2.92, 0]}><boxGeometry args={[2.25, 0.4, 0.5]} /><meshStandardMaterial color="#e6dac0" /></mesh>
    <mesh position={[0, 1.5, 0]}><planeGeometry args={[1.55, 2.38]} /><meshBasicMaterial color={active ? '#ffe8a2' : '#525f62'} transparent opacity={active ? 0.73 : 0.3} side={2} depthWrite={false} /></mesh>
    <mesh position={[0, 1.6, 0.05]}><torusGeometry args={[0.48, 0.065, 4, 6]} /><meshStandardMaterial color={active ? '#fff4c5' : '#7f8988'} emissive={active ? '#d1a351' : '#141b1d'} emissiveIntensity={active ? 1 : 0.1} /></mesh>
    {active && <pointLight color="#ffe2a0" intensity={1.6} distance={4} position={[0, 1.5, 0]} />}
  </group>;
}
export function LightTemple({ light, highlightedCrystal, resetVersion, beamBroken, chargeStep, claiming, playerPosition, reducedMotion }: {
  light: LightPuzzleState; highlightedCrystal: number | null; resetVersion: number; beamBroken: boolean; chargeStep: number;
  claiming: boolean; playerPosition: React.RefObject<[number, number]>; reducedMotion: boolean;
}) {
  const seals = traceLight(light.orientations).seals;
  const charged = light.phase !== 'routing';
  return <>
    <color attach="background" args={['#313943']} />
    <fog attach="fog" args={['#313943', 18, 43]} />
    <ambientLight intensity={0.95} color="#fff2d6" />
    <hemisphereLight args={['#e9dbc0', '#242d36', 1.1]} />
    <directionalLight position={[-4, 11, 7]} intensity={2.7} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} />
    <group position={[0, -5.5, 0]}>{Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return <mesh key={i} position={[Math.cos(a) * 9.5, (i % 3) * 0.32, Math.sin(a) * 9.5]} scale={[3.3, 0.7, 2]}><sphereGeometry args={[1, 8, 5]} /><meshBasicMaterial color="#b8bbb7" transparent opacity={0.18} depthWrite={false} /></mesh>; })}</group>
    <mesh castShadow receiveShadow position={[0, -0.53, 0]}><cylinderGeometry args={[7.1, 6.55, 1.06, 8]} /><meshStandardMaterial color="#282e34" flatShading roughness={1} /></mesh>
    <mesh receiveShadow position={[0, -0.01, 0]}><cylinderGeometry args={[6.96, 6.96, 0.1, 8]} /><meshStandardMaterial color="#d8c9ab" flatShading roughness={1} /></mesh>
    <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}><ringGeometry args={[5.9, 6.15, 8]} /><meshStandardMaterial color="#2a3035" side={2} /></mesh>
    {Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4 + Math.PI / 8; return <group key={i} position={[Math.cos(a) * 6.33, 0, Math.sin(a) * 6.33]}>
      <mesh castShadow position={[0, 0.78, 0]}><boxGeometry args={[0.58, 1.55, 0.6]} /><meshStandardMaterial color="#e0d1b3" /></mesh>
      <mesh position={[0, 1.57, 0]}><octahedronGeometry args={[0.22, 0]} /><meshStandardMaterial color={charged ? '#ffe8aa' : '#948c77'} emissive={charged ? '#ad7b34' : '#11171b'} emissiveIntensity={charged ? 0.55 : 0.1} /></mesh>
    </group>; })}
    <mesh castShadow position={[lightNodes.emitter[0], 0.72, lightNodes.emitter[2]]}><cylinderGeometry args={[0.7, 0.9, 1.44, 8]} /><meshStandardMaterial color="#252c32" flatShading /></mesh>
    <mesh position={lightNodes.emitter}><octahedronGeometry args={[0.43, 0]} /><meshStandardMaterial color="#fff8d9" emissive="#ffde91" emissiveIntensity={1.5} /></mesh>
    <pointLight position={lightNodes.emitter} color="#ffe5a1" intensity={1.7} distance={4.5} />
    {crystalPositions.map((_, i) => <RotatableCrystal key={i} id={i as 0 | 1 | 2} orientation={light.orientations[i]} resetVersion={resetVersion} highlighted={highlightedCrystal === i} locked={light.phase !== 'routing'} reducedMotion={reducedMotion} />)}
    {[0, 1, 2].map(i => <LightReceiver key={i} index={i} active={seals > i} pulse={charged && chargeStep === i + 1} reducedMotion={reducedMotion} />)}
    <PortalCore phase={light.phase} chargeStep={chargeStep} reducedMotion={reducedMotion} />
    <LightBeamSystem orientations={light.orientations} broken={beamBroken} charged={charged} reducedMotion={reducedMotion} />
    {(light.phase === 'shard-ready' || claiming) && <PortalShard claiming={claiming} playerPosition={playerPosition} reducedMotion={reducedMotion} />}
    <ExitGate active={light.phase === 'claimed'} />
    <Dust reducedMotion={reducedMotion} />
  </>;
}
