export type SoundCue = 'footstep' | 'portal-ambience' | 'portal-unlock' | 'interaction' | 'puzzle-success' | 'puzzle-failure' | 'shard-acquire' | 'final-completion' | 'crystal-rotate' | 'beam-connect' | 'seal-activate' | 'shard-materialize' | 'shard-claim';
const tones: Record<SoundCue, readonly [number, number, number]> = {
  footstep: [135, 105, 0.08], 'portal-ambience': [180, 220, 0.45], 'portal-unlock': [390, 780, 0.55],
  interaction: [410, 550, 0.17], 'puzzle-success': [550, 880, 0.42], 'puzzle-failure': [220, 170, 0.25],
  'shard-acquire': [670, 1010, 0.5], 'final-completion': [740, 1120, 0.7],
  'crystal-rotate': [330, 500, 0.24], 'beam-connect': [520, 690, 0.19], 'seal-activate': [610, 830, 0.36],
  'shard-materialize': [680, 1010, 0.53], 'shard-claim': [520, 1180, 0.64],
};
/** Original temporary procedural cues. No SDK sound is claimed or used. */
export class AudioManager {
  private context: AudioContext | null = null;
  private muted = true;
  setMuted(value: boolean) { this.muted = value; }
  isMuted() { return this.muted; }
  play(cue: SoundCue) {
    if (this.muted || !('AudioContext' in window)) return;
    this.context ??= new AudioContext();
    void this.context.resume();
    const [start, end, duration] = tones[cue];
    const now = this.context.currentTime;
    const sound = this.context.createOscillator();
    const gain = this.context.createGain();
    sound.type = cue === 'crystal-rotate' ? 'triangle' : 'sine';
    sound.frequency.setValueAtTime(start, now);
    sound.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    sound.connect(gain).connect(this.context.destination);
    sound.start(now); sound.stop(now + duration + 0.01);
  }
  dispose() { void this.context?.close(); this.context = null; }
}
