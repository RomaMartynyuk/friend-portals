import { echoSequences, type RuneId } from './echoConfig';
export type EchoPhase = 'waiting' | 'playback' | 'input' | 'retry' | 'round-complete' | 'finale' | 'shard-ready' | 'claimed';
export type EchoPuzzleState = Readonly<{ completedRounds: 0 | 1 | 2 | 3; round: 0 | 1 | 2; inputIndex: number; phase: EchoPhase }>;
export const initialEchoPuzzle: EchoPuzzleState = { completedRounds: 0, round: 0, inputIndex: 0, phase: 'waiting' };
export function prepareEchoEntry(echo: EchoPuzzleState): EchoPuzzleState {
  if (echo.phase === 'claimed' || echo.phase === 'shard-ready' || echo.completedRounds === 3) return echo;
  return { ...echo, round: echo.completedRounds as 0 | 1 | 2, inputIndex: 0, phase: 'playback' };
}
export function pauseEchoForExit(echo: EchoPuzzleState): EchoPuzzleState {
  if (echo.phase === 'claimed' || echo.phase === 'shard-ready' || echo.completedRounds === 3) return echo;
  return { ...echo, inputIndex: 0, phase: 'waiting' };
}
export function allowEchoInput(echo: EchoPuzzleState): EchoPuzzleState {
  return echo.phase === 'playback' ? { ...echo, phase: 'input', inputIndex: 0 } : echo;
}
export type EchoStepResult = Readonly<{ next: EchoPuzzleState; verdict: 'ignored' | 'correct' | 'wrong' | 'round-complete' | 'finale' }>;
export function submitEchoRune(echo: EchoPuzzleState, rune: RuneId): EchoStepResult {
  if (echo.phase !== 'input') return { next: echo, verdict: 'ignored' };
  const sequence = echoSequences[echo.round];
  if (rune !== sequence[echo.inputIndex]) return { next: { ...echo, inputIndex: 0, phase: 'retry' }, verdict: 'wrong' };
  const inputIndex = echo.inputIndex + 1;
  if (inputIndex < sequence.length) return { next: { ...echo, inputIndex }, verdict: 'correct' };
  const completedRounds = (echo.round + 1) as 1 | 2 | 3;
  return completedRounds === 3
    ? { next: { ...echo, completedRounds, inputIndex, phase: 'finale' }, verdict: 'finale' }
    : { next: { ...echo, completedRounds, inputIndex, phase: 'round-complete' }, verdict: 'round-complete' };
}
export function restartEchoRound(echo: EchoPuzzleState): EchoPuzzleState {
  return echo.phase === 'retry' ? { ...echo, inputIndex: 0, phase: 'playback' } : echo;
}
export function beginNextEchoRound(echo: EchoPuzzleState): EchoPuzzleState {
  return echo.phase === 'round-complete' && echo.completedRounds < 3
    ? { ...echo, round: echo.completedRounds as 0 | 1 | 2, inputIndex: 0, phase: 'playback' } : echo;
}
export function revealEchoShard(echo: EchoPuzzleState): EchoPuzzleState {
  return echo.phase === 'finale' ? { ...echo, phase: 'shard-ready' } : echo;
}
