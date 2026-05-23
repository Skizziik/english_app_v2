import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { EXERCISES } from '@/components/exercises';
import type { ExerciseKind } from '@/components/exercises/types';
import { Confetti } from '@/components/Confetti';
import { Mascot } from '@/components/layout/Mascot';
import { useUserStore } from '@/stores/userStore';
import { useSounds } from '@/hooks/useSounds';
import { toast } from 'sonner';
import type { Word } from '@/types';
import { shuffle } from '@/lib/utils';

interface ExerciseStep {
  kind: ExerciseKind;
  word: Word;
}

const DEFAULT_TYPES: ExerciseKind[] = ['TranslationMC', 'ReverseTranslationMC', 'Matching', 'Typing', 'ListeningMC'];

export default function Lesson() {
  const { id } = useParams();
  const lessonId = Number(id);
  const navigate = useNavigate();
  const { play } = useSounds();
  const { stats, addXp, loseHeart, bumpStreak, load } = useUserStore();
  const [lesson, setLesson] = useState<any>(null);
  const [queue, setQueue] = useState<ExerciseStep[]>([]);
  const [idx, setIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    (async () => {
      const l = (await window.api.lessons.get(lessonId)) as any;
      if (!l) return;
      setLesson(l);
      const types: ExerciseKind[] = (() => {
        try {
          const arr = JSON.parse(l.exercises || '[]');
          if (Array.isArray(arr) && arr.length > 0) return arr;
        } catch {}
        return DEFAULT_TYPES;
      })();
      const words: Word[] = l.words ?? [];
      if (words.length === 0) {
        toast.error('У этого урока нет слов');
        return;
      }
      const steps: ExerciseStep[] = [];
      const expanded = shuffle([...words, ...words]);
      for (let i = 0; i < expanded.length; i++) {
        const kind = types[i % types.length];
        steps.push({ kind, word: expanded[i] });
      }
      setQueue(steps);
      setTotalCount(steps.length);
      const sId = (await window.api.sessions.start('lesson')) as number;
      setSessionId(sId);
    })();
  }, [lessonId]);

  const current = queue[idx];
  const ExerciseCmp = current ? EXERCISES[current.kind] : null;

  async function handleResult(correct: boolean, _userAnswer?: string) {
    if (correct) {
      play('correct');
      setCorrectCount((c) => c + 1);
      await addXp(1);
    } else {
      play('wrong');
      setMistakes((m) => m + 1);
      const heartsBefore = stats?.hearts ?? 5;
      if (heartsBefore > 0) {
        await loseHeart();
      }
      const updated = useUserStore.getState().stats;
      if (updated && updated.hearts <= 0) {
        setOutOfHearts(true);
      }
      if (current) {
        setQueue((q) => [...q, current]);
      }
    }
  }

  async function handleContinue() {
    if (idx + 1 >= queue.length) {
      await finish();
      return;
    }
    setIdx(idx + 1);
  }

  async function finish() {
    const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const xpBonus = (lesson?.xpReward ?? 10) + (mistakes === 0 ? 5 : 0);
    await addXp(xpBonus);
    await bumpStreak();
    if (sessionId) {
      await window.api.sessions.end({
        id: sessionId,
        xpEarned: xpBonus,
        wordsReviewed: lesson?.words?.length ?? 0,
        exercisesCompleted: totalCount,
        correctAnswers: correctCount,
        totalAnswers: totalCount + mistakes,
      });
    }
    await window.api.lessons.complete({
      lessonId,
      score,
      mistakes,
      timeSpent,
      xp: xpBonus,
    });
    await load();
    setCompleted(true);
    play('complete');
  }

  if (outOfHearts) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <Mascot mood="sad" size={140} />
        <h2 className="mt-4 text-2xl font-bold">Сердца закончились</h2>
        <p className="mt-2 text-ink-300">Восстановятся через 30 минут. Пока можешь повторить старые слова.</p>
        <div className="flex gap-3 mt-6">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            На главную
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/review')}>
            К повторению
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    return (
      <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
        <Confetti />
        <Mascot mood="celebrate" size={140} />
        <h2 className="mt-4 text-3xl font-bold">Урок завершён!</h2>
        <div className="mt-6 grid grid-cols-3 gap-4 max-w-md w-full">
          <StatBox label="Точность" value={`${score}%`} />
          <StatBox label="XP" value={`+${(lesson?.xpReward ?? 10) + (mistakes === 0 ? 5 : 0)}`} />
          <StatBox label="Ошибок" value={String(mistakes)} />
        </div>
        <div className="mt-8 flex gap-3">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            На карту
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setIdx(0);
              setCorrectCount(0);
              setMistakes(0);
              setCompleted(false);
            }}
          >
            Ещё раз
          </button>
        </div>
      </div>
    );
  }

  if (!current || !ExerciseCmp) {
    return <div className="h-full flex items-center justify-center text-ink-400">Загрузка урока...</div>;
  }

  const pool = lesson?.words ?? [];
  const progress = Math.min(idx, queue.length);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-ink-800 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-ink-800 text-ink-400"
          title="Закрыть"
        >
          <X size={18} />
        </button>
        <ProgressBar value={progress} max={queue.length} className="flex-1" color="brand" />
        <div className="text-xs text-ink-400 tabular-nums">
          {progress} / {queue.length}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${idx}-${current.kind}-${current.word.id}`}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <ExerciseCmp
              word={current.word}
              pool={pool}
              onResult={handleResult}
              onContinue={handleContinue}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-ink-400">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
