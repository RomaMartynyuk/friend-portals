import { JourneySigil } from './JourneySigil';
import { PortalEnergy } from './PortalEnergy';
import type { JourneySigilConfig } from './JourneySigilConfig';

export function RestorationFinale({ seconds, complete, sigil, reducedMotion }: { seconds: number; complete: boolean; sigil: JourneySigilConfig; reducedMotion: boolean }) {
  const reveal = complete ? 1 : Math.max(0, Math.min(1, (seconds - 9.7) / 2.5));
  return <group>
    <PortalEnergy seconds={seconds} complete={complete} />
    {(reveal > 0 || complete) && <>
      <mesh position={[0, 4.15, 0]}><cylinderGeometry args={[0.08, 0.38, 2.2, 6]} /><meshBasicMaterial color="#f9f5e5" transparent opacity={complete ? 0.16 : reveal * 0.34} depthWrite={false} /></mesh>
      <JourneySigil config={sigil} revealed={reveal} reducedMotion={reducedMotion} />
    </>}
  </group>;
}
