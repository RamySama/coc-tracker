import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ease } from '../lib/motion';

interface Props {
  open: boolean;
  onToggle: () => void;
  header: ReactNode;
  children: ReactNode;
  id?: string;
  glow?: boolean;
}

/** Ligne de liste avec un panneau qui se déplie (animé). */
export function CollapsibleRow({ open, onToggle, header, children, id, glow }: Props) {
  return (
    <div
      id={id}
      className={`overflow-hidden rounded-xl border border-border bg-surface shadow-card ${glow ? 'glow-maxed' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface-2/40 ${open ? 'bg-surface-2/40' : ''}`}
      >
        {header}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={ease}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
