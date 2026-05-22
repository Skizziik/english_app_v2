import { useEffect, useMemo, useState } from 'react';
import { ExerciseShell } from './ExerciseShell';
import { pickRandom, shuffle, cn } from '@/lib/utils';
import { SpeakButton } from '@/components/SpeakButton';
import type { ExerciseProps } from './types';

interface Pair {
  id: number;
  en: string;
  ru: string;
}

export function Matching({ word, pool, onResult, onContinue }: ExerciseProps) {
  const pairs: Pair[] = useMemo(() => {
    const others = pickRandom(pool.filter((p) => p.id !== word.id), 4);
    const all = [word, ...others];
    return all.map((w) => ({ id: w.id, en: w.english, ru: w.russian }));
  }, [word.id]);

  const [enOrder] = useState(() => shuffle(pairs.map((p) => ({ side: 'en' as const, id: p.id, text: p.en }))));
  const [ruOrder] = useState(() => shuffle(pairs.map((p) => ({ side: 'ru' as const, id: p.id, text: p.ru }))));
  const [selectedEn, setSelectedEn] = useState<number | null>(null);
  const [selectedRu, setSelectedRu] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (selectedEn !== null && selectedRu !== null) {
      if (selectedEn === selectedRu) {
        setMatched((prev) => new Set(prev).add(selectedEn));
      } else {
        setErrors((e) => e + 1);
      }
      setSelectedEn(null);
      setSelectedRu(null);
    }
  }, [selectedEn, selectedRu]);

  useEffect(() => {
    if (matched.size === pairs.length && !done) {
      const ok = errors === 0;
      setDone(true);
      setTimeout(() => onResult(ok, ''), 300);
    }
  }, [matched, done, errors, pairs.length]);

  return (
    <ExerciseShell
      title="Соедини пары"
      prompt={<div className="text-center text-ink-300">Кликни сначала по слову слева, потом по переводу</div>}
      feedback={done ? { correct: errors === 0, message: errors === 0 ? '' : `Ошибок: ${errors}` } : null}
      showContinue={done}
      onContinue={onContinue}
    >
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div className="flex flex-col gap-2">
          {enOrder.map((item) => {
            const isMatched = matched.has(item.id);
            const isSelected = selectedEn === item.id;
            return (
              <button
                key={'en-' + item.id}
                disabled={isMatched}
                onClick={() => setSelectedEn(item.id)}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition flex items-center justify-between',
                  isMatched
                    ? 'border-green-500/40 bg-green-900/20 text-ink-500 line-through'
                    : isSelected
                    ? 'border-brand-400 bg-brand-500/20'
                    : 'border-ink-800 hover:border-brand-500',
                )}
              >
                <span>{item.text}</span>
                {!isMatched && <SpeakButton text={item.text} size="sm" />}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {ruOrder.map((item) => {
            const isMatched = matched.has(item.id);
            const isSelected = selectedRu === item.id;
            return (
              <button
                key={'ru-' + item.id}
                disabled={isMatched}
                onClick={() => setSelectedRu(item.id)}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition',
                  isMatched
                    ? 'border-green-500/40 bg-green-900/20 text-ink-500 line-through'
                    : isSelected
                    ? 'border-brand-400 bg-brand-500/20'
                    : 'border-ink-800 hover:border-brand-500',
                )}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>
    </ExerciseShell>
  );
}
