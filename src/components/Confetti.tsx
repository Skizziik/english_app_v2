import { motion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['#33a3ff', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#f97316'];

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        rot: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
        duration: 1.2 + Math.random() * 1.6,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-5%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rot, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
