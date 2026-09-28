import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { BalanceBlock } from './BalanceBlock';
import { BalanceMechanism } from './BalanceMechanism';
import { BalanceShard } from './BalanceShard';
import { plateWeights, type BalancePuzzleState } from './BalancePuzzleState';
import { balanceLayouts } from './balanceLayouts';
import { PressurePlate } from './PressurePlate';

function BalanceExit({ active }: { active: boolean }) {
  return <group position={[0, 0, 6.85]}>
    <mesh receiveShadow position={[0, 0.13, 0]}><cylinderGeometry args={[1.26, 1.43, 0.26, 8]} /><meshStandardMaterial color="#8e745b" flatShading /></mesh>
    {[-0.92, 0.92].map(x => <mesh key={x} castShadow position={[x, 1.48, 0]}><boxGeometry args={[0.4, 2.8, 0.53]} /><meshStandardMaterial color="#665241" /></mesh>)}
    <mesh castShadow position={[0, 2.94, 0]}><boxGeometry args={[2.25, 0.42, 0.55]} /><meshStandardMaterial color="#9b7959" /></mesh>
    <mesh position={[0, 1.5, 0]}><planeGeometry args={[1.55, 2.3]} /><meshBasicMaterial color={active ? '#eeb274' : '#503f39'} transparent opacity={active ? 0.73 : 0.27} side={2} depthWrite={false} /></mesh>
    <mesh position={[0, 1.56, 0.04]}><torusGeometry args={[0.5, 0.07, 4, 6]} /><meshStandardMaterial color={active ? '#ffd49d' : '#76594c'} emissive={active ? '#d88e51' : '#24130e'} emissiveIntensity={active ? 0.8 : 0.12} /></mesh>
    {active && <pointLight position={[0, 1.7, 0]} color="#ffbd82" intensity={1.2} distance={4} />}
  </group>;
}

export function BalanceTemple({ balance, nearbyBlock, resistedBlock, resetVersion, chargeStep, claiming, playerPosition, reducedMotion }: {
  balance: BalancePuzzleState; nearbyBlock: number | null; resistedBlock: number | null; resetVersion: number;
  chargeStep: number; claiming: boolean; playerPosition: React.RefObject<[number, number]>; reducedMotion: boolean;
}) {
  const dust = useRef<Group>(null);
  useFrame(({ clock }) => { if (dust.current && !reducedMotion) dust.current.rotation.y = clock.elapsedTime * 0.017; });
  const layout = balanceLayouts[balance.layout], weights = plateWeights(balance);
  return <>
    <color attach="background" args={['#39363a']} />
    <fog attach="fog" args={['#39363a', 19, 48]} />
    <ambientLight intensity={0.85} color="#e4c9a7" />
    <hemisphereLight args={['#d8b896', '#262b2d', 1.15]} />
    <directionalLight position={[-6, 12, 8]} intensity={2.35} color="#efd1a5" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-11} shadow-camera-right={11} shadow-camera-top={11} shadow-camera-bottom={-11} />
    <group position={[0, -4.2, 0]}>{Array.from({ length: 9 }, (_, i) => { const a = i * 2.3; return <mesh key={i} position={[Math.cos(a) * 10.6, (i % 3) * 0.36, Math.sin(a) * 10.6]} scale={[2.8, 0.65, 1.8]}><sphereGeometry args={[1, 8, 5]} /><meshBasicMaterial color="#a9a09b" transparent opacity={0.13} depthWrite={false} /></mesh>; })}</group>
    <mesh castShadow receiveShadow position={[0, -0.53, 3.9]}><boxGeometry args={[11.9, 1.08, 8.25]} /><meshStandardMaterial color="#383335" flatShading /></mesh>
    <mesh receiveShadow position={[0, 0.025, 3.9]}><boxGeometry args={[11.65, 0.1, 8.0]} /><meshStandardMaterial color="#8c765f" roughness={1} flatShading /></mesh>
    {[-5.4, 5.4].map(x => <mesh key={x} position={[x, -1.55, 3.8]} rotation={[0, 0, x < 0 ? -0.16 : 0.16]}><boxGeometry args={[0.8, 2.2, 6.4]} /><meshStandardMaterial color="#28282a" flatShading /></mesh>)}
    <mesh castShadow receiveShadow position={[0, -0.6, -6.05]}><cylinderGeometry args={[2.65, 2.35, 1.2, 8]} /><meshStandardMaterial color="#343236" flatShading /></mesh>
    <mesh receiveShadow position={[0, 0.025, -6.05]}><cylinderGeometry args={[2.52, 2.52, 0.1, 8]} /><meshStandardMaterial color="#9b8063" flatShading /></mesh>
    <mesh castShadow position={[0, 0.55, -6.1]}><cylinderGeometry args={[0.95, 1.18, 1.08, 8]} /><meshStandardMaterial color="#51443a" flatShading /></mesh>
    <mesh position={[0, 1.15, -6.1]}><torusGeometry args={[0.72, 0.09, 5, 8]} /><meshStandardMaterial color={balance.stage === 3 ? '#e8bd81' : '#6c5848'} emissive={balance.stage === 3 ? '#c58249' : '#1f1714'} emissiveIntensity={balance.stage === 3 ? 0.75 : 0.07} /></mesh>
    {Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return <mesh key={i} castShadow position={[Math.cos(a) * 2.15, 0.48, -6.1 + Math.sin(a) * 2.15]}><boxGeometry args={[0.31, 0.85, 0.31]} /><meshStandardMaterial color="#6e5a48" /></mesh>; })}
    {(['A', 'B', 'C'] as const).map((id, index) => <PressurePlate key={id} id={id} target={layout.targets[id]} weight={weights[id]} emphasized={balance.stage === 2 ? id !== 'B' : index === balance.stage} reducedMotion={reducedMotion} />)}
    {layout.blocks.map((block, index) => <BalanceBlock key={index} id={index} weight={block.weight} cell={balance.blocks[index]} resetVersion={resetVersion} highlighted={nearbyBlock === index && balance.phase === 'routing'} resisted={resistedBlock === index} reducedMotion={reducedMotion} />)}
    <BalanceMechanism balance={balance} chargeStep={chargeStep} reducedMotion={reducedMotion} />
    <BalanceExit active={balance.phase === 'claimed'} />
    {(balance.phase === 'shard-ready' || claiming) && <BalanceShard claiming={claiming} playerPosition={playerPosition} reducedMotion={reducedMotion} />}
    <group ref={dust}>{Array.from({ length: 33 }, (_, i) => { const a = i * 2.3999, r = 1.4 + (i * 1.39) % 6.8; return <mesh key={i} position={[Math.cos(a) * r, 0.8 + (i % 8) * 0.42, 1.2 + Math.sin(a) * r]}><octahedronGeometry args={[i % 5 ? 0.028 : 0.06, 0]} /><meshBasicMaterial color={i % 3 ? '#cba986' : '#e2c49b'} transparent opacity={0.48} /></mesh>; })}</group>
    {Array.from({ length: 8 }, (_, i) => { const x = (i % 2 ? -1 : 1) * (6.6 + i * 0.18), z = -7.2 + i * 2.1; return <mesh key={i} position={[x, -0.9 - i % 3 * 0.23, z]} rotation={[0.2, i, 0.35]}><dodecahedronGeometry args={[0.38 + (i % 3) * 0.12, 0]} /><meshStandardMaterial color="#5d514b" flatShading /></mesh>; })}
  </>;
}
