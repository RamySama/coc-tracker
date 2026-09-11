import type { ReactNode } from 'react';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  id?: string;
}

/** Interrupteur (toggle) — CSS pur via `group-has`. */
export function Switch({ checked, onChange, label, id }: Props) {
  return (
    <label
      htmlFor={id}
      className="group inline-flex cursor-pointer select-none items-center gap-2 text-xs text-ink-dim"
    >
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={`relative h-5 w-9 shrink-0 rounded-full transition-all group-has-[:focus-visible]:outline group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-brand-2 ${
          checked ? 'switch-on' : 'bg-surface-3'
        }`}
      >
        <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200 group-has-[:checked]:translate-x-4" />
      </span>
      {label}
    </label>
  );
}
