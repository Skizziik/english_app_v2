import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title?: string;
  prompt: React.ReactNode;
  children: React.ReactNode;
  feedback?: { correct: boolean; message?: string } | null;
  showContinue?: boolean;
  onContinue?: () => void;
  continueLabel?: string;
}

export function ExerciseShell({ title, prompt, children, feedback, showContinue, onContinue, continueLabel }: Props) {
  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        {title && <h2 className="text-sm uppercase tracking-wider text-ink-400 mb-4">{title}</h2>}
        <div className="mb-6">{prompt}</div>
        <div>{children}</div>
      </div>
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className={cn(
              'absolute bottom-0 left-0 right-0 p-6 border-t-2',
              feedback.correct ? 'bg-green-900/40 border-green-500' : 'bg-red-900/40 border-red-500',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    feedback.correct ? 'bg-green-500' : 'bg-red-500',
                  )}
                >
                  {feedback.correct ? <Check size={22} className="text-white" /> : <X size={22} className="text-white" />}
                </div>
                <div>
                  <div className="font-bold text-lg">{feedback.correct ? 'Отлично!' : 'Почти!'}</div>
                  {feedback.message && <div className="text-sm text-ink-200">{feedback.message}</div>}
                </div>
              </div>
              {showContinue && (
                <button onClick={onContinue} className={cn('btn px-6', feedback.correct ? 'btn-success' : 'btn-danger')}>
                  {continueLabel ?? 'Дальше'} <ArrowRight size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
