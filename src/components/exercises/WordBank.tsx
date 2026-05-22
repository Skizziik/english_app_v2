import { useMemo, useState } from 'react';
import { ExerciseShell } from './ExerciseShell';
import { shuffle, answersMatch } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ExerciseProps } from './types';

function buildSentence(word: any): { en: string; ru: string } {
  if (word.exampleEn && word.exampleRu) return { en: word.exampleEn, ru: word.exampleRu };
  return { en: word.english, ru: word.russian };
}

export function WordBank({ word, pool, onResult, onContinue }: ExerciseProps) {
  const { en, ru } = useMemo(() => buildSentence(word), [word.id]);
  const targetTokens = useMemo(() => en.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean), [en]);
  const distractorBank = useMemo(() => {
    const extras = shuffle(pool.filter((p) => p.id !== word.id))
      .slice(0, 4)
      .map((p) => p.english.split(/\s+/)[0]);
    return shuffle([...targetTokens, ...extras]);
  }, [word.id]);

  const [picked, setPicked] = useState<string[]>([]);
  const [bank, setBank] = useState<string[]>(distractorBank);
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(false);

  function pick(token: string, idx: number) {
    if (done) return;
    setPicked([...picked, token]);
    setBank(bank.filter((_, i) => i !== idx));
  }
  function unpick(idx: number) {
    if (done) return;
    const tok = picked[idx];
    setPicked(picked.filter((_, i) => i !== idx));
    setBank([...bank, tok]);
  }

  function submit() {
    const userSentence = picked.join(' ');
    const ok = answersMatch(userSentence, en) || answersMatch(userSentence.replace(/[^a-z\s]/gi, ''), en.replace(/[^a-z\s]/gi, ''));
    setCorrect(ok);
    setDone(true);
    onResult(ok, userSentence);
  }

  return (
    <ExerciseShell
      title="Собери предложение"
      prompt={<div className="text-center text-2xl font-bold">{ru}</div>}
      feedback={done ? { correct, message: !correct ? `Правильно: ${en}` : '' } : null}
      showContinue={done}
      onContinue={onContinue}
    >
      <div className="max-w-xl mx-auto">
        <div className="min-h-[80px] p-3 border-2 border-dashed border-ink-700 rounded-xl flex flex-wrap gap-2 mb-4">
          {picked.map((tok, i) => (
            <button
              key={i}
              onClick={() => unpick(i)}
              className="px-3 py-2 rounded-lg bg-brand-500/20 border border-brand-500 text-brand-100 font-semibold"
            >
              {tok}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {bank.map((tok, i) => (
            <button
              key={i}
              onClick={() => pick(tok, i)}
              className="px-3 py-2 rounded-lg bg-ink-800 hover:bg-ink-700 border border-ink-700 font-semibold"
            >
              {tok}
            </button>
          ))}
        </div>
        {!done && (
          <button className="btn btn-primary w-full" disabled={picked.length === 0} onClick={submit}>
            Проверить
          </button>
        )}
      </div>
    </ExerciseShell>
  );
}
