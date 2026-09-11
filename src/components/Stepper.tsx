interface Props {
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const DIM = {
  sm: { btn: 'size-7 text-base', input: 'w-11 py-1 text-sm' },
  md: { btn: 'size-9 text-lg', input: 'w-12 py-1' },
  lg: { btn: 'size-12 text-2xl', input: 'w-16 py-2 text-lg' },
};

export function Stepper({ value, min = 0, max, onChange, size = 'md' }: Props) {
  const btn =
    'flex items-center justify-center rounded-md bg-surface-2 text-ink transition-all hover:bg-surface-3 hover:text-brand-3 active:scale-95 disabled:opacity-30 disabled:hover:text-ink';
  const dim = DIM[size];
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" className={`${btn} ${dim.btn}`} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="-1">
        −
      </button>
      <input
        type="number"
        className={`rounded-md bg-surface-2 text-center tabular-nums outline-none focus:ring-2 focus:ring-brand-2/50 ${dim.input}`}
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
      />
      <button type="button" className={`${btn} ${dim.btn}`} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="+1">
        +
      </button>
    </div>
  );
}
