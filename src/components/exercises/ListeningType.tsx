import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { ExerciseShell } from './ExerciseShell';
import { useTTS } from '@/hooks/useTTS';
import { answersMatch, similarity } from '@/lib/utils';
import type { ExerciseProps } from './types';

export function ListeningType({ word, onResult, onContinue }: ExerciseProps) {
  const { speak } = useTTS();
  const [value, setValue] = useState('');
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(false);

  useEffect(() => {
    speak(word.english);
  }, [word.id]);

  function submit() {
    if (done) return;
    const ok = answersMatch(value, word.english) || similarity(value, word.english) >= 0.9;
    setCorrect(ok);
    setDone(true);
    onResult(ok, value);
  }

  return (
    <ExerciseShell
      title="Послушай и напечатай"
      prompt={
        <div className="text-center">
          <button
            onClick={() => speak(word.english)}
            className="w-20 h-20 mx-auto rounded-full bg-brand-500/20 hover:bg-brand-500/30 flex items-center justify-center text-brand-200 active:scale-95 transition"
          >
            <Volume2 size={32} />
          </button>
          <div className="mt-2 text-sm text-ink-400">Слушать ещё раз</div>
        </div>
      }
      feedback={done ? { correct, message: !correct ? `Правильно: ${word.english}` : '' } : null}
      showContinue={done}
      onContinue={onContinue}
    >
      <div className="max-w-md mx-auto">
        <input
          autoFocus
          disabled={done}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="То что услышал..."
          className="w-full px-4 py-3 rounded-xl bg-ink-900 border-2 border-ink-700 focus:border-brand-500 outline-none text-lg text-center"
        />
        {!done && (
          <button className="btn btn-primary mt-4 w-full" onClick={submit} disabled={!value.trim()}>
            Проверить
          </button>
        )}
      </div>
    </ExerciseShell>
  );
}
