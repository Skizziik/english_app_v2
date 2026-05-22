import { useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { ExerciseShell } from './ExerciseShell';
import { useTTS } from '@/hooks/useTTS';
import { pickRandom, shuffle, cn } from '@/lib/utils';
import type { ExerciseProps } from './types';

export function ListeningMC({ word, pool, onResult, onContinue }: ExerciseProps) {
  const { speak } = useTTS();
  const options = useMemo(() => {
    const distractors = pickRandom(pool.filter((p) => p.id !== word.id), 3).map((p) => p.english);
    return shuffle([word.english, ...distractors]);
  }, [word.id]);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    speak(word.english);
  }, [word.id]);

  return (
    <ExerciseShell
      title="Что ты услышал?"
      prompt={
        <button
          onClick={() => speak(word.english)}
          className="mx-auto w-20 h-20 rounded-full bg-brand-500/20 hover:bg-brand-500/30 flex items-center justify-center text-brand-200 active:scale-95 transition"
        >
          <Volume2 size={32} />
        </button>
      }
      feedback={done ? { correct: picked === word.english, message: picked !== word.english ? `Правильно: ${word.english}` : '' } : null}
      showContinue={done}
      onContinue={onContinue}
    >
      <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
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
                'p-4 rounded-xl border-2 text-left transition',
                done && isCorrect && 'border-green-500 bg-green-500/15',
                done && isPicked && !isCorrect && 'border-red-500 bg-red-500/15',
                !done && 'border-ink-800 hover:border-brand-500 hover:bg-brand-500/10',
              )}
            >
              <span className="text-lg font-semibold">{opt}</span>
            </button>
          );
        })}
      </div>
    </ExerciseShell>
  );
}
