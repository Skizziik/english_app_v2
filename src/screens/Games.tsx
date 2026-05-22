import { useEffect, useState } from 'react';
import { Gamepad2, Timer, Brain, Sparkles } from 'lucide-react';
import { pickRandom, shuffle, answersMatch } from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';
import { useSounds } from '@/hooks/useSounds';

type GameId = 'menu' | 'match' | 'speed' | 'sentence';

export default function Games() {
  const [game, setGame] = useState<GameId>('menu');

  if (game === 'menu') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Игры</h1>
        <p className="text-ink-400 mb-6">Учись играя</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Tile
            icon={<Brain className="text-purple-300" />}
            title="Word Match"
            description="Memory с переводами"
            onClick={() => setGame('match')}
          />
          <Tile
            icon={<Timer className="text-orange-300" />}
            title="Speed Typing"
            description="60 секунд, успей напечатать"
            onClick={() => setGame('speed')}
          />
          <Tile
            icon={<Sparkles className="text-yellow-300" />}
            title="Sentence Builder"
            description="Собери предложение"
            onClick={() => setGame('sentence')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button className="btn btn-ghost mb-4" onClick={() => setGame('menu')}>
        ← В меню
      </button>
      {game === 'match' && <WordMatchGame onExit={() => setGame('menu')} />}
      {game === 'speed' && <SpeedTypingGame onExit={() => setGame('menu')} />}
      {game === 'sentence' && <SentenceBuilderGame onExit={() => setGame('menu')} />}
    </div>
  );
}

function Tile({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-5 text-left hover:border-brand-500 transition">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-ink-800 flex items-center justify-center">{icon}</div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <p className="text-sm text-ink-400">{description}</p>
    </button>
  );
}

function WordMatchGame({ onExit }: { onExit: () => void }) {
  const [words, setWords] = useState<any[]>([]);
  const [cards, setCards] = useState<Array<{ key: string; id: number; text: string; side: 'en' | 'ru' }>>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const { addXp } = useUserStore();
  const { play } = useSounds();

  useEffect(() => {
    (async () => {
      const all = (await window.api.words.list({ cefrLevel: 'A1', limit: 50 })) as any[];
      const picked = pickRandom(all, 6);
      setWords(picked);
      const c: Array<{ key: string; id: number; text: string; side: 'en' | 'ru' }> = [];
      for (const w of picked) {
        c.push({ key: 'en-' + w.id, id: w.id, text: w.english, side: 'en' });
        c.push({ key: 'ru-' + w.id, id: w.id, text: w.russian, side: 'ru' });
      }
      setCards(shuffle(c));
    })();
  }, []);

  useEffect(() => {
    if (flipped.length === 2) {
      setTimeout(() => {
        const [a, b] = flipped;
        if (cards[a].id === cards[b].id && cards[a].side !== cards[b].side) {
          setMatched((m) => new Set(m).add(cards[a].id));
          play('correct');
        } else {
          play('wrong');
        }
        setFlipped([]);
        setMoves((m) => m + 1);
      }, 700);
    }
  }, [flipped]);

  useEffect(() => {
    if (words.length > 0 && matched.size === words.length) {
      addXp(20);
    }
  }, [matched, words.length]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-3">Word Match</h2>
      <div className="text-sm text-ink-400 mb-4">
        Ходов: {moves} · Найдено: {matched.size} / {words.length}
      </div>
      <div className="grid grid-cols-4 gap-2 max-w-3xl">
        {cards.map((c, i) => {
          const isFlipped = flipped.includes(i) || matched.has(c.id);
          return (
            <button
              key={c.key}
              disabled={isFlipped || flipped.length >= 2}
              onClick={() => setFlipped((f) => (f.length < 2 ? [...f, i] : f))}
              className={`aspect-[4/3] rounded-xl border-2 flex items-center justify-center text-center p-2 transition ${
                isFlipped
                  ? matched.has(c.id)
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-brand-500 bg-brand-500/15'
                  : 'border-ink-800 bg-ink-900 hover:bg-ink-800'
              }`}
            >
              {isFlipped ? <span className="font-semibold">{c.text}</span> : <span className="text-2xl">?</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpeedTypingGame({ onExit }: { onExit: () => void }) {
  const [words, setWords] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [value, setValue] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const { addXp } = useUserStore();
  const { play } = useSounds();

  useEffect(() => {
    (async () => {
      const all = (await window.api.words.list({ cefrLevel: 'A1', limit: 200 })) as any[];
      setWords(all);
    })();
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (timeLeft <= 0 && running) {
      setRunning(false);
      addXp(Math.min(50, score));
    }
  }, [timeLeft, running]);

  function start() {
    setScore(0);
    setTimeLeft(60);
    setRunning(true);
    pickNext();
  }

  function pickNext() {
    setValue('');
    setCurrent(pickRandom(words, 1)[0]);
  }

  function submit() {
    if (!current) return;
    if (answersMatch(value, current.english)) {
      play('correct');
      setScore((s) => s + 1);
      pickNext();
    } else {
      play('wrong');
    }
  }

  if (!running && timeLeft === 60) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-3">Speed Typing</h2>
        <p className="text-ink-400 mb-6">60 секунд. Печатай английский перевод как можно быстрее.</p>
        <button className="btn btn-primary" onClick={start} disabled={words.length === 0}>
          Старт
        </button>
      </div>
    );
  }

  if (!running) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-3">Время!</h2>
        <p className="text-ink-300">Очков: {score}</p>
        <p className="text-sm text-ink-400">+{Math.min(50, score)} XP</p>
        <div className="flex gap-2 mt-6">
          <button className="btn btn-primary" onClick={start}>
            Ещё раз
          </button>
          <button className="btn btn-secondary" onClick={onExit}>
            В меню
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <div className="flex justify-between mb-2 text-sm">
        <span>Очки: {score}</span>
        <span className="text-orange-400">⏱ {timeLeft}</span>
      </div>
      <div className="card p-5 text-center">
        <div className="text-2xl font-bold">{current?.russian}</div>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="mt-3 w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 focus:border-brand-500 outline-none text-center"
        />
      </div>
    </div>
  );
}

function SentenceBuilderGame({ onExit }: { onExit: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const { play } = useSounds();
  const { addXp } = useUserStore();

  useEffect(() => {
    (async () => {
      const all = (await window.api.words.list({ cefrLevel: 'A1', limit: 100 })) as any[];
      const withExamples = all.filter((w) => w.exampleEn && w.exampleEn.includes(' '));
      const picked = pickRandom(withExamples, 5);
      setItems(picked);
    })();
  }, []);

  useEffect(() => {
    if (items[idx]) {
      const sentence = items[idx].exampleEn as string;
      const toks = sentence.replace(/[.,!?]/g, '').split(/\s+/);
      setTokens(shuffle(toks));
      setPicked([]);
      setDone(false);
    }
  }, [idx, items]);

  const current = items[idx];

  if (items.length === 0) return <div className="text-ink-400">Загрузка...</div>;

  if (idx >= items.length) {
    return (
      <div>
        <h2 className="text-2xl font-bold">Готово</h2>
        <p className="text-ink-300 mt-1">Очков: {score} / {items.length}</p>
        <button className="btn btn-primary mt-4" onClick={onExit}>
          В меню
        </button>
      </div>
    );
  }

  function pick(token: string, i: number) {
    setPicked([...picked, token]);
    setTokens(tokens.filter((_, idx) => idx !== i));
  }
  function unpick(i: number) {
    const tok = picked[i];
    setPicked(picked.filter((_, idx) => idx !== i));
    setTokens([...tokens, tok]);
  }
  function check() {
    const target = (current.exampleEn as string).replace(/[.,!?]/g, '').toLowerCase();
    const userStr = picked.join(' ').toLowerCase();
    const ok = userStr === target;
    if (ok) {
      play('correct');
      setScore((s) => s + 1);
      addXp(3);
    } else {
      play('wrong');
    }
    setDone(true);
  }

  return (
    <div className="max-w-xl">
      <div className="text-sm text-ink-400 mb-2">
        Предложение {idx + 1} из {items.length}
      </div>
      <div className="card p-5">
        <div className="text-lg font-bold text-center">{current.exampleRu}</div>
        <div className="mt-4 min-h-[60px] p-2 border-2 border-dashed border-ink-700 rounded-xl flex flex-wrap gap-2">
          {picked.map((t, i) => (
            <button key={i} onClick={() => unpick(i)} className="px-3 py-1.5 rounded-lg bg-brand-500/20 border border-brand-500">
              {t}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tokens.map((t, i) => (
            <button key={i} onClick={() => pick(t, i)} className="px-3 py-1.5 rounded-lg bg-ink-800 hover:bg-ink-700 border border-ink-700">
              {t}
            </button>
          ))}
        </div>
        {!done ? (
          <button className="btn btn-primary w-full mt-4" disabled={picked.length === 0} onClick={check}>
            Проверить
          </button>
        ) : (
          <button className="btn btn-primary w-full mt-4" onClick={() => setIdx(idx + 1)}>
            Дальше
          </button>
        )}
      </div>
    </div>
  );
}
