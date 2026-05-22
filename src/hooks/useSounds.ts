import { useCallback } from 'react';
import { useSettings } from '@/stores/settingsStore';

type Sfx = 'correct' | 'wrong' | 'click' | 'complete' | 'streak';

const audioMap: Partial<Record<Sfx, HTMLAudioElement>> = {};

function ensureAudio(name: Sfx): HTMLAudioElement | null {
  if (audioMap[name]) return audioMap[name]!;
  const ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!ctx) return null;
  return null;
}

function beep(freq: number, duration = 0.12, type: OscillatorType = 'sine', volume = 0.05) {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
  } catch {
    // ignore
  }
}

export function useSounds() {
  const enabled = useSettings((s) => s.soundEffects);

  const play = useCallback(
    (sfx: Sfx) => {
      if (!enabled) return;
      switch (sfx) {
        case 'correct':
          beep(880, 0.1, 'sine', 0.05);
          setTimeout(() => beep(1320, 0.12, 'sine', 0.05), 70);
          break;
        case 'wrong':
          beep(220, 0.18, 'sawtooth', 0.05);
          break;
        case 'click':
          beep(660, 0.04, 'square', 0.025);
          break;
        case 'complete':
          beep(660, 0.1, 'sine', 0.06);
          setTimeout(() => beep(880, 0.1, 'sine', 0.06), 100);
          setTimeout(() => beep(1100, 0.18, 'sine', 0.06), 200);
          break;
        case 'streak':
          beep(440, 0.08, 'triangle', 0.05);
          setTimeout(() => beep(660, 0.08, 'triangle', 0.05), 80);
          setTimeout(() => beep(880, 0.16, 'triangle', 0.05), 160);
          break;
      }
    },
    [enabled],
  );

  return { play };
}
