import { useUserStore } from '@/stores/userStore';
import { Flame, Heart, Star, Gem } from 'lucide-react';

interface Props {
  showNav: boolean;
}

export function TitleBar({ showNav }: Props) {
  const stats = useUserStore((s) => s.stats);

  return (
    <div
      className="titlebar-drag h-9 bg-ink-900/95 backdrop-blur border-b border-ink-800 flex items-center justify-between pl-20 pr-4 select-none text-xs"
      style={{ height: 'var(--titlebar-h)' }}
    >
      <div className="flex items-center gap-2 text-ink-300 font-semibold">
        <span className="text-brand-400">LinguaForge</span>
      </div>
      {showNav && stats && (
        <div className="titlebar-no-drag flex items-center gap-4 text-ink-200">
          <Stat icon={<Flame size={14} className="text-orange-400" />} value={stats.currentStreak} />
          <Stat icon={<Heart size={14} className="text-red-400" />} value={stats.hearts} />
          <Stat icon={<Star size={14} className="text-yellow-400" />} value={stats.totalXp} />
          <Stat icon={<Gem size={14} className="text-cyan-400" />} value={stats.gems} />
        </div>
      )}
    </div>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
