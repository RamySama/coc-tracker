import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = '✨', title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-brand-2/25 bg-surface/50 px-6 py-12 text-center">
      <div className="text-3xl" aria-hidden>
        {icon}
      </div>
      <div className="max-w-xs">
        <p className="font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-dim">{description}</p>}
      </div>
      {action}
    </div>
  );
}
