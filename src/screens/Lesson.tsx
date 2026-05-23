import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { EXERCISES } from '@/components/exercises';
import type { ExerciseKind } from '@/components/exercises/types';
import { hasEmoji } from '@/components/exercises/emoji';
import { Confetti } from '@/components/Confetti';
import { Mascot } from '@/components/layout/Mascot';
import { SpeakButton } from '@/components/SpeakButton';
import { useUserStore } from '@/stores/userStore';
import { useSounds } from '@/hooks/useSounds';
import { useTTS } from '@/hooks/useTTS';
import { toast } from 'sonner';
import type { Word } from '@/types';
import { shuffle } from '@/lib/utils';

interface ExerciseStep {
  kind: ExerciseKind;
  word: Word;
}

const DEFAULT_TYPES: ExerciseKind[] = ['TranslationMC', 'ReverseTranslationMC', 'Matching', 'Typing', 'ListeningMC'];

type Phase = 'loading' | 'preview' | 'exercising' | 'completed' | 'no-hearts';

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
  const [phase, setPhase] = useState<Phase>('loading');
  const [previewIdx, setPreviewIdx] = useState(0);
  const startTime = useRef(Date.now());
  const { speak } = useTTS();

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
        navigate('/');
        return;
      }
      const steps: ExerciseStep[] = [];
      const expanded = shuffle([...words, ...words]);
      // Filter out ImageWord for words that don't have an emoji so we never show
      // four identical "abc" placeholders.
      const swap = (kind: ExerciseKind, w: Word): ExerciseKind => {
        if (kind === 'ImageWord' && !hasEmoji(w.english)) return 'TranslationMC';
        return kind;
      };
      for (let i = 0; i < expanded.length; i++) {
        const kind = swap(types[i % types.length], expanded[i]);
        steps.push({ kind, word: expanded[i] });
      }
      setQueue(steps);
      setTotalCount(steps.length);
      const sId = (await window.api.sessions.start('lesson')) as number;
      setSessionId(sId);
      setPhase('preview');
    })();
  }, [lessonId]);

  // Auto-pronounce word as preview advances
  useEffect(() => {
    if (phase !== 'preview') return;
    const w: Word | undefined = lesson?.words?.[previewIdx];
    if (w) speak(w.english).catch(() => {});
  }, [phase, previewIdx, lesson]);

  const current = queue[idx];
  const ExerciseCmp = current ? EXERCISES[current.kind] : null;

  async function handleResult(correct: boolean) {
    if (correct) {
      play('correct');
      setCorrectCount((c) => c + 1);
      await addXp(1);
    } else {
      play('wrong');
      setMistakes((m) => m + 1);
      if ((stats?.hearts ?? 5) > 0) await loseHeart();
      const updated = useUserStore.getState().stats;
      if (updated && updated.hearts <= 0) setPhase('no-hearts');
      if (current) setQueue((q) => [...q, current]);
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
    // also enqueue the words into SRS
    if (lesson?.words?.length) {
      const wordIds = lesson.words.map((w: Word) => w.id);
      await window.api.srs.enqueueWords(wordIds);
    }
    await load();
    setPhase('completed');
    play('complete');
  }

  if (phase === 'loading' || !lesson) {
    return <div className="h-full flex items-center justify-center text-ink-400">Загрузка урока...</div>;
  }

  if (phase === 'no-hearts') {
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

  if (phase === 'completed') {
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
          <button className="btn btn-primary" onClick={() => navigate('/review')}>
            К повторению
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'preview') {
    const words: Word[] = lesson.words ?? [];
    const w = words[previewIdx];
    const isLast = previewIdx >= words.length - 1;
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-ink-800 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-ink-800 text-ink-400" title="Закрыть">
            <X size={18} />
          </button>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-brand-300 font-semibold flex items-center gap-1">
              <Sparkles size={12} /> Знакомство со словами
            </div>
            <div className="text-sm font-semibold mt-0.5">{lesson.title}</div>
          </div>
          <div className="text-xs text-ink-400 tabular-nums">
            {previewIdx + 1} / {words.length}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card p-8 max-w-md w-full text-center"
            >
              <div className="text-xs text-ink-400 uppercase tracking-wider mb-3">Новое слово</div>
              <div className="flex items-center justify-center gap-3">
                <div className="text-5xl font-bold">{w.english}</div>
                <SpeakButton text={w.english} size="lg" />
              </div>
              {w.ipa && <div className="text-ink-400 mt-2">{w.ipa}</div>}
              <div className="mt-5 text-2xl text-brand-200">{w.russian}</div>
              {w.partOfSpeech && (
                <div className="text-xs text-ink-500 mt-2">{w.partOfSpeech}</div>
              )}
              {w.exampleEn && (
                <div className="mt-5 pt-5 border-t border-ink-800 text-sm">
                  <div className="text-ink-200 italic">{w.exampleEn}</div>
                  {w.exampleRu && <div className="text-ink-400 mt-1">{w.exampleRu}</div>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-ink-800 flex justify-between items-center max-w-2xl mx-auto w-full">
          <button
            disabled={previewIdx === 0}
            onClick={() => setPreviewIdx(previewIdx - 1)}
            className="btn btn-ghost disabled:opacity-30"
          >
            Назад
          </button>
          <div className="text-xs text-ink-500">Послушай, повтори, нажми "{isLast ? 'Начать' : 'Дальше'}"</div>
          <button
            className="btn btn-primary px-6"
            onClick={() => {
              if (isLast) setPhase('exercising');
              else setPreviewIdx(previewIdx + 1);
            }}
          >
            {isLast ? 'Начать упражнения' : 'Дальше'} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (!current || !ExerciseCmp) {
    return <div className="h-full flex items-center justify-center text-ink-400">Загрузка...</div>;
  }

  const pool = lesson?.words ?? [];
  const progress = Math.min(idx, queue.length);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-ink-800 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-ink-800 text-ink-400" title="Закрыть">
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
