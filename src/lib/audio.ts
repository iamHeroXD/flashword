// Flashword Web Audio API sound synthesizer
// Procedural audio with zero external audio assets required.
// Muted by default per specification.

class SoundEffects {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("flashword_sound_enabled");
        this.enabled = stored === "true";
      } catch {
        this.enabled = false;
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("flashword_sound_enabled", val ? "true" : "false");
      } catch {}
    }
    if (val && !this.ctx && typeof window !== "undefined") {
      this.initCtx();
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play a procedural tone
  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.15) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  public tick(high: boolean = false) {
    this.playTone(high ? 880 : 440, "sine", 0.08, 0.1);
  }

  public start() {
    if (!this.enabled) return;
    this.playTone(523.25, "sine", 0.12, 0.15);
    setTimeout(() => this.playTone(659.25, "sine", 0.12, 0.15), 100);
    setTimeout(() => this.playTone(783.99, "sine", 0.25, 0.2), 200);
  }

  public cardFlip() {
    this.playTone(320, "triangle", 0.06, 0.08);
  }

  public correct() {
    if (!this.enabled) return;
    this.playTone(587.33, "sine", 0.1, 0.15);
    setTimeout(() => this.playTone(880, "sine", 0.18, 0.2), 80);
  }

  public incorrect() {
    if (!this.enabled) return;
    this.playTone(180, "sawtooth", 0.15, 0.12);
  }

  public roundComplete() {
    if (!this.enabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, "triangle", 0.22, 0.15), idx * 110);
    });
  }

  public achievement() {
    if (!this.enabled) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, "sine", 0.35, 0.2), idx * 100);
    });
  }
}

export const sounds = new SoundEffects();
