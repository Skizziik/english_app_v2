import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Grammar() {
  const [topics, setTopics] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const list = (await window.api.grammar.list()) as any[];
      setTopics(list);
    })();
  }, []);

  const grouped: Record<string, any[]> = {};
  for (const t of topics) {
    if (!grouped[t.cefr_level]) grouped[t.cefr_level] = [];
    grouped[t.cefr_level].push(t);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Грамматика</h1>
      {Object.keys(grouped)
        .sort()
        .map((level) => (
          <div key={level} className="mb-6">
            <h2 className="text-sm uppercase tracking-wider text-ink-400 mb-2">Уровень {level}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grouped[level].map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/grammar/${t.id}`)}
                  className="card p-4 flex items-center justify-between hover:border-brand-500 transition group"
                >
                  <div className="text-left">
                    <div className="font-bold">{t.title}</div>
                    <div className="text-sm text-ink-400 mt-0.5">{t.title_ru}</div>
                  </div>
                  <ChevronRight size={18} className="text-ink-500 group-hover:text-brand-300 group-hover:translate-x-1 transition" />
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
