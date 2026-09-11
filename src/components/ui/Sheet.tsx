import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ease } from '../../lib/motion';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Feuille modale : glisse depuis le bas sur mobile, popover centré sur desktop. */
export function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={ease}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative max-h-[85svh] w-full overflow-y-auto rounded-t-2xl border border-brand-2/30 bg-surface shadow-pop [box-shadow:var(--shadow-pop),0_0_40px_-12px_var(--color-brand-2)] sm:max-w-md sm:rounded-2xl"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={ease}
          >
            <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border sm:hidden" />
            {title && <h2 className="px-4 pt-3 text-sm font-semibold text-ink-dim">{title}</h2>}
            <div className="p-3">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
