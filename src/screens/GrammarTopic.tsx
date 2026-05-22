import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SpeakButton } from '@/components/SpeakButton';

export default function GrammarTopic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const t = (await window.api.grammar.get(Number(id))) as any;
      setTopic(t);
    })();
  }, [id]);

  if (!topic) return <div className="p-8 text-ink-400">Загрузка...</div>;

  const examples: Array<{ en: string; ru: string }> = (() => {
    try {
      return JSON.parse(topic.examples_json || '[]');
    } catch {
      return [];
    }
  })();

  const explanation = formatExplanation(topic.explanation || '');

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button className="btn-ghost btn -ml-3 mb-4" onClick={() => navigate('/grammar')}>
        <ArrowLeft size={16} /> К списку
      </button>
      <div className="text-xs text-ink-500">CEFR {topic.cefr_level}</div>
      <h1 className="text-3xl font-bold mt-1">{topic.title}</h1>
      <h2 className="text-lg text-brand-200 mt-1">{topic.title_ru}</h2>

      <div className="card p-6 mt-6 prose prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: explanation }} />
      </div>

      {examples.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm uppercase tracking-wider text-ink-400 mb-2">Примеры</h3>
          <div className="space-y-2">
            {examples.map((ex, i) => (
              <div key={i} className="card p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-semibold">{ex.en}</div>
                  <div className="text-sm text-ink-400 mt-1">{ex.ru}</div>
                </div>
                <SpeakButton text={ex.en} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatExplanation(md: string): string {
  // Very small Markdown subset to HTML: bold, line breaks, lists.
  let html = md.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html
    .split(/\n\n+/)
    .map((p) => {
      if (p.split('\n').every((l) => /^-\s/.test(l))) {
        return '<ul>' + p.split('\n').map((l) => `<li>${l.replace(/^-\s/, '')}</li>`).join('') + '</ul>';
      }
      return '<p>' + p.replace(/\n/g, '<br/>') + '</p>';
    })
    .join('');
  return html;
}
