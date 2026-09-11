import { AnimatePresence, motion } from 'motion/react';
import { useToasts } from '../store/toast';
import { ease } from '../lib/motion';

const KIND_CLASS = {
  info: 'border-brand-2/40 bg-surface-2 glow-brand-sm',
  success: 'border-success/50 bg-surface-2 shadow-[0_0_18px_-6px_var(--color-success)]',
  danger: 'border-danger/50 bg-surface-2 shadow-[0_0_18px_-6px_var(--color-danger)]',
};

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 flex flex-col items-center gap-2 px-3 md:bottom-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={ease}
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm shadow-pop ${KIND_CLASS[t.kind]}`}
          >
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.run();
                  dismiss(t.id);
                }}
                className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold text-white [background-image:var(--gradient-brand)] hover:brightness-110"
              >
                {t.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
