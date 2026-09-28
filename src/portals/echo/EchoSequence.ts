import type { RuneId } from './echoConfig';
import type { EchoPuzzleState } from './EchoPuzzleState';
export type EchoEvent = Readonly<{ rune: RuneId; atMs: number; offMs: number }>;
export function echoPlayback(echo: EchoPuzzleState): Readonly<{ events: readonly EchoEvent[]; inputAtMs: number }> {
  const events = echo.sequences[echo.round].map((rune, index) => ({ rune, atMs: 620 + index * 790, offMs: 1080 + index * 790 }));
  return { events, inputAtMs: 620 + events.length * 790 + 50 };
}
