import { useEffect, useMemo, useState } from 'react';
import { ExerciseShell } from './ExerciseShell';
import { pickRandom, shuffle, cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';
import { useSettings } from '@/stores/settingsStore';
import type { ExerciseProps } from './types';

function makeBlank(word: any): { sentence: string; target: string } {
  const sentence: string = word.exampleEn ?? word.english;
  const target = word.english;
  const regex = new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  if (regex.test(sentence)) {
    return { sentence: sentence.replace(regex, '____'), target };
  }
  return { sentence: `____ ${sentence.split(' ').slice(1).join(' ')}`, target: sentence.split(' ')[0] };
}

export function FillBlank({ word, pool, onResult, onContinue }: ExerciseProps) {
  const { sentence, target } = useMemo(() => makeBlank(word), [word.id]);
  const options = useMemo(() => {
    const distractors = pickRandom(pool.filter((p) => p.id !== word.id), 3).map((p) => p.english);
    return shuffle([target, ...distractors]);
  }, [word.id]);

  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const autoPlay = useSettings((s) => s.autoPlayAudio);
  const { speak } = useTTS();

  useEffect(() => {
    if (autoPlay && word.exampleEn) speak(word.exampleEn).catch(() => {});
  }, [word.id]);

  return (
    <ExerciseShell
      title="Заполни пропуск"
      prompt={
        <div className="text-center">
          <div className="text-2xl font-bold">{sentence}</div>
          <div className="text-sm text-ink-400 mt-2">{word.exampleRu ?? word.russian}</div>
        </div>
      }
      feedback={done ? { correct: picked === target, message: picked !== target ? `Правильно: ${target}` : '' } : null}
      showContinue={done}
      onContinue={onContinue}
    >
      <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
        {options.map((opt) => {
          const isCorrect = opt === target;
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
                'p-4 rounded-xl border-2 transition',
                done && isCorrect && 'border-green-500 bg-green-500/15',
                done && isPicked && !isCorrect && 'border-red-500 bg-red-500/15',
                !done && 'border-ink-800 hover:border-brand-500 hover:bg-brand-500/10',
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </ExerciseShell>
  );
}
