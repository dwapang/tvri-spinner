/**
 * WebAudio synthesized sound effects for wheel tick and win chime.
 * Self-contained, zero external asset files. Fails silently if blocked.
 */

let audioCtx: AudioContext | null = null;
let lastTickTime = 0;
const MIN_TICK_INTERVAL_SEC = 1 / 30; // Max ~30 ticks per second

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a tiny, crisp mechanical slice boundary click, volume scaled with impact speed.
 * Rate capped at ~30 ticks/second to prevent buzzing during high-speed spins.
 */
export function playTickSound(enabled: boolean, speedFraction = 1.0): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  if (now - lastTickTime < MIN_TICK_INTERVAL_SEC) {
    return;
  }
  lastTickTime = now;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    // Frequency sweep down to create crisp click
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.014);

    const volume = 0.015 + 0.035 * Math.max(0.1, Math.min(1.0, speedFraction));
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.015);
  } catch {
    // Fail silently
  }
}

/**
 * Plays a warm, soft celebratory chime upon winning.
 */
export function playWinSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  try {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      const noteStart = now + i * 0.08;
      const noteEnd = noteStart + 0.5;

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.linearRampToValueAtTime(0.06, noteStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteEnd);
    });
  } catch {
    // Fail silently
  }
}
