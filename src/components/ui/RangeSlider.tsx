import type { CSSProperties } from 'react';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  'aria-label'?: string;
}

/** `<input type=range>` avec piste remplie en doré jusqu'au pouce (style dans index.css). */
export function RangeSlider({ value, min, max, step = 1, onChange, ...rest }: Props) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className="coc-range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ '--pct': `${pct}%` } as CSSProperties}
      {...rest}
    />
  );
}
