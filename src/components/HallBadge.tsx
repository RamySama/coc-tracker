import { useTranslation } from 'react-i18next';
import type { Base } from '../lib/engine/types';
import { hallShortKey } from '../lib/labels';

export function HallBadge({ base, level, className = '' }: { base: Base; level: number; className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-semibold text-ink-dim ${className}`}
    >
      {t(hallShortKey(base))} {level}
    </span>
  );
}
