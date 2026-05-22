import { Volume2 } from 'lucide-react';
import { useState } from 'react';
import { useTTS } from '@/hooks/useTTS';
import { cn } from '@/lib/utils';

interface Props {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  autoPlay?: boolean;
}

export function SpeakButton({ text, size = 'md', className }: Props) {
  const { speak } = useTTS();
  const [playing, setPlaying] = useState(false);

  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;

  return (
    <button
      onClick={async () => {
        setPlaying(true);
        try {
          await speak(text);
        } finally {
          setPlaying(false);
        }
      }}
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-500/15 hover:bg-brand-500/25 text-brand-200 transition active:scale-95',
        sizeMap[size],
        playing && 'animate-pulse',
        className,
      )}
      aria-label="Озвучить"
    >
      <Volume2 size={iconSize} />
    </button>
  );
}
