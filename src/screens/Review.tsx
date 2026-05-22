import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SpeakButton } from '@/components/SpeakButton';
import { Mascot } from '@/components/layout/Mascot';
import { useUserStore } from '@/stores/userStore';
import { useSounds } from '@/hooks/useSounds';
import { ProgressBar } from '@/components/ProgressBar';

const RATING_LABELS = [
  { rating: 1, label: 'Снова', color: 'btn-danger', hint: '< 1 мин' },
  { rating: 2, label: 'Трудно', color: 'btn-secondary', hint: 'скоро' },
  { rating: 3, label: 'Хорошо', color: 'btn-success', hint: '~дни' },
  { rating: 4, label: 'Легко', color: 'btn-primary', hint: '~недели' },
];

export default function Review() {
  const navigate = useNavigate();
  const { play } = useSounds();
  const { addXp } = useUserStore();
  const [queue, setQueue] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const q = (await window.api.srs.dueQueue(30)) as any[];
      setQueue(q);
      setLoading(false);
    })();
  }, []);

  const current = queue[idx];

  async function rate(rating: 1 | 2 | 3 | 4) {
    if (!current) return;
    play(rating >= 3 ? 'correct' : 'wrong');
    await window.api.srs.review({ userWordId: current.id, rating });
    await addXp(rating >= 3 ? 2 : 1);
    setReviewedCount((c) => c + 1);
    if (idx + 1 >= queue.length) {
      setIdx(idx + 1);
    } else {
      setIdx(idx + 1);
      setShowBack(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-ink-400">Загрузка...</div>;
  }

  if (queue.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center">
        <Mascot mood="happy" size={120} />
        <h2 className="mt-4 text-2xl font-bold">Карточек на сейчас нет</h2>
        <p className="mt-2 text-ink-300">Сделай уроки, чтобы добавить слова в систему повторений.</p>
        <button className="btn btn-primary mt-6" onClick={() => navigate('/')}>
          На главную
        </button>
      </div>
    );
  }

  if (idx >= queue.length) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center">
        <Mascot mood="celebrate" size={120} />
        <h2 className="mt-4 text-2xl font-bold">Сессия завершена</h2>
        <p className="mt-2 text-ink-300">Повторено карточек: {reviewedCount}</p>
        <button className="btn btn-primary mt-6" onClick={() => navigate('/')}>
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <ProgressBar value={idx} max={queue.length} />
        <div className="text-xs text-ink-400 text-right mt-1">
          {idx} / {queue.length}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="card p-8 max-w-md w-full text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-4xl font-bold">{current.english}</div>
              <SpeakButton text={current.english} />
            </div>
            {current.ipa && <div className="text-ink-400 text-sm">{current.ipa}</div>}
            {showBack && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 pt-6 border-t border-ink-800">
                <div className="text-2xl font-semibold text-brand-200">{current.russian}</div>
                {current.example_en && (
                  <div className="mt-4 text-sm text-ink-300">
                    <div className="italic">{current.example_en}</div>
                    {current.example_ru && <div className="text-ink-400 mt-1">{current.example_ru}</div>}
                  </div>
                )}
              </motion.div>
            )}
            {!showBack && (
              <button className="btn btn-ghost mt-6 mx-auto" onClick={() => setShowBack(true)}>
                <Eye size={16} /> Показать перевод
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {showBack && (
        <div className="grid grid-cols-4 gap-2 mt-6 max-w-2xl mx-auto w-full">
          {RATING_LABELS.map((r) => (
            <button key={r.rating} onClick={() => rate(r.rating as 1 | 2 | 3 | 4)} className={`btn ${r.color} flex-col py-3`}>
              <span>{r.label}</span>
              <span className="text-xs opacity-70">{r.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
