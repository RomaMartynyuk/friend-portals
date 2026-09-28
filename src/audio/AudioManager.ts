export type SoundCue = 'footstep' | 'portal-ambience' | 'portal-unlock' | 'interaction' | 'puzzle-success' | 'puzzle-failure' | 'shard-acquire' | 'final-completion';
export class AudioManager {
  private context: AudioContext | null = null;
  private muted = true;
  setMuted(value: boolean) { this.muted = value; }
  isMuted() { return this.muted; }
  play(cue: SoundCue) {
    if (this.muted || !('AudioContext' in window)) return;
    this.context ??= new AudioContext();
    void this.context.resume();
    const sound = this.context.createOscillator();
    const gain = this.context.createGain();
    const tone = cue === 'portal-unlock' ? 520 : cue === 'puzzle-failure' ? 180 : cue === 'final-completion' ? 740 : 430;
    sound.type = 'sine'; sound.frequency.setValueAtTime(tone, this.context.currentTime);
    sound.frequency.exponentialRampToValueAtTime(tone * 1.4, this.context.currentTime + 0.16);
    gain.gain.setValueAtTime(0.035, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.23);
    sound.connect(gain).connect(this.context.destination);
    sound.start(); sound.stop(this.context.currentTime + 0.24);
  }
  dispose() { void this.context?.close(); this.context = null; }
}
