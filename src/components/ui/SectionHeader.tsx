import type { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  count?: number;
  action?: ReactNode;
  sticky?: boolean;
}

export function SectionHeader({ title, count, action, sticky }: Props) {
  return (
    <div
      className={`flex items-center justify-between gap-2 ${
        sticky ? 'sticky top-0 z-[5] -mx-1 bg-bg/85 px-1 py-1.5 backdrop-blur' : ''
      }`}
    >
      <h2 className="text-sm font-semibold text-ink-dim">
        {title}
        {count != null && <span className="ml-1.5 text-ink-dim/50">{count}</span>}
      </h2>
      {action}
    </div>
  );
}
