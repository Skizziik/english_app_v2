import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Mood = 'happy' | 'thinking' | 'celebrate' | 'sad' | 'wave';

interface Props {
  mood?: Mood;
  size?: number;
  className?: string;
}

export function Mascot({ mood = 'happy', size = 120, className }: Props) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      className={cn('relative inline-block', className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#1c83f5" />
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="65" rx="44" ry="42" fill="url(#bodyGrad)" />
        <ellipse cx="60" cy="100" rx="32" ry="6" fill="rgba(0,0,0,0.25)" />
        <circle cx="46" cy="60" r="6.5" fill="#0f172a" />
        <circle cx="74" cy="60" r="6.5" fill="#0f172a" />
        <circle cx="48" cy="58" r="2" fill="white" />
        <circle cx="76" cy="58" r="2" fill="white" />
        {mood === 'happy' && (
          <path d="M48 78 Q60 88 72 78" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
        )}
        {mood === 'celebrate' && (
          <path d="M44 74 Q60 92 76 74" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="#fbbf24" />
        )}
        {mood === 'thinking' && (
          <path d="M50 80 L70 80" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
        )}
        {mood === 'sad' && (
          <path d="M48 84 Q60 76 72 84" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
        )}
        {mood === 'wave' && (
          <path d="M48 78 Q60 86 72 78" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
        )}
        <circle cx="36" cy="40" r="3" fill="#fff" opacity="0.4" />
        <circle cx="84" cy="42" r="2" fill="#fff" opacity="0.3" />
      </svg>
      {mood === 'celebrate' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Sparkle x={10} y={10} delay={0} />
          <Sparkle x={90} y={5} delay={0.2} />
          <Sparkle x={5} y={70} delay={0.4} />
          <Sparkle x={100} y={80} delay={0.6} />
        </motion.div>
      )}
    </motion.div>
  );
}

function Sparkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.span
      className="absolute text-yellow-300"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, rotate: 0 }}
      animate={{ scale: [0, 1.2, 1, 0], rotate: 360 }}
      transition={{ duration: 1.4, delay, repeat: Infinity, repeatDelay: 0.5 }}
    >
      ✦
    </motion.span>
  );
}
