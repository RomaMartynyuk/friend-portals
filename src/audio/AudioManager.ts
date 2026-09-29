import { echoRunes, type RuneId } from '../portals/echo/echoConfig';
export type SoundCue = 'footstep' | 'portal-ambience' | 'portal-unlock' | 'interaction' | 'puzzle-success' | 'puzzle-failure' | 'shard-acquire' | 'final-completion' | 'crystal-rotate' | 'beam-connect' | 'seal-activate' | 'shard-materialize' | 'shard-claim' | 'echo-sequence-start' | 'echo-wrong' | 'echo-round-complete' | 'echo-complete' | 'echo-shard-materialize' | 'echo-shard-claim' | 'echo-portal-unlock' | 'balance-slide' | 'balance-blocked' | 'balance-under' | 'balance-over' | 'balance-plate' | 'balance-chain' | 'balance-bridge' | 'balance-complete' | 'balance-shard-materialize' | 'balance-shard-claim' | 'balance-portal-unlock' | 'celestial-ambience' | 'celestial-ring' | 'celestial-tick' | 'celestial-control' | 'celestial-lock' | 'celestial-perfect' | 'celestial-miss' | 'celestial-formation' | 'celestial-star' | 'celestial-shard-materialize' | 'celestial-shard-claim' | 'finale-awaken' | 'finale-light' | 'finale-echo' | 'finale-balance' | 'finale-celestial' | 'finale-sockets' | 'finale-transform' | 'finale-sigil';
const tones: Record<SoundCue, readonly [number, number, number]> = {
  footstep: [135, 105, 0.08], 'portal-ambience': [180, 220, 0.45], 'portal-unlock': [390, 780, 0.55],
  interaction: [410, 550, 0.17], 'puzzle-success': [550, 880, 0.42], 'puzzle-failure': [220, 170, 0.25],
  'shard-acquire': [670, 1010, 0.5], 'final-completion': [740, 1120, 0.7],
  'crystal-rotate': [330, 500, 0.24], 'beam-connect': [520, 690, 0.19], 'seal-activate': [610, 830, 0.36],
  'shard-materialize': [680, 1010, 0.53], 'shard-claim': [520, 1180, 0.64],
  'echo-sequence-start': [196, 262, 0.31], 'echo-wrong': [233, 165, 0.35], 'echo-round-complete': [392, 587, 0.43],
  'echo-complete': [440, 880, 0.68], 'echo-shard-materialize': [523, 1047, 0.62], 'echo-shard-claim': [587, 1175, 0.68],
  'echo-portal-unlock': [349, 698, 0.56],
  'balance-slide': [145, 98, 0.24], 'balance-blocked': [120, 76, 0.18],
  'balance-under': [180, 145, 0.16], 'balance-over': [155, 105, 0.24], 'balance-plate': [230, 175, 0.32],
  'balance-chain': [360, 235, 0.43], 'balance-bridge': [190, 320, 0.54], 'balance-complete': [260, 520, 0.7],
  'balance-shard-materialize': [410, 790, 0.63], 'balance-shard-claim': [360, 950, 0.68],
  'balance-portal-unlock': [270, 610, 0.7],
  'celestial-ambience': [110, 135, 1.4], 'celestial-ring': [165, 145, 0.23], 'celestial-tick': [410, 325, 0.065],
  'celestial-control': [280, 405, 0.13], 'celestial-lock': [340, 600, 0.37], 'celestial-perfect': [450, 850, 0.52],
  'celestial-miss': [240, 155, 0.27], 'celestial-formation': [210, 520, 1.05], 'celestial-star': [520, 710, 0.28],
  'celestial-shard-materialize': [490, 940, 0.82], 'celestial-shard-claim': [550, 1130, 0.82],
  'finale-awaken': [160, 300, 0.6], 'finale-light': [600, 990, 0.55], 'finale-echo': [392, 784, 0.72],
  'finale-balance': [145, 340, 0.62], 'finale-celestial': [360, 860, 0.85], 'finale-sockets': [490, 760, 0.48],
  'finale-transform': [250, 650, 1.1], 'finale-sigil': [620, 1140, 1.25],
};
/** Original temporary procedural cues. No SDK sound is claimed or used. */
export class AudioManager {
  private context: AudioContext | null = null;
  private muted = false;
  private echoVoices = new Set<OscillatorNode>();
  private balanceVoices = new Set<OscillatorNode>();
  private celestialVoices = new Set<OscillatorNode>();
  private finaleVoices = new Set<OscillatorNode>();
  setMuted(value: boolean) { this.muted = value; if (value) { this.stopEcho(); this.stopBalance(); this.stopCelestial(); this.stopFinale(); } }
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
    sound.type = cue === 'balance-blocked' ? 'sawtooth' : cue.startsWith('balance-') || cue === 'crystal-rotate' || cue === 'celestial-ring' ? 'triangle' : 'sine';
    sound.frequency.setValueAtTime(start, now);
    sound.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.042, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    sound.connect(gain).connect(context.destination);
    if (cue.startsWith('echo-')) this.trackEcho(sound);
    if (cue.startsWith('balance-')) { this.balanceVoices.add(sound); sound.onended = () => this.balanceVoices.delete(sound); }
    if (cue.startsWith('celestial-')) { this.celestialVoices.add(sound); sound.onended = () => this.celestialVoices.delete(sound); }
    if (cue.startsWith('finale-')) { this.finaleVoices.add(sound); sound.onended = () => this.finaleVoices.delete(sound); }
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
  stopBalance() { for (const voice of this.balanceVoices) { try { voice.stop(); } catch { /* Already ended. */ } } this.balanceVoices.clear(); }
  stopCelestial() { for (const voice of this.celestialVoices) { try { voice.stop(); } catch { /* Already ended. */ } } this.celestialVoices.clear(); }
  stopFinale() { for (const voice of this.finaleVoices) { try { voice.stop(); } catch { /* Already ended. */ } } this.finaleVoices.clear(); }
  celestialVoiceCount() { return this.celestialVoices.size; }
  dispose() { this.stopEcho(); this.stopBalance(); this.stopCelestial(); this.stopFinale(); void this.context?.close(); this.context = null; }
}
