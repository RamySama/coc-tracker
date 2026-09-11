import { useReducedMotion } from 'motion/react';
import type { PointerEvent } from 'react';

/** Pilote le halo radial qui suit le curseur (`--mx` / `--my` sur l'élément). */
export function useSpotlight() {
  const reduce = useReducedMotion();
  if (reduce) return { onPointerMove: undefined };
  return {
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    },
  };
}
