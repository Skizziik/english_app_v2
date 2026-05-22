import { Mascot } from '@/components/layout/Mascot';

export default function About() {
  return (
    <div className="p-8 max-w-2xl mx-auto text-center">
      <Mascot mood="happy" size={120} />
      <h1 className="mt-4 text-3xl font-bold">LinguaForge</h1>
      <p className="mt-2 text-ink-300">Версия 1.0.0</p>
      <p className="mt-6 text-ink-400">
        Нативное Mac приложение для изучения английского с нуля. Все данные хранятся локально. Mistral для AI функций.
      </p>
      <p className="mt-2 text-ink-500 text-sm">
        Открытый репозиторий: https://github.com/Skizziik/english_app_v2
      </p>
    </div>
  );
}
