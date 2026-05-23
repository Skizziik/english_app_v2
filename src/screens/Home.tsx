import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Check, Play, Flame, Star, Heart } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

export default function Home() {
  const navigate = useNavigate();
  const { user, stats } = useUserStore();
  const [units, setUnits] = useState<any[]>([]);
  const [openUnit, setOpenUnit] = useState<number | null>(null);
  const [lessonsByUnit, setLessonsByUnit] = useState<Record<number, any[]>>({});

  useEffect(() => {
    (async () => {
      const u = (await window.api.lessons.listUnits()) as any[];
      setUnits(u);
      if (u.length > 0) setOpenUnit(u[0].id);
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

  const dailyXp = stats?.totalXp ?? 0;
  const dailyGoal = (user?.dailyGoalMinutes ?? 10) * 5;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Привет, {user?.name ?? 'друг'}</h1>
          <p className="text-ink-400 mt-1">Уровень {user?.currentLevel ?? 'A0'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard icon={<Flame className="text-orange-400" />} label="Streak" value={stats?.currentStreak ?? 0} />
        <StatCard icon={<Star className="text-yellow-400" />} label="XP" value={stats?.totalXp ?? 0} />
        <StatCard icon={<Heart className="text-red-400" />} label="Сердца" value={stats?.hearts ?? 5} />
      </div>

      <div className="card p-4 mb-6">
        <div className="flex justify-between text-sm">
          <div>Сегодняшняя цель</div>
          <div className="text-ink-400">
            {Math.min(dailyXp, dailyGoal)} / {dailyGoal} XP
          </div>
        </div>
        <ProgressBar value={dailyXp} max={dailyGoal} className="mt-2" color="green" />
      </div>

      <div className="space-y-4">
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
