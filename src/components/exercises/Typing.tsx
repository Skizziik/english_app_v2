import { useState } from 'react';
import { ExerciseShell } from './ExerciseShell';
import { answersMatch, similarity } from '@/lib/utils';
import { SpeakButton } from '@/components/SpeakButton';
import type { ExerciseProps } from './types';

export function Typing({ word, onResult, onContinue }: ExerciseProps) {
  const [value, setValue] = useState('');
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(false);

  function submit() {
    if (done) return;
    const isExact = answersMatch(value, word.english);
    const sim = similarity(value, word.english);
    const ok = isExact || sim >= 0.9;
    setCorrect(ok);
    setDone(true);
    onResult(ok, value);
  }

  return (
    <ExerciseShell
      title="Напечатай перевод по-английски"
      prompt={
        <div className="text-center">
          <div className="text-3xl font-bold">{word.russian}</div>
          {word.partOfSpeech && <div className="text-xs text-ink-500 mt-1">{word.partOfSpeech}</div>}
        </div>
      }
      feedback={done ? { correct, message: !correct ? `Правильно: ${word.english}` : '' } : null}
      showContinue={done}
      onContinue={onContinue}
    >
      <div className="max-w-md mx-auto">
        <div className="flex gap-2">
          <input
            autoFocus
            disabled={done}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Английский..."
            className="flex-1 px-4 py-3 rounded-xl bg-ink-900 border-2 border-ink-700 focus:border-brand-500 outline-none text-lg"
          />
          {done && <SpeakButton text={word.english} />}
        </div>
        {!done && (
          <button className="btn btn-primary mt-4 w-full" onClick={submit} disabled={!value.trim()}>
            Проверить
          </button>
        )}
      </div>
    </ExerciseShell>
  );
}
