// Audio utility for Georgian Assistant (PCM 24kHz playback + Web Speech API fallback + SFX)

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Convert base64 raw PCM (16-bit signed, mono, 24000Hz) to AudioBuffer
export async function playPcmBase64(base64Data: string, sampleRate = 24000): Promise<void> {
  try {
    const ctx = getAudioContext();
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const buffer = ctx.createBuffer(1, float32Array.length, sampleRate);
    buffer.copyToChannel(float32Array, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    return new Promise((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  } catch (err) {
    console.warn("PCM playback error:", err);
  }
}

// Check if the user's OS / browser actually has a native Georgian voice installed
export function hasGenuineGeorgianVoice(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  return voices.some(
    (v) =>
      v.lang.toLowerCase().startsWith('ka') ||
      v.lang.toLowerCase().includes('georgian') ||
      v.name.toLowerCase().includes('georgian')
  );
}

// Browser Web Speech API fallback for Georgian
// CRITICAL: NEVER allow an English or foreign voice to read Georgian text.
export function speakGeorgianFallback(text: string, onEnd?: () => void): boolean {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const voices = window.speechSynthesis.getVoices();
  const georgianVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith('ka') ||
      v.lang.toLowerCase().includes('georgian') ||
      v.name.toLowerCase().includes('georgian')
  );

  // If no genuine Georgian voice exists, COMPLETELY DISABLE speech synthesis.
  // Do NOT speak with default English/foreign voices.
  if (!georgianVoice) {
    if (onEnd) onEnd();
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = georgianVoice;
  utterance.lang = georgianVoice.lang || 'ka-GE';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn("Speech synthesis notice:", e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

// Synthesize pleasant ambient sound effects (chime, action whoosh, success twinkle, pop, blip)
export function playSoundEffect(type: 'whoosh' | 'chime' | 'success' | 'click' | 'listen' | 'pop' | 'type') {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'whoosh') {
      // Helper creature flying sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.25);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'chime' || type === 'success') {
      // Sparkle/completed task
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0.09, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.4);
      });
    } else if (type === 'listen') {
      // Mic activation ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'pop') {
      // Speech bubble appear pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'type') {
      // Very subtle typewriter tick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
      osc.start(now);
      osc.stop(now + 0.02);
    }
  } catch (e) {
    // Ignore audio context autoplay restriction
  }
}

