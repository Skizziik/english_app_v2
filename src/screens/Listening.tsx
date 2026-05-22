import { useEffect, useState } from 'react';
import { Volume2, Play, RefreshCw } from 'lucide-react';
import { SpeakButton } from '@/components/SpeakButton';
import { useTTS } from '@/hooks/useTTS';
import { answersMatch, similarity, shuffle, pickRandom } from '@/lib/utils';
import { toast } from 'sonner';
import { useUserStore } from '@/stores/userStore';

export default function Listening() {
  const { speak } = useTTS();
  const { addXp } = useUserStore();
  const [mode, setMode] = useState<'menu' | 'dictation'>('menu');
  const [words, setWords] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState('');
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    (async () => {
      const list = (await window.api.words.list({ cefrLevel: 'A1', limit: 100 })) as any[];
      setWords(pickRandom(list, 10));
    })();
  }, []);

  if (mode === 'menu') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Аудирование</h1>
        <p className="text-ink-400 mb-6">Тренируй восприятие на слух</p>
        <button onClick={() => setMode('dictation')} className="card p-5 text-left w-full hover:border-brand-500 transition">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-brand-500/15 flex items-center justify-center">
              <Volume2 size={20} className="text-brand-300" />
            </div>
            <h3 className="text-xl font-bold">Диктант</h3>
          </div>
          <p className="text-sm text-ink-400">Слушай слова и печатай то, что услышал.</p>
        </button>
      </div>
    );
  }

  const current = words[idx];

  if (!current) return <div className="p-8 text-ink-400">Загрузка...</div>;

  if (idx >= words.length) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Диктант завершён</h2>
        <p className="mt-2 text-ink-400">Правильно: {score} из {words.length}</p>
        <button
          className="btn btn-primary mt-6"
          onClick={() => {
            setIdx(0);
            setScore(0);
            setMode('menu');
          }}
        >
          В меню
        </button>
      </div>
    );
  }

  async function submit() {
    if (done) return;
    const ok = answersMatch(value, current.english) || similarity(value, current.english) >= 0.9;
    setCorrect(ok);
    setDone(true);
    if (ok) {
      setScore((s) => s + 1);
      await addXp(2);
    }
  }

  function nextWord() {
    setIdx(idx + 1);
    setValue('');
    setDone(false);
    setCorrect(false);
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="text-sm text-ink-400 mb-2">
        Слово {idx + 1} из {words.length}
      </div>
      <button
        onClick={() => speak(current.english)}
        className="w-20 h-20 rounded-full bg-brand-500/20 hover:bg-brand-500/30 flex items-center justify-center text-brand-200 mx-auto active:scale-95 transition"
      >
        <Volume2 size={32} />
      </button>
      <div className="text-center text-sm text-ink-400 mt-2">Слушать ещё раз</div>
      <input
        autoFocus
        disabled={done}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="То что услышал..."
        className="mt-6 w-full px-4 py-3 rounded-xl bg-ink-900 border-2 border-ink-700 focus:border-brand-500 outline-none text-lg text-center"
      />
      {!done ? (
        <button className="btn btn-primary mt-4 w-full" onClick={submit} disabled={!value.trim()}>
          Проверить
        </button>
      ) : (
        <div className={`mt-4 p-4 rounded-xl ${correct ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'}`}>
          <div className="font-bold">{correct ? 'Отлично!' : `Правильно: ${current.english}`}</div>
          <div className="text-sm text-ink-300 mt-1">{current.russian}</div>
          <button className="btn btn-primary mt-3 w-full" onClick={nextWord}>
            Дальше
          </button>
        </div>
      )}
    </div>
  );
}
