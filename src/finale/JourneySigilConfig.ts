import { forkSeed, type RunSeed } from '../game/seededRun';
import { initialLightPuzzle } from '../portals/light/LightPuzzleState';
import { initialEchoPuzzle } from '../portals/echo/EchoPuzzleState';
import { initialBalancePuzzle } from '../portals/balance/BalancePuzzleState';
import { initialCelestialPuzzle } from '../portals/celestial/CelestialPuzzleState';

export type SigilShape = 'diamond' | 'spire' | 'split' | 'arc';
export type JourneySigilConfig = Readonly<{
  id: string; shape: SigilShape; rotation: number; nodeAngles: readonly number[];
  orbitMarks: number; accent: string; lightFacet: number; echoOffset: number;
  balanceBars: number; celestialPoints: number;
}>;
const accents = ['#f4e4c0', '#dce9ef', '#e8ddfa', '#dcf0e4'] as const;

/** Independent named forks keep future decoration changes away from every puzzle seed. */
export function journeySigilForSeed(runSeed: RunSeed): JourneySigilConfig {
  const light = initialLightPuzzle(runSeed).variant;
  const echo = initialEchoPuzzle(runSeed).sequences;
  const balance = initialBalancePuzzle(runSeed).layout;
  const celestial = initialCelestialPuzzle(runSeed).constellation;
  const shape = (['diamond', 'spire', 'split', 'arc'] as const)[forkSeed(runSeed, 'finale:sigil:shape') % 4];
  const rotation = (forkSeed(runSeed, 'finale:sigil:rotation') % 8) * Math.PI / 16;
  const nodeAngles = Array.from({ length: 4 }, (_, i) => i * Math.PI / 2 + Math.PI / 4 + ((forkSeed(runSeed, `finale:sigil:nodes:${i}`) % 5) - 2) * 0.045);
  return {
    id: forkSeed(runSeed, 'finale:sigil:id').toString(16).padStart(8, '0').slice(0, 4).toUpperCase(),
    shape, rotation, nodeAngles,
    orbitMarks: 4 + forkSeed(runSeed, 'finale:sigil:orbit') % 5,
    accent: accents[forkSeed(runSeed, 'finale:sigil:accent') % accents.length],
    lightFacet: light % 4, echoOffset: echo[0][0] % 5,
    balanceBars: 1 + balance % 3, celestialPoints: 3 + celestial % 4,
  };
}
