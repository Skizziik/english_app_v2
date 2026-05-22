import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';

export default function Stories() {
  const [list, setList] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const s = (await window.api.stories.list()) as any[];
      setList(s);
    })();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Чтение</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(`/stories/${s.id}`)}
            className="card p-5 text-left hover:border-brand-500 transition"
          >
            <div className="flex justify-between mb-2">
              <span className="chip">CEFR {s.cefr_level}</span>
              <span className="chip flex items-center gap-1">
                <Clock size={12} /> {s.estimated_read_minutes} мин
              </span>
            </div>
            <h3 className="text-xl font-bold">{s.title}</h3>
            <p className="text-sm text-ink-400 mt-2 line-clamp-2">{s.content_en.slice(0, 120)}...</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-yellow-400">
              <Star size={12} /> +{s.xp_reward} XP
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
