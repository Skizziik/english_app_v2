import { useCallback, useRef, useState } from 'react';

interface UseSTTReturn {
  start: () => void;
  stop: () => void;
  listening: boolean;
  transcript: string;
  error: string | null;
  supported: boolean;
}

export function useSTT(onResult?: (text: string) => void): UseSTTReturn {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  const supported = !!SR;

  const start = useCallback(() => {
    if (!supported) {
      setError('Speech Recognition не поддерживается');
      return;
    }
    setError(null);
    setTranscript('');
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript as string;
      setTranscript(text);
      onResult?.(text);
    };
    rec.onerror = (e: any) => {
      setError(e.error ?? 'unknown');
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.onstart = () => setListening(true);
    recRef.current = rec;
    try {
      rec.start();
    } catch (err: any) {
      setError(err?.message ?? 'failed to start');
      setListening(false);
    }
  }, [SR, supported, onResult]);

  const stop = useCallback(() => {
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  return { start, stop, listening, transcript, error, supported };
}
