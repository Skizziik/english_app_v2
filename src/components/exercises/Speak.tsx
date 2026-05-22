import { useEffect, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { ExerciseShell } from './ExerciseShell';
import { SpeakButton } from '@/components/SpeakButton';
import { useSTT } from '@/hooks/useSTT';
import { similarity } from '@/lib/utils';
import type { ExerciseProps } from './types';

export function Speak({ word, onResult, onContinue }: ExerciseProps) {
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState<number>(0);
  const stt = useSTT();

  useEffect(() => {
    if (stt.transcript) {
      const s = similarity(stt.transcript, word.english);
      setScore(s);
      const ok = s >= 0.85;
      setCorrect(ok);
      setDone(true);
      onResult(ok, stt.transcript);
    }
  }, [stt.transcript]);

  if (!stt.supported) {
    return (
      <ExerciseShell
        title="Произнеси"
        prompt={
          <div className="text-center text-ink-400">
            Распознавание речи не поддерживается. Пропусти упражнение.
          </div>
        }
        feedback={null}
        showContinue
        onContinue={() => {
          onResult(true, '');
          onContinue();
        }}
        continueLabel="Пропустить"
      >
        <div />
      </ExerciseShell>
    );
  }

  return (
    <ExerciseShell
      title="Произнеси слово"
      prompt={
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-4xl font-bold">{word.english}</div>
            <SpeakButton text={word.english} />
          </div>
          {word.ipa && <div className="text-ink-400 text-sm">{word.ipa}</div>}
        </div>
      }
      feedback={done ? { correct, message: !correct ? `Услышал: ${stt.transcript}` : `Совпадение ${Math.round(score * 100)}%` } : null}
      showContinue={done}
      onContinue={onContinue}
    >
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => (stt.listening ? stt.stop() : stt.start())}
          disabled={done}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition ${
            stt.listening ? 'bg-red-500/30 animate-pulse' : 'bg-brand-500/20 hover:bg-brand-500/30'
          }`}
        >
          {stt.listening ? <MicOff size={36} /> : <Mic size={36} />}
        </button>
        <div className="text-sm text-ink-400">
          {stt.listening ? 'Говори...' : 'Нажми и произнеси'}
        </div>
        {stt.transcript && <div className="text-lg">{stt.transcript}</div>}
        {stt.error && <div className="text-xs text-red-400">{stt.error}</div>}
      </div>
    </ExerciseShell>
  );
}
