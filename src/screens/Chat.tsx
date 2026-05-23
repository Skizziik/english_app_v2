import { useEffect, useRef, useState } from 'react';
import { Send, Mic, Sparkles } from 'lucide-react';
import { SpeakButton } from '@/components/SpeakButton';
import { useSTT } from '@/hooks/useSTT';
import { useTTS } from '@/hooks/useTTS';
import { useUserStore } from '@/stores/userStore';
import { useSettings } from '@/stores/settingsStore';
import { toast } from 'sonner';

const SCENARIOS = [
  {
    id: 'intro',
    title: 'Знакомство',
    role: 'a new neighbor',
    level: 'A1',
    description: 'Простой диалог: имя, город, возраст',
  },
  {
    id: 'cafe',
    title: 'В кафе',
    role: 'a friendly waiter',
    level: 'A1',
    description: 'Заказ напитков и еды',
  },
  {
    id: 'travel',
    title: 'Путешествие',
    role: 'a hotel receptionist',
    level: 'A2',
    description: 'Заселение в отель',
  },
  {
    id: 'shop',
    title: 'Магазин одежды',
    role: 'a shop assistant',
    level: 'A2',
    description: 'Купить вещи, спросить размер',
  },
  {
    id: 'doctor',
    title: 'У врача',
    role: 'a doctor',
    level: 'B1',
    description: 'Жалобы, симптомы',
  },
];

interface Msg {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function Chat() {
  const user = useUserStore((s) => s.user);
  const autoPlay = useSettings((s) => s.autoPlayAudio);
  const { speak } = useTTS();
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const stt = useSTT((text) => setInput((prev) => (prev ? prev + ' ' + text : text)));
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdx = useRef<number>(-1);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);

  useEffect(() => {
    if (scenario) {
      const sys = `You are a friendly ${scenario.role} in this scenario: ${scenario.title} (${scenario.description}). Speak in simple English appropriate for ${scenario.level} level. The user is learning English. If they make grammar mistakes, gently correct them. Use only vocabulary they likely know. After each user message, respond naturally and ask a follow-up question. Reply in 1-3 sentences max. If the user writes in Russian, gently encourage them to try in English and provide the English phrase they might need. Do not use em-dashes or en-dashes.`;
      setMessages([
        { role: 'system', content: sys },
        { role: 'assistant', content: greetingFor(scenario.id) },
      ]);
    }
  }, [scenarioId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    if (!autoPlay) return;
    const lastIdx = messages.length - 1;
    const last = messages[lastIdx];
    if (last?.role === 'assistant' && lastIdx > lastSpokenIdx.current) {
      lastSpokenIdx.current = lastIdx;
      speak(last.content).catch(() => {});
    }
  }, [messages, autoPlay]);

  async function send() {
    if (!input.trim() || sending) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);
    try {
      const reply = (await window.api.mistral.chat({ messages: newMessages, model: 'smart' })) as string;
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      toast.error(err?.message || 'AI недоступен');
    } finally {
      setSending(false);
    }
  }

  if (!scenarioId) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Диалог с AI</h1>
        <p className="text-ink-400 mb-6">Выбери сценарий и начни говорить по-английски.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenarioId(s.id)}
              className="card p-5 text-left hover:border-brand-500 transition"
            >
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-bold">{s.title}</h3>
                <span className="chip">{s.level}</span>
              </div>
              <p className="text-sm text-ink-400">{s.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-ink-800 flex items-center gap-3">
        <button onClick={() => setScenarioId(null)} className="btn btn-ghost text-sm">
          ← Сменить
        </button>
        <div>
          <div className="font-bold">{scenario?.title}</div>
          <div className="text-xs text-ink-400">{scenario?.description}</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3 max-w-3xl mx-auto w-full">
        {messages
          .filter((m) => m.role !== 'system')
          .map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  m.role === 'user' ? 'bg-brand-500 text-white' : 'bg-ink-900 border border-ink-800'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="text-xs text-brand-300 mb-1 flex items-center gap-1">
                    <Sparkles size={12} /> AI
                  </div>
                )}
                <div>{m.content}</div>
                {m.role === 'assistant' && <SpeakButton text={m.content} size="sm" className="mt-2" />}
              </div>
            </div>
          ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-ink-900 border border-ink-800 p-3 rounded-2xl text-ink-400 text-sm animate-pulse">
              AI печатает...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-ink-800 max-w-3xl mx-auto w-full">
        <div className="flex gap-2">
          <button
            onClick={() => (stt.listening ? stt.stop() : stt.start())}
            className={`btn ${stt.listening ? 'btn-danger animate-pulse' : 'btn-secondary'} px-3`}
            disabled={!stt.supported}
          >
            <Mic size={16} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Напечатай или произнеси..."
            className="flex-1 px-4 py-2 rounded-xl bg-ink-900 border border-ink-700 focus:border-brand-500 outline-none"
          />
          <button onClick={send} className="btn btn-primary" disabled={sending || !input.trim()}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function greetingFor(scenarioId: string): string {
  switch (scenarioId) {
    case 'intro':
      return "Hi there! I'm your new neighbor. What is your name?";
    case 'cafe':
      return 'Good afternoon! Welcome to our cafe. What can I get for you?';
    case 'travel':
      return 'Hello! Welcome to our hotel. Do you have a reservation?';
    case 'shop':
      return 'Hi! Looking for anything in particular today?';
    case 'doctor':
      return "Good morning. What brings you here today? How are you feeling?";
    default:
      return 'Hello! How are you today?';
  }
}
