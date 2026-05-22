import { cn } from '@/lib/utils';

interface Props {
  value: number;
  max: number;
  className?: string;
  color?: 'brand' | 'green' | 'orange';
  showLabel?: boolean;
}

export function ProgressBar({ value, max, className, color = 'brand', showLabel = false }: Props) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  const colorClass =
    color === 'green' ? 'bg-accent-green' : color === 'orange' ? 'bg-orange-400' : 'bg-brand-500';
  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
        <div className={cn('h-full transition-all duration-300', colorClass)} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-ink-400 text-right tabular-nums">
          {value} / {max}
        </div>
      )}
    </div>
  );
}
