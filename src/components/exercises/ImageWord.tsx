import { useMemo, useState } from 'react';
import { ExerciseShell } from './ExerciseShell';
import { pickRandom, shuffle, cn } from '@/lib/utils';
import { SpeakButton } from '@/components/SpeakButton';
import type { ExerciseProps } from './types';

const EMOJI_MAP: Record<string, string> = {
  dog: '🐕', cat: '🐈', fish: '🐟', house: '🏠', car: '🚗', tree: '🌳', flower: '🌸', sun: '☀️',
  moon: '🌙', sky: '☁️', bread: '🍞', milk: '🥛', tea: '🍵', coffee: '☕', apple: '🍎', egg: '🥚',
  meat: '🥩', rice: '🍚', soup: '🍲', water: '💧', book: '📖', pen: '🖊️', phone: '📱',
  table: '🪑', chair: '🪑', bed: '🛏️', door: '🚪', window: '🪟', school: '🏫', shop: '🏪',
  city: '🏙️', street: '🛣️', train: '🚆', bus: '🚌', plane: '✈️', mother: '👩', father: '👨',
  brother: '👦', sister: '👧', son: '👦', daughter: '👧', friend: '👫', boy: '👦', girl: '👧',
  man: '👨', woman: '👩', happy: '😊', sad: '😢', hot: '🔥', cold: '❄️',
};

function emojiFor(en: string): string {
  return EMOJI_MAP[en.toLowerCase()] ?? '🔤';
}

export function ImageWord({ word, pool, onResult, onContinue }: ExerciseProps) {
  const choices = useMemo(() => {
    const distractors = pickRandom(pool.filter((p) => p.id !== word.id), 3);
    return shuffle([word, ...distractors]);
  }, [word.id]);
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  return (
    <ExerciseShell
      title="Выбери картинку"
      prompt={
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="text-3xl font-bold">{word.english}</div>
            <SpeakButton text={word.english} />
          </div>
          {word.ipa && <div className="text-ink-400 text-sm mt-1">{word.ipa}</div>}
        </div>
      }
      feedback={done ? { correct: pickedId === word.id, message: pickedId !== word.id ? `Правильно: ${word.russian}` : '' } : null}
      showContinue={done}
      onContinue={onContinue}
    >
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {choices.map((c) => {
          const isCorrect = c.id === word.id;
          const isPicked = c.id === pickedId;
          return (
            <button
              key={c.id}
              disabled={done}
              onClick={() => {
                if (done) return;
                setPickedId(c.id);
                setDone(true);
                onResult(isCorrect, c.english);
              }}
              className={cn(
                'p-6 rounded-xl border-2 transition flex flex-col items-center gap-2',
                done && isCorrect && 'border-green-500 bg-green-500/15',
                done && isPicked && !isCorrect && 'border-red-500 bg-red-500/15',
                !done && 'border-ink-800 hover:border-brand-500 hover:bg-brand-500/10',
              )}
            >
              <div className="text-6xl">{emojiFor(c.english)}</div>
              {done && <div className="text-xs text-ink-400">{c.russian}</div>}
            </button>
          );
        })}
      </div>
    </ExerciseShell>
  );
}
