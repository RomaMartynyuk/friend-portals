import { Environment } from './Environment';
import { CentralMonument } from './CentralMonument';
import { Portal, portalConfig } from '../portals/Portal';
import { portalStatus, type GameState } from '../game/GameState';
import { UnlockEffect } from '../effects/UnlockEffect';
import { RestorationFinale } from '../finale/RestorationFinale';
import { RestoredIslandEffects } from '../finale/RestoredIslandEffects';
import type { JourneySigilConfig } from '../finale/JourneySigilConfig';
export function Island({ state, identitySeed, reducedMotion, unlockProgress, restorationSeconds, sigil }: { state: GameState; identitySeed: number; reducedMotion: boolean; unlockProgress: number; restorationSeconds: number; sigil: JourneySigilConfig }) {
  const restored = state.restoration.phase === 'complete';
  return <><Environment runSeed={state.runSeed} identitySeed={identitySeed} reducedMotion={reducedMotion} restored={restored} /><CentralMonument reducedMotion={reducedMotion} reacting={state.islandEvent !== null || state.restoration.phase === 'playing'} completedPortals={state.completedPortals} restorationSeconds={restorationSeconds} restored={restored} />
    {portalConfig.map((_, index) => <Portal key={index} index={index} status={index === state.islandEvent && unlockProgress < 0.78 ? 'locked' : portalStatus(state, index + 1)} reducedMotion={reducedMotion} />)}
    {(state.islandEvent === 1 || state.islandEvent === 2 || state.islandEvent === 3) && <UnlockEffect progress={unlockProgress} fromPortal={state.islandEvent} />}
    {state.restoration.phase !== 'dormant' && <RestorationFinale seconds={restorationSeconds} complete={restored} sigil={sigil} reducedMotion={reducedMotion} />}
    <RestoredIslandEffects runSeed={state.runSeed} restored={restored} strength={state.restoration.phase === 'playing' ? Math.max(0, (restorationSeconds - 10.2) / 2.3) : 0} />
    {Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return <mesh key={i} castShadow position={[Math.cos(a) * 9.3, 0.32, Math.sin(a) * 9.3]} rotation={[0, a, 0]}><dodecahedronGeometry args={[0.4, 0]} /><meshStandardMaterial color="#b7ae97" flatShading /></mesh>; })}
  </>;
}
