import { useCallback } from 'react';
import { useSettings } from '@/stores/settingsStore';

export function useTTS() {
  const voice = useSettings((s) => s.preferredVoice);
  const rate = useSettings((s) => s.voiceRate);
  const useMacSay = useSettings((s) => s.useMacSay);

  const speak = useCallback(
    async (text: string, opts?: { voice?: string; rate?: number }) => {
      const v = opts?.voice ?? voice;
      const r = opts?.rate ?? rate;
      if (useMacSay) {
        try {
          await window.api.tts.speak({ text, voice: v, rate: r });
          return;
        } catch (err) {
          console.warn('[tts] macOS say failed, falling back to Web Speech', err);
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'en-US';
        utt.rate = r / 200;
        window.speechSynthesis.speak(utt);
      }
    },
    [voice, rate, useMacSay],
  );

  const stop = useCallback(async () => {
    try {
      await window.api.tts.stop();
    } catch {
      // ignore
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}
