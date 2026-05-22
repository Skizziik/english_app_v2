import { useEffect, useState } from 'react';
import { useSettings } from '@/stores/settingsStore';
import { useUserStore } from '@/stores/userStore';
import { useTTS } from '@/hooks/useTTS';
import { toast } from 'sonner';

export default function Settings() {
  const settings = useSettings();
  const { user } = useUserStore();
  const { speak } = useTTS();
  const [voices, setVoices] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const list = (await window.api.tts.listVoices()) as Array<{ id: string; name: string; lang: string }>;
        setVoices(list);
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Настройки</h1>

      <Section title="Пользователь">
        <Row label="Имя" value={user?.name || '-'} />
        <Row label="Уровень" value={user?.currentLevel ?? 'A0'} />
        <Row label="Цель в день" value={`${user?.dailyGoalMinutes ?? 10} минут`} />
      </Section>

      <Section title="Озвучка">
        <SelectRow
          label="Голос macOS"
          value={settings.preferredVoice}
          onChange={(v) => settings.update({ preferredVoice: v })}
          options={voices.map((v) => ({ value: v.id, label: v.name }))}
        />
        <SliderRow
          label="Скорость речи"
          value={settings.voiceRate}
          min={120}
          max={280}
          step={10}
          onChange={(v) => settings.update({ voiceRate: v })}
        />
        <ToggleRow
          label="Использовать macOS say"
          value={settings.useMacSay}
          onChange={(v) => settings.update({ useMacSay: v })}
        />
        <button className="btn btn-secondary mt-2" onClick={() => speak('Hello! This is a test of the LinguaForge voice.')}>
          Проверить голос
        </button>
      </Section>

      <Section title="Интерфейс">
        <ToggleRow label="Звуки эффекты" value={settings.soundEffects} onChange={(v) => settings.update({ soundEffects: v })} />
        <ToggleRow label="Анимации" value={settings.animations} onChange={(v) => settings.update({ animations: v })} />
        <ToggleRow label="Авто-озвучка слов" value={settings.autoPlayAudio} onChange={(v) => settings.update({ autoPlayAudio: v })} />
        <ToggleRow label="Показывать транскрипцию IPA" value={settings.showIpa} onChange={(v) => settings.update({ showIpa: v })} />
      </Section>

      <Section title="Обучение">
        <ToggleRow
          label="Сердца (отключи для бесконечного режима)"
          value={settings.heartsEnabled}
          onChange={(v) => settings.update({ heartsEnabled: v })}
        />
        <SliderRow
          label="Целевая ретенция SRS"
          value={Math.round(settings.fsrsRetention * 100)}
          min={85}
          max={95}
          step={1}
          format={(v) => `${v}%`}
          onChange={(v) => settings.update({ fsrsRetention: v / 100 })}
        />
      </Section>

      <Section title="Опасно">
        <button
          className="btn btn-danger"
          onClick={async () => {
            if (confirm('Точно сбросить весь прогресс? Это необратимо.')) {
              toast.info('Для полного сброса удалите ~/Library/Application Support/LinguaForge/data.db и перезапустите приложение.');
            }
          }}
        >
          Сбросить прогресс
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 mb-4">
      <h2 className="text-sm uppercase tracking-wider text-ink-400 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-300">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-ink-200">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-6 rounded-full relative transition ${value ? 'bg-brand-500' : 'bg-ink-700'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${value ? 'left-[18px]' : 'left-0.5'}`}
        />
      </button>
    </label>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-200">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 rounded-lg bg-ink-800 border border-ink-700 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-ink-200">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-500"
      />
    </div>
  );
}
