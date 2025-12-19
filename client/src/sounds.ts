// Sound effects for CodeMap Hotel using Web Audio API
// Tasteful, subtle sounds that aren't annoying

let audioContext: AudioContext | null = null;
let isMuted = localStorage.getItem('codemap-muted') === 'true';

export const getMuted = () => isMuted;

export const setMuted = (muted: boolean) => {
  isMuted = muted;
  localStorage.setItem('codemap-muted', muted ? 'true' : 'false');
};

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Soft click/tap for reads - short, gentle
export const playReadSound = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Audio not available
  }
};

// Soft chime for writes - slightly longer, warmer
export const playWriteSound = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Main tone
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
    oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.06); // E5

    // Harmony
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(659, ctx.currentTime); // E5
    oscillator2.frequency.setValueAtTime(784, ctx.currentTime + 0.06); // G5

    gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
    oscillator2.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Audio not available
  }
};

// Attention sound for waiting agents - gentle ping that repeats
let lastWaitingSoundTime = 0;
const WAITING_SOUND_INTERVAL = 3000; // Only play every 3 seconds max

export const playWaitingSound = () => {
  if (isMuted) return;
  const now = Date.now();
  if (now - lastWaitingSoundTime < WAITING_SOUND_INTERVAL) {
    return; // Throttle to avoid annoying repetition
  }
  lastWaitingSoundTime = now;

  try {
    const ctx = getAudioContext();

    // Two-note attention chime
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Rising two-note chime: "ding-ding"
    playNote(880, ctx.currentTime, 0.15);        // A5
    playNote(1047, ctx.currentTime + 0.12, 0.2); // C6
  } catch (e) {
    // Audio not available
  }
};

// Initialize audio context on first user interaction
export const initAudio = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }
};
