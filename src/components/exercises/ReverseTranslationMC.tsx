import { useMemo, useState } from 'react';
import { ExerciseShell } from './ExerciseShell';
import { pickRandom, shuffle, cn } from '@/lib/utils';
import { SpeakButton } from '@/components/SpeakButton';
import type { ExerciseProps } from './types';

export function ReverseTranslationMC({ word, pool, onResult, onContinue }: ExerciseProps) {
  const options = useMemo(() => {
    const distractors = pickRandom(pool.filter((p) => p.id !== word.id), 3).map((p) => p.english);
    return shuffle([word.english, ...distractors]);
  }, [word.id]);

  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <ExerciseShell
      title="Выбери английский перевод"
      prompt={<div className="text-center text-4xl font-bold">{word.russian}</div>}
      feedback={done ? { correct: picked === word.english, message: picked !== word.english ? `Правильно: ${word.english}` : '' } : null}
      showContinue={done}
      onContinue={onContinue}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
        {options.map((opt) => {
          const isCorrect = opt === word.english;
          const isPicked = opt === picked;
          return (
            <button
              key={opt}
              disabled={done}
              onClick={() => {
                if (done) return;
                setPicked(opt);
                setDone(true);
                onResult(isCorrect, opt);
              }}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition flex items-center justify-between',
                done && isCorrect && 'border-green-500 bg-green-500/15',
                done && isPicked && !isCorrect && 'border-red-500 bg-red-500/15',
                !done && 'border-ink-800 hover:border-brand-500 hover:bg-brand-500/10',
              )}
            >
              <span className="text-lg font-semibold">{opt}</span>
              {done && isCorrect && <SpeakButton text={opt} size="sm" />}
            </button>
          );
        })}
      </div>
    </ExerciseShell>
  );
}
