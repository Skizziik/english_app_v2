import { useEffect, useMemo, useState } from 'react';
import { ExerciseShell } from './ExerciseShell';
import { SpeakButton } from '@/components/SpeakButton';
import { pickRandom, shuffle, cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';
import { useSettings } from '@/stores/settingsStore';
import type { ExerciseProps } from './types';

export function TranslationMC({ word, pool, onResult, onContinue }: ExerciseProps) {
  const options = useMemo(() => {
    const distractors = pickRandom(pool.filter((p) => p.id !== word.id), 3).map((p) => p.russian);
    return shuffle([word.russian, ...distractors]);
  }, [word.id]);

  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const autoPlay = useSettings((s) => s.autoPlayAudio);
  const { speak } = useTTS();

  useEffect(() => {
    if (autoPlay) speak(word.english).catch(() => {});
  }, [word.id]);

  return (
    <ExerciseShell
      title="Выбери перевод"
      prompt={
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-4xl font-bold">{word.english}</div>
            <SpeakButton text={word.english} />
          </div>
          {word.ipa && <div className="text-ink-400 text-sm">{word.ipa}</div>}
        </div>
      }
      feedback={done ? { correct: picked === word.russian, message: picked !== word.russian ? `Правильно: ${word.russian}` : '' } : null}
      showContinue={done}
      onContinue={onContinue}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
        {options.map((opt) => {
          const isCorrect = opt === word.russian;
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
              <span className="text-lg">{opt}</span>
            </button>
          );
        })}
      </div>
    </ExerciseShell>
  );
}
