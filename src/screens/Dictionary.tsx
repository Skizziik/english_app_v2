import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, BookOpen } from 'lucide-react';
import { SpeakButton } from '@/components/SpeakButton';
import { toast } from 'sonner';
import type { Word } from '@/types';

const LEVELS = ['', 'A1', 'A2', 'B1', 'B2', 'C1'];

export default function Dictionary() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [items, setItems] = useState<Word[]>([]);
  const [selected, setSelected] = useState<Word | null>(null);

  useEffect(() => {
    (async () => {
      const list = (await window.api.words.list({ cefrLevel: level || undefined, limit: 500 })) as Word[];
      setItems(list);
    })();
  }, [level]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length > 0) {
        const res = (await window.api.words.search(query)) as Word[];
        setItems(res);
      } else {
        const list = (await window.api.words.list({ cefrLevel: level || undefined, limit: 500 })) as Word[];
        setItems(list);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, level]);

  async function addToReview(word: Word) {
    await window.api.srs.enqueueWords([word.id]);
    toast.success(`«${word.english}» добавлено в повторение`);
  }

  return (
    <div className="h-full flex">
      <div className="w-96 border-r border-ink-800 flex flex-col">
        <div className="p-4 border-b border-ink-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" size={16} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-ink-900 border border-ink-700 focus:border-brand-500 outline-none"
            />
          </div>
          <div className="flex gap-1 mt-3">
            {LEVELS.map((l) => (
              <button
                key={l || 'all'}
                onClick={() => setLevel(l)}
                className={`px-3 py-1 text-xs rounded-full ${level === l ? 'bg-brand-500 text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'}`}
              >
                {l || 'Все'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelected(w)}
              className={`w-full p-3 text-left border-b border-ink-800/60 hover:bg-ink-800/40 ${selected?.id === w.id ? 'bg-brand-500/10' : ''}`}
            >
              <div className="flex justify-between">
                <div className="font-semibold">{w.english}</div>
                <div className="text-xs text-ink-400">{w.cefrLevel}</div>
              </div>
              <div className="text-sm text-ink-400 mt-0.5">{w.russian}</div>
            </button>
          ))}
          {items.length === 0 && <div className="p-6 text-center text-ink-500 text-sm">Ничего не найдено</div>}
        </div>
      </div>
      <div className="flex-1 p-8">
        {selected ? (
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold">{selected.english}</h2>
              <SpeakButton text={selected.english} size="lg" />
            </div>
            {selected.ipa && <div className="text-ink-400 mt-2 text-lg">{selected.ipa}</div>}
            <div className="mt-4 text-2xl text-brand-200">{selected.russian}</div>
            <div className="mt-3 flex gap-2">
              {selected.partOfSpeech && <span className="chip">{selected.partOfSpeech}</span>}
              <span className="chip">CEFR {selected.cefrLevel}</span>
              {selected.topic && <span className="chip">{selected.topic}</span>}
            </div>
            {selected.exampleEn && (
              <div className="card p-4 mt-6">
                <div className="text-xs text-ink-400 uppercase tracking-wider">Пример</div>
                <div className="mt-2 text-lg">{selected.exampleEn}</div>
                {selected.exampleRu && <div className="text-ink-400 mt-1">{selected.exampleRu}</div>}
              </div>
            )}
            <button className="btn btn-primary mt-6" onClick={() => addToReview(selected)}>
              <Plus size={16} /> Добавить в повторение
            </button>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-ink-500">
            <div className="text-center">
              <BookOpen size={40} className="mx-auto opacity-30" />
              <div className="mt-2">Выбери слово</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
