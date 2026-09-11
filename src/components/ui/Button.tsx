import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSpotlight } from '../../hooks/useSpotlight';

type Variant = 'primary' | 'glow' | 'ghost' | 'soft' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-xs gap-1 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
};

const VARIANT: Record<Variant, string> = {
  primary:
    'spotlight text-white font-semibold glow-brand hover:brightness-110 [background-image:var(--gradient-brand)] [text-shadow:0_1px_2px_rgb(0_0_0/0.45)]',
  glow: 'ring-anim text-ink font-semibold hover:brightness-110',
  ghost: 'border border-border text-ink-dim hover:text-ink hover:border-brand-2/60',
  soft: 'bg-surface-2 text-ink hover:bg-surface-3',
  danger: 'bg-danger/15 text-danger hover:bg-danger/25 border border-danger/30',
};

const BASE =
  'inline-flex select-none items-center justify-center whitespace-nowrap transition-[filter,transform,background-color,box-shadow] active:scale-[.97] disabled:pointer-events-none disabled:opacity-45';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: Variant;
  size?: Size;
  /** rend un <Link> react-router au lieu d'un <button> */
  to?: string;
  className?: string;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', to, className = '', children, ...rest },
  ref,
) {
  const spotlight = useSpotlight();
  const cls = `${BASE} ${SIZE[size]} ${VARIANT[variant]} ${className}`;
  const spot = variant === 'primary' ? spotlight : {};

  if (to) {
    return (
      <Link to={to} className={cls} {...spot} {...(rest as Record<string, unknown>)}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} className={cls} {...spot} {...rest}>
      {children}
    </button>
  );
});
