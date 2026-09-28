import { echoSequences, type RuneId } from './echoConfig';
export type EchoEvent = Readonly<{ rune: RuneId; atMs: number; offMs: number }>;
export function echoPlayback(round: 0 | 1 | 2): Readonly<{ events: readonly EchoEvent[]; inputAtMs: number }> {
  const events = echoSequences[round].map((rune, index) => ({ rune, atMs: 620 + index * 790, offMs: 1080 + index * 790 }));
  return { events, inputAtMs: 620 + events.length * 790 + 50 };
}
