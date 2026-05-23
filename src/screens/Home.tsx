import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Play, Flame, Star, Heart, ArrowRight, BookOpen, RotateCcw } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { Mascot } from '@/components/layout/Mascot';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

export default function Home() {
  const navigate = useNavigate();
  const { user, stats } = useUserStore();
  const [units, setUnits] = useState<any[]>([]);
  const [openUnit, setOpenUnit] = useState<number | null>(null);
  const [lessonsByUnit, setLessonsByUnit] = useState<Record<number, any[]>>({});
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    (async () => {
      const u = (await window.api.lessons.listUnits()) as any[];
      setUnits(u);
      if (u.length > 0) setOpenUnit(u[0].id);
      try {
        const due = (await window.api.srs.dueQueue(100)) as any[];
        setDueCount(due.length);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (openUnit && !lessonsByUnit[openUnit]) {
      (async () => {
        const l = (await window.api.lessons.listForUnit(openUnit)) as any[];
        setLessonsByUnit((prev) => ({ ...prev, [openUnit]: l }));
      })();
    }
  }, [openUnit]);

  // Find first available (not completed) lesson across all units, in order
  const nextLesson = useMemo(() => {
    for (const unit of units) {
      const lessons = lessonsByUnit[unit.id] ?? [];
      const found = lessons.find((l) => l.progress?.status !== 'completed');
      if (found) return { unit, lesson: found };
      if (lessons.length === 0 && unit.totalLessons > 0) {
        // not loaded yet, skip
      }
    }
    return null;
  }, [units, lessonsByUnit]);

  // Ensure all units load lessons so we can compute nextLesson reliably
  useEffect(() => {
    for (const u of units) {
      if (!lessonsByUnit[u.id]) {
        window.api.lessons.listForUnit(u.id).then((rows: any) => {
          setLessonsByUnit((prev) => (prev[u.id] ? prev : { ...prev, [u.id]: rows }));
        });
      }
    }
  }, [units]);

  const dailyXp = stats?.totalXp ?? 0;
  const dailyGoal = (user?.dailyGoalMinutes ?? 10) * 5;
  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round((dailyXp / dailyGoal) * 100)) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Привет, {user?.name ?? 'друг'}!</h1>
          <p className="text-ink-400 mt-1">Уровень {user?.currentLevel ?? 'A0'} · продолжай учиться каждый день</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Flame className="text-orange-400" />} label="Streak" value={stats?.currentStreak ?? 0} />
        <StatCard icon={<Star className="text-yellow-400" />} label="XP" value={stats?.totalXp ?? 0} />
        <StatCard icon={<Heart className="text-red-400" />} label="Сердца" value={stats?.hearts ?? 5} />
        <StatCard icon={<RotateCcw className="text-cyan-400" />} label="На повторение" value={dueCount} />
      </div>

      <div className="card p-4 mb-6">
        <div className="flex justify-between text-sm">
          <div className="font-semibold">Дневная цель</div>
          <div className="text-ink-400 tabular-nums">
            {Math.min(dailyXp, dailyGoal)} / {dailyGoal} XP ({goalPct}%)
          </div>
        </div>
        <ProgressBar value={dailyXp} max={dailyGoal} className="mt-2" color={goalPct >= 100 ? 'green' : 'brand'} />
      </div>

      {/* Big "continue" CTA card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card p-6 mb-6 bg-gradient-to-br from-brand-600/30 via-brand-700/20 to-ink-900 border-brand-500/40"
      >
        <div className="flex items-center gap-5">
          <Mascot mood={nextLesson ? 'happy' : 'celebrate'} size={88} />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-brand-200 font-semibold">
              {nextLesson ? 'Продолжай учиться' : 'Все уроки пройдены'}
            </div>
            <h2 className="text-2xl font-bold mt-1">
              {nextLesson ? nextLesson.lesson.title : 'Молодец!'}
            </h2>
            <div className="text-ink-300 text-sm mt-1">
              {nextLesson
                ? `${nextLesson.unit.title} · +${nextLesson.lesson.xpReward} XP · ~${nextLesson.lesson.estimatedMinutes} мин`
                : 'Скоро добавим новый контент. Пока можешь повторять старые слова.'}
            </div>
          </div>
          <button
            onClick={() => {
              if (nextLesson) navigate(`/lesson/${nextLesson.lesson.id}`);
              else navigate('/review');
            }}
            className="btn btn-primary text-lg px-6 py-3 shrink-0"
          >
            {nextLesson ? 'Начать' : 'Повторить'} <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <QuickTile
          icon={<RotateCcw className="text-cyan-300" />}
          title="Повторить"
          subtitle={dueCount > 0 ? `${dueCount} карточек ждут` : 'Нет карточек на сейчас'}
          onClick={() => navigate('/review')}
          highlight={dueCount > 0}
        />
        <QuickTile
          icon={<BookOpen className="text-purple-300" />}
          title="Словарь"
          subtitle="Поиск и добавление слов"
          onClick={() => navigate('/dictionary')}
        />
        <QuickTile
          icon={<Star className="text-yellow-300" />}
          title="Диалог с AI"
          subtitle="Практика разговора"
          onClick={() => navigate('/chat')}
        />
      </div>

      <h3 className="text-sm uppercase tracking-wider text-ink-400 mb-3 mt-8">Все юниты</h3>
      <div className="space-y-3">
        {units.map((u) => (
          <div key={u.id} className="card overflow-hidden">
            <button
              onClick={() => setOpenUnit(openUnit === u.id ? null : u.id)}
              className="w-full p-4 flex items-center gap-4 hover:bg-ink-800/30 transition"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: u.color || '#33a3ff' }}
              >
                {u.orderIdx}
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold">{u.title}</div>
                <div className="text-sm text-ink-400">{u.description}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-ink-400">
                  {u.completedLessons ?? 0} / {u.totalLessons ?? 0}
                </div>
                <ProgressBar value={u.completedLessons ?? 0} max={u.totalLessons ?? 1} className="w-24 mt-1" />
              </div>
            </button>
            {openUnit === u.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="border-t border-ink-800 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {(lessonsByUnit[u.id] ?? []).map((l) => {
                  const done = l.progress?.status === 'completed';
                  return (
                    <button
                      key={l.id}
                      onClick={() => navigate(`/lesson/${l.id}`)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-left transition flex items-center gap-3',
                        done
                          ? 'border-green-500/40 bg-green-500/10'
                          : 'border-ink-800 hover:border-brand-500 bg-ink-900/50',
                      )}
                    >
                      <div className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center shrink-0">
                        {done ? <Check size={16} className="text-green-400" /> : <Play size={14} className="text-brand-300" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{l.title}</div>
                        <div className="text-xs text-ink-400 mt-0.5 line-clamp-1">{l.description}</div>
                      </div>
                      <div className="text-xs text-ink-500">+{l.xpReward} XP</div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs text-ink-400">{label}</div>
        <div className="font-bold text-lg tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function QuickTile({
  icon,
  title,
  subtitle,
  onClick,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'card p-4 text-left transition hover:border-brand-500',
        highlight && 'border-cyan-500/40 bg-cyan-500/5',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-ink-800 flex items-center justify-center">{icon}</div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-ink-400 mt-0.5">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}
