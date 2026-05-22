import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Flame, Heart, Star } from 'lucide-react';
import { Mascot } from '@/components/layout/Mascot';
import { Confetti } from '@/components/Confetti';
import { SpeakButton } from '@/components/SpeakButton';
import { useTTS } from '@/hooks/useTTS';
import { useSounds } from '@/hooks/useSounds';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

const MOTIVATIONS = [
  { id: 'travel', label: 'Путешествия', emoji: '✈️' },
  { id: 'work', label: 'Работа и карьера', emoji: '💼' },
  { id: 'study', label: 'Учёба', emoji: '🎓' },
  { id: 'media', label: 'Игры и фильмы', emoji: '🎮' },
  { id: 'people', label: 'Общение с людьми', emoji: '💬' },
  { id: 'fun', label: 'Просто интересно', emoji: '✨' },
];

const GOALS = [
  { value: 5, label: '5 минут', sub: 'легко' },
  { value: 10, label: '10 минут', sub: 'норма' },
  { value: 15, label: '15 минут', sub: 'серьёзно' },
  { value: 20, label: '20 минут', sub: 'интенсивно' },
];

const LEVEL_QUIZ = [
  { word: 'Hello', en: 'Hello', options: ['Привет', 'Пока', 'Спасибо', 'Извини'], correct: 0, level: 'A1' },
  { word: 'Yesterday I went to school', en: 'Yesterday I went to school', options: ['Завтра иду в школу', 'Вчера ходил в школу', 'Сейчас в школе', 'Не люблю школу'], correct: 1, level: 'A2' },
  { word: 'I have been waiting for hours', en: 'I have been waiting for hours', options: ['Я подожду', 'Жду уже несколько часов', 'Я ждал час', 'Я буду ждать'], correct: 1, level: 'B1' },
];

interface OnboardingState {
  step: number;
  name: string;
  motivations: string[];
  dailyGoal: number;
  level: 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { speak } = useTTS();
  const { play } = useSounds();
  const load = useUserStore((s) => s.load);
  const [state, setState] = useState<OnboardingState>({
    step: 0,
    name: '',
    motivations: [],
    dailyGoal: 10,
    level: 'A0',
  });

  const next = () => setState((s) => ({ ...s, step: s.step + 1 }));
  const set = <K extends keyof OnboardingState>(k: K, v: OnboardingState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  async function finish() {
    await window.api.user.create({
      name: state.name || 'Студент',
      currentLevel: state.level,
      dailyGoalMinutes: state.dailyGoal,
      motivations: state.motivations,
    });
    await window.api.user.completeOnboarding({});
    await load();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-ink-950 via-ink-900 to-brand-900/30">
      <AnimatePresence mode="wait">
        <motion.div
          key={state.step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-2xl"
        >
          {state.step === 0 && <Step0 onNext={next} />}
          {state.step === 1 && (
            <Step1 name={state.name} onChange={(v) => set('name', v)} onNext={next} />
          )}
          {state.step === 2 && (
            <Step2
              selected={state.motivations}
              onToggle={(id) =>
                set(
                  'motivations',
                  state.motivations.includes(id)
                    ? state.motivations.filter((x) => x !== id)
                    : [...state.motivations, id],
                )
              }
              onNext={next}
            />
          )}
          {state.step === 3 && (
            <Step3 selected={state.dailyGoal} onSelect={(v) => set('dailyGoal', v)} onNext={next} />
          )}
          {state.step === 4 && (
            <Step4
              onSkip={() => {
                set('level', 'A0');
                next();
              }}
              onFinish={(level) => {
                set('level', level);
                next();
              }}
            />
          )}
          {state.step === 5 && <Step5MiniLesson speak={speak} play={play} onNext={next} />}
          {state.step === 6 && <Step6 onNext={next} />}
          {state.step === 7 && <Step7 onFinish={finish} />}
        </motion.div>
      </AnimatePresence>
      <Dots step={state.step} total={8} />
    </div>
  );
}

function Dots({ step, total }: { step: number; total: number }) {
  return (
    <div className="mt-10 flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all',
            i === step ? 'w-8 bg-brand-400' : i < step ? 'w-4 bg-brand-700' : 'w-4 bg-ink-800',
          )}
        />
      ))}
    </div>
  );
}

function Step0({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <Mascot mood="wave" size={160} />
      <h1 className="mt-6 text-3xl font-bold">Привет! Я Луми.</h1>
      <p className="mt-3 text-ink-300 text-lg">Будем учить английский вместе. Это будет легко и весело.</p>
      <button className="btn btn-primary mt-8 px-8 text-lg" onClick={onNext}>
        Поехали <ArrowRight size={18} />
      </button>
    </div>
  );
}

function Step1({ name, onChange, onNext }: { name: string; onChange: (v: string) => void; onNext: () => void }) {
  return (
    <div className="text-center">
      <Mascot mood="happy" size={120} />
      <h2 className="mt-4 text-2xl font-bold">Как тебя зовут?</h2>
      <input
        autoFocus
        value={name}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && name.trim() && onNext()}
        placeholder="Твоё имя"
        className="mt-6 w-full max-w-sm mx-auto block px-5 py-3 rounded-xl bg-ink-900 border-2 border-ink-700 focus:border-brand-500 outline-none text-lg text-center"
      />
      <button className="btn btn-primary mt-6 px-8" disabled={!name.trim()} onClick={onNext}>
        Дальше <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Step2({
  selected,
  onToggle,
  onNext,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold">Зачем учишь английский?</h2>
      <p className="text-ink-400 mt-1 text-sm">Можно выбрать несколько вариантов</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {MOTIVATIONS.map((m) => {
          const active = selected.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => onToggle(m.id)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                active
                  ? 'border-brand-500 bg-brand-500/15'
                  : 'border-ink-800 hover:border-ink-600 bg-ink-900/50',
              )}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="font-semibold">{m.label}</span>
              {active && <Check size={16} className="ml-auto text-brand-300" />}
            </button>
          );
        })}
      </div>
      <button className="btn btn-primary mt-8 px-8" onClick={onNext}>
        Дальше <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Step3({
  selected,
  onSelect,
  onNext,
}: {
  selected: number;
  onSelect: (v: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold">Сколько времени в день?</h2>
      <p className="text-ink-400 mt-1 text-sm">Постоянство важнее объёма</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {GOALS.map((g) => (
          <button
            key={g.value}
            onClick={() => onSelect(g.value)}
            className={cn(
              'p-5 rounded-xl border-2 transition',
              selected === g.value
                ? 'border-brand-500 bg-brand-500/15'
                : 'border-ink-800 hover:border-ink-600 bg-ink-900/50',
            )}
          >
            <div className="text-xl font-bold">{g.label}</div>
            <div className="text-sm text-ink-400">{g.sub}</div>
          </button>
        ))}
      </div>
      <button className="btn btn-primary mt-8 px-8" onClick={onNext}>
        Дальше <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Step4({
  onSkip,
  onFinish,
}: {
  onSkip: () => void;
  onFinish: (level: 'A1' | 'A2' | 'B1') => void;
}) {
  const [idx, setIdx] = useState(-1);
  const [score, setScore] = useState(0);

  if (idx === -1) {
    return (
      <div className="text-center">
        <Mascot mood="thinking" size={120} />
        <h2 className="mt-4 text-2xl font-bold">Какой у тебя уровень?</h2>
        <p className="text-ink-400 mt-2">Если не знаешь, ничего страшного. Начнём с самого начала.</p>
        <div className="mt-8 flex flex-col gap-3 items-stretch max-w-sm mx-auto">
          <button className="btn btn-primary" onClick={onSkip}>
            Я с нуля, пропустить
          </button>
          <button className="btn btn-secondary" onClick={() => setIdx(0)}>
            Быстрый тест: 3 вопроса
          </button>
        </div>
      </div>
    );
  }

  const q = LEVEL_QUIZ[idx];

  return (
    <div className="text-center">
      <div className="text-sm text-ink-400">Вопрос {idx + 1} из {LEVEL_QUIZ.length}</div>
      <h2 className="mt-3 text-xl font-bold">Что значит это?</h2>
      <div className="mt-4 p-6 rounded-xl bg-ink-900 border border-ink-800 text-2xl font-bold">
        {q.en}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 max-w-md mx-auto">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className="p-3 rounded-xl border-2 border-ink-800 hover:border-brand-500 hover:bg-brand-500/10 transition text-left"
            onClick={() => {
              const correct = i === q.correct;
              const newScore = score + (correct ? 1 : 0);
              if (idx + 1 >= LEVEL_QUIZ.length) {
                const level = newScore >= 3 ? 'B1' : newScore >= 2 ? 'A2' : 'A1';
                onFinish(level);
              } else {
                setScore(newScore);
                setIdx(idx + 1);
              }
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step5MiniLesson({
  speak,
  play,
  onNext,
}: {
  speak: (t: string) => Promise<void>;
  play: (s: any) => void;
  onNext: () => void;
}) {
  const [phase, setPhase] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (phase === 0) speak('Dog');
    if (phase === 1) speak('Cat');
  }, [phase, speak]);

  if (phase === 0 || phase === 1) {
    const isDog = phase === 0;
    return (
      <div className="text-center">
        <div className="text-sm text-ink-400 mb-2">Шаг {phase + 1} из 5</div>
        <div className="card p-8 max-w-md mx-auto">
          <div className="text-7xl mb-4">{isDog ? '🐕' : '🐈'}</div>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="text-3xl font-bold">{isDog ? 'dog' : 'cat'}</div>
            <SpeakButton text={isDog ? 'dog' : 'cat'} />
          </div>
          <div className="text-ink-300 text-lg">{isDog ? 'собака' : 'кошка'}</div>
        </div>
        <button
          className="btn btn-primary mt-6"
          onClick={() => {
            play('click');
            setPhase(phase + 1);
          }}
        >
          Понял <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (phase === 2 || phase === 3) {
    const isDog = phase === 2;
    const word = isDog ? 'dog' : 'cat';
    return (
      <div className="text-center">
        <div className="text-sm text-ink-400 mb-2">Шаг {phase + 1} из 5</div>
        <div className="text-3xl font-bold mb-2">{word}</div>
        <SpeakButton text={word} className="mx-auto mb-6" />
        <p className="text-ink-300 mb-4">Выбери картинку:</p>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {[
            { emoji: '🐕', val: 'dog' },
            { emoji: '🐈', val: 'cat' },
          ].map((o) => (
            <button
              key={o.val}
              className="p-8 rounded-xl border-2 border-ink-800 hover:border-brand-500 hover:bg-brand-500/10 transition text-7xl"
              onClick={() => {
                const correct = o.val === word;
                if (correct) {
                  play('correct');
                  setPhase(phase + 1);
                } else {
                  play('wrong');
                }
              }}
            >
              {o.emoji}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 4) {
    return (
      <div className="text-center">
        <div className="text-sm text-ink-400 mb-2">Шаг 5 из 5</div>
        <Mascot mood="happy" size={100} />
        <div className="mt-4 card p-6 max-w-lg mx-auto">
          <div className="text-2xl font-bold">I have a dog</div>
          <SpeakButton text="I have a dog" className="mx-auto my-3" />
          <div className="text-ink-300">У меня есть собака</div>
        </div>
        <button
          className="btn btn-primary mt-6"
          onClick={() => {
            play('complete');
            setShowConfetti(true);
            setTimeout(() => setPhase(5), 1500);
          }}
        >
          Завершить <Check size={16} />
        </button>
        {showConfetti && <Confetti />}
      </div>
    );
  }

  return (
    <div className="text-center">
      <Confetti />
      <Mascot mood="celebrate" size={140} />
      <h2 className="mt-4 text-3xl font-bold">Молодец!</h2>
      <p className="mt-2 text-ink-300 text-lg">Ты выучил 2 первых слова</p>
      <div className="mt-6 flex justify-center gap-4">
        <Badge icon={<Star size={18} className="text-yellow-400" />} value="+10 XP" />
        <Badge icon={<Flame size={18} className="text-orange-400" />} value="streak 1" />
      </div>
      <button className="btn btn-primary mt-8" onClick={onNext}>
        Дальше <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Badge({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-ink-900 border border-ink-700 px-4 py-2 rounded-full font-semibold">
      {icon}
      {value}
    </div>
  );
}

function Step6({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <div className="text-center">
        <Mascot mood="happy" size={100} />
        <h2 className="mt-3 text-2xl font-bold">Как это работает</h2>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 max-w-lg mx-auto">
        <Tip icon={<Star className="text-yellow-400" />} title="XP" text="Опыт. За каждый правильный ответ растёт." />
        <Tip icon={<Flame className="text-orange-400" />} title="Streak" text="Огонёк. Сохраняется, если занимаешься каждый день." />
        <Tip icon={<Heart className="text-red-400" />} title="Сердца" text="Если ошибся 5 раз, придётся подождать. Не страшно." />
      </div>
      <div className="text-center mt-8">
        <button className="btn btn-primary" onClick={onNext}>
          Понятно <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function Tip({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-ink-800 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-ink-300">{text}</div>
      </div>
    </div>
  );
}

function Step7({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="text-center">
      <Mascot mood="celebrate" size={140} />
      <h2 className="mt-4 text-3xl font-bold">Ты готов!</h2>
      <p className="mt-3 text-ink-300 text-lg">Открываю карту уроков</p>
      <button className="btn btn-primary mt-8 px-8 text-lg" onClick={onFinish}>
        Начать обучение <ArrowRight size={18} />
      </button>
    </div>
  );
}
