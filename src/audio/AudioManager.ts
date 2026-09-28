import { echoRunes, type RuneId } from '../portals/echo/echoConfig';
export type SoundCue = 'footstep' | 'portal-ambience' | 'portal-unlock' | 'interaction' | 'puzzle-success' | 'puzzle-failure' | 'shard-acquire' | 'final-completion' | 'crystal-rotate' | 'beam-connect' | 'seal-activate' | 'shard-materialize' | 'shard-claim' | 'echo-sequence-start' | 'echo-wrong' | 'echo-round-complete' | 'echo-complete' | 'echo-shard-materialize' | 'echo-shard-claim' | 'echo-portal-unlock';
const tones: Record<SoundCue, readonly [number, number, number]> = {
  footstep: [135, 105, 0.08], 'portal-ambience': [180, 220, 0.45], 'portal-unlock': [390, 780, 0.55],
  interaction: [410, 550, 0.17], 'puzzle-success': [550, 880, 0.42], 'puzzle-failure': [220, 170, 0.25],
  'shard-acquire': [670, 1010, 0.5], 'final-completion': [740, 1120, 0.7],
  'crystal-rotate': [330, 500, 0.24], 'beam-connect': [520, 690, 0.19], 'seal-activate': [610, 830, 0.36],
  'shard-materialize': [680, 1010, 0.53], 'shard-claim': [520, 1180, 0.64],
  'echo-sequence-start': [196, 262, 0.31], 'echo-wrong': [233, 165, 0.35], 'echo-round-complete': [392, 587, 0.43],
  'echo-complete': [440, 880, 0.68], 'echo-shard-materialize': [523, 1047, 0.62], 'echo-shard-claim': [587, 1175, 0.68],
  'echo-portal-unlock': [349, 698, 0.56],
};
/** Original temporary procedural cues. No SDK sound is claimed or used. */
export class AudioManager {
  private context: AudioContext | null = null;
  private muted = false;
  private echoVoices = new Set<OscillatorNode>();
  setMuted(value: boolean) { this.muted = value; if (value) this.stopEcho(); }
  isMuted() { return this.muted; }
  private getContext() {
    if (this.muted || !('AudioContext' in window)) return null;
    this.context ??= new AudioContext();
    void this.context.resume();
    return this.context;
  }
  private trackEcho(sound: OscillatorNode) {
    this.echoVoices.add(sound);
    sound.onended = () => this.echoVoices.delete(sound);
  }
  play(cue: SoundCue) {
    const context = this.getContext(); if (!context) return;
    const [start, end, duration] = tones[cue], now = context.currentTime;
    const sound = context.createOscillator(), gain = context.createGain();
    sound.type = cue === 'crystal-rotate' ? 'triangle' : 'sine';
    sound.frequency.setValueAtTime(start, now);
    sound.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.042, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    sound.connect(gain).connect(context.destination);
    if (cue.startsWith('echo-')) this.trackEcho(sound);
    sound.start(now); sound.stop(now + duration + 0.01);
  }
  playEchoRune(rune: RuneId) {
    const context = this.getContext(); if (!context) return;
    const now = context.currentTime, pitch = echoRunes[rune].pitch;
    for (const [multiple, volume] of [[1, 0.052], [2, 0.012]] as const) {
      const tone = context.createOscillator(), gain = context.createGain();
      tone.type = 'sine'; tone.frequency.setValueAtTime(pitch * multiple, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
      tone.connect(gain).connect(context.destination);
      this.trackEcho(tone); tone.start(now); tone.stop(now + 0.53);
    }
  }
  stopEcho() {
    for (const voice of this.echoVoices) { try { voice.stop(); } catch { /* Already ended. */ } }
    this.echoVoices.clear();
  }
  dispose() { this.stopEcho(); void this.context?.close(); this.context = null; }
}
