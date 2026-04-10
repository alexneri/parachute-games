// lib/audio/synthesizer.ts
// Web Audio API sound synthesis — catch, miss, game-over jingle
// Spec: docs/architecture.md, T-3.1

export class AudioSynthesizer {
  private audioCtx: AudioContext | null = null;
  private muted = false;

  /** Must be called from a user-interaction event handler (first keydown/touchstart). */
  ensureContext(): void {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new AudioContext();
    } catch {
      // AudioContext blocked — silently disable sound
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Short 880Hz square wave blip (catch) */
  playCatch(): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /** 120Hz sawtooth buzz with pitch decay to 80Hz (miss) */
  playMiss(): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.3);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** Four-note descending arpeggio: 880→660→440→220Hz, ~250ms each */
  playGameOver(): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const notes = [880, 660, 440, 220];
    const noteDuration = 0.25;

    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * noteDuration;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + noteDuration);
    });
  }

  private getCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.audioCtx) return null;
    // Resume if suspended (browser may auto-suspend on inactivity)
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
    return this.audioCtx;
  }
}
