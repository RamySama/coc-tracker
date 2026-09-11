import { useReducedMotion } from 'motion/react';
import type { Transition, Variants } from 'motion/react';

/** Transition standard de l'app (respecte prefers-reduced-motion via le hook ci-dessous). */
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 32, mass: 0.7 };
export const ease: Transition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

/** Panneau qui se déplie sous une carte (hauteur + fondu). */
export const collapseVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  show: { height: 'auto', opacity: 1 },
};

/** Entrée/sortie d'une ligne de liste. */
export const rowVariants: Variants = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: 12, transition: { duration: 0.15 } },
};

/** true si l'utilisateur préfère moins d'animation — à utiliser pour désactiver les gros mouvements. */
export function useReduceMotion(): boolean {
  return useReducedMotion() ?? false;
}
