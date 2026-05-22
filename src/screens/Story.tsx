import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Check, Plus, Sparkles } from 'lucide-react';
import { SpeakButton } from '@/components/SpeakButton';
import { useUserStore } from '@/stores/userStore';
import { toast } from 'sonner';

export default function Story() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<any>(null);
  const [showRu, setShowRu] = useState(false);
  const [marked, setMarked] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [loadingExp, setLoadingExp] = useState(false);
  const { addXp } = useUserStore();

  useEffect(() => {
    (async () => {
      const s = (await window.api.stories.get(Number(id))) as any;
      setStory(s);
    })();
  }, [id]);

  async function markRead() {
    await window.api.stories.markRead(Number(id));
    await addXp(story.xp_reward);
    setMarked(true);
    toast.success(`+${story.xp_reward} XP за прочитанный текст`);
  }

  async function onWordClick(word: string, sentence: string) {
    setSelectedWord(word);
    setExplanation('');
    setLoadingExp(true);
    try {
      const exp = (await window.api.mistral.explainWord({ word, sentence })) as string;
      setExplanation(exp);
    } catch (err: any) {
      setExplanation('AI недоступен сейчас.');
    } finally {
      setLoadingExp(false);
    }
  }

  if (!story) return <div className="p-8 text-ink-400">Загрузка...</div>;

  const sentences = story.content_en.split(/(?<=[.!?])\s+/);
  const ruSentences = story.content_ru.split(/(?<=[.!?])\s+/);

  return (
    <div className="h-full flex">
      <div className="flex-1 p-6 max-w-3xl mx-auto overflow-y-auto">
        <button className="btn btn-ghost -ml-3 mb-3" onClick={() => navigate('/stories')}>
          <ArrowLeft size={16} /> К списку
        </button>
        <h1 className="text-3xl font-bold">{story.title}</h1>
        <div className="mt-2 flex gap-2">
          <span className="chip">CEFR {story.cefr_level}</span>
          <span className="chip">{story.word_count} слов</span>
          <span className="chip">{story.estimated_read_minutes} мин</span>
        </div>

        <div className="mt-4 flex gap-2">
          <SpeakButton text={story.content_en} />
          <button className="btn btn-ghost text-sm" onClick={() => setShowRu(!showRu)}>
            {showRu ? <EyeOff size={16} /> : <Eye size={16} />} {showRu ? 'Скрыть перевод' : 'Показать перевод'}
          </button>
        </div>

        <div className="mt-6 space-y-3 text-lg leading-relaxed">
          {sentences.map((s: string, i: number) => (
            <div key={i} className="card p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p>
                    {s.split(/\s+/).map((token, j) => (
                      <span key={j}>
                        <button
                          onClick={() => onWordClick(token.replace(/[.,!?]/g, ''), s)}
                          className="hover:bg-brand-500/15 hover:text-brand-100 px-0.5 rounded transition"
                        >
                          {token}
                        </button>{' '}
                      </span>
                    ))}
                  </p>
                  {showRu && <div className="text-sm text-ink-400 mt-1">{ruSentences[i]}</div>}
                </div>
                <SpeakButton text={s} size="sm" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button className="btn btn-primary" onClick={markRead} disabled={marked}>
            {marked ? <Check size={16} /> : null}
            {marked ? 'Прочитано' : `Готово, +${story.xp_reward} XP`}
          </button>
        </div>
      </div>

      {selectedWord && (
        <div className="w-80 border-l border-ink-800 p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold">{selectedWord}</h3>
            <button onClick={() => setSelectedWord(null)} className="text-ink-500 hover:text-ink-200">✕</button>
          </div>
          <SpeakButton text={selectedWord} />
          <div className="mt-4 text-sm text-ink-300 whitespace-pre-line">
            {loadingExp ? (
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="animate-pulse" /> AI думает...
              </span>
            ) : (
              explanation
            )}
          </div>
        </div>
      )}
    </div>
  );
}
