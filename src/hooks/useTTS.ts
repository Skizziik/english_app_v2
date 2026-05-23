import { useCallback, useRef } from 'react';
import { useSettings } from '@/stores/settingsStore';

let currentAudio: HTMLAudioElement | null = null;

function stopAll() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = '';
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  try {
    window.api.tts.stop();
  } catch {
    // ignore
  }
}

async function playBase64Mp3(base64: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const url = `data:audio/mpeg;base64,${base64}`;
      const audio = new Audio(url);
      currentAudio = audio;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('audio decode failed'));
      audio.play().catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

export function useTTS() {
  const settings = useSettings();
  const provider = settings.ttsProvider ?? 'macos_say';
  const voice = settings.preferredVoice;
  const rate = settings.voiceRate;
  const voxtralVoiceId = settings.voxtralVoiceId;
  const inflightRef = useRef<Promise<void> | null>(null);

  const speak = useCallback(
    async (text: string, opts?: { voice?: string; rate?: number; provider?: 'voxtral' | 'macos_say' | 'web_speech' }) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      stopAll();
      const usingProvider = opts?.provider ?? provider;

      const run = async () => {
        if (usingProvider === 'voxtral') {
          try {
            const b64 = (await window.api.mistral.tts({
              text: trimmed,
              voiceId: voxtralVoiceId ?? undefined,
            })) as string;
            await playBase64Mp3(b64);
            return;
          } catch (err) {
            console.warn('[tts] voxtral failed, falling back to say', err);
          }
        }

        if (usingProvider === 'macos_say' || usingProvider === 'voxtral') {
          try {
            await window.api.tts.speak({
              text: trimmed,
              voice: opts?.voice ?? voice,
              rate: opts?.rate ?? rate,
            });
            return;
          } catch (err) {
            console.warn('[tts] macOS say failed, falling back to Web Speech', err);
          }
        }

        if ('speechSynthesis' in window) {
          const utt = new SpeechSynthesisUtterance(trimmed);
          utt.lang = 'en-US';
          utt.rate = (opts?.rate ?? rate) / 200;
          window.speechSynthesis.speak(utt);
        }
      };

      const p = run();
      inflightRef.current = p;
      await p;
    },
    [provider, voice, rate, voxtralVoiceId],
  );

  const stop = useCallback(() => {
    stopAll();
  }, []);

  return { speak, stop };
}
