import type { ComponentPropsWithoutRef } from 'react';

interface Props extends ComponentPropsWithoutRef<'div'> {
  inset?: boolean;
  /** liseré dégradé marque + halo */
  glow?: boolean;
}

/** Surface standard : fond, bordure, rayon, ombre douce. */
export function Card({ inset = true, glow = false, className = '', ...rest }: Props) {
  return (
    <div
      className={`rounded-xl bg-surface shadow-card ${
        glow ? 'border-brand glow-brand-sm border border-transparent' : 'border border-border'
      } ${inset ? 'p-4' : ''} ${className}`}
      {...rest}
    />
  );
}
