import { Environment } from './Environment';
import { CentralMonument } from './CentralMonument';
import { Portal, portalConfig } from '../portals/Portal';
import { portalStatus, type GameState } from '../game/GameState';
export function Island({ state, identitySeed, reducedMotion }: { state: GameState; identitySeed: number; reducedMotion: boolean }) {
  return <><Environment identitySeed={identitySeed} reducedMotion={reducedMotion} /><CentralMonument reducedMotion={reducedMotion} />
    {portalConfig.map((_, index) => <Portal key={index} index={index} status={portalStatus(state, index + 1)} reducedMotion={reducedMotion} />)}
    {Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return <mesh key={i} castShadow position={[Math.cos(a) * 9.3, 0.32, Math.sin(a) * 9.3]} rotation={[0, a, 0]}><dodecahedronGeometry args={[0.4, 0]} /><meshStandardMaterial color="#b7ae97" flatShading /></mesh>; })}
  </>;
}
