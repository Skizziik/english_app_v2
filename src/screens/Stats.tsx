import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useUserStore } from '@/stores/userStore';

export default function Stats() {
  const { user, stats } = useUserStore();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const h = (await window.api.sessions.history(30)) as any[];
      setHistory(h);
    })();
  }, []);

  const daily = aggregateByDay(history);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Статистика</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KPI label="Всего XP" value={stats?.totalXp ?? 0} />
        <KPI label="Streak" value={stats?.currentStreak ?? 0} suffix="дн." />
        <KPI label="Лучший streak" value={stats?.longestStreak ?? 0} suffix="дн." />
        <KPI label="Уровень" value={user?.currentLevel ?? 'A0'} />
      </div>

      <div className="card p-4 mb-6">
        <h3 className="font-semibold mb-3">XP за последние 30 дней</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={daily}>
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="xp" fill="#33a3ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Правильные ответы</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={daily}>
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Line dataKey="correct" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-ink-400">{label}</div>
      <div className="text-2xl font-bold mt-1">
        {value}
        {suffix && <span className="text-sm text-ink-400 ml-1">{suffix}</span>}
      </div>
    </div>
  );
}

function aggregateByDay(sessions: any[]) {
  const map = new Map<string, { date: string; xp: number; correct: number }>();
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(5, 10);
    map.set(key, { date: key, xp: 0, correct: 0 });
  }
  for (const s of sessions) {
    const d = new Date(s.started_at * 1000);
    const key = d.toISOString().slice(5, 10);
    const cur = map.get(key);
    if (cur) {
      cur.xp += s.xp_earned ?? 0;
      cur.correct += s.correct_answers ?? 0;
    }
  }
  return Array.from(map.values());
}
