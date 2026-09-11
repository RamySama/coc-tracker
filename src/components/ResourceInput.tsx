import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Resource } from '../lib/engine/types';
import { formatNumber } from '../lib/engine/totals';
import { ResourceIcon } from './ResourceIcon';

interface Props {
  resource: Resource;
  value: number;
  max?: number | null;
  onCommit: (v: number) => void;
}

/** Champ de saisie d'un stock de ressource (commit au blur). */
export function ResourceInput({ resource, value, max, onCommit }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(String(value || ''));

  useEffect(() => {
    setDraft(String(value || ''));
  }, [value]);

  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs text-ink-dim">
        <ResourceIcon resource={resource} />
        {t(`resource.${resource}`)}
      </span>
      <input
        inputMode="numeric"
        className="w-full rounded-lg bg-surface-2 px-2.5 py-1.5 text-sm tabular-nums outline-none focus:ring-2 focus:ring-gold/50"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
        onBlur={() => onCommit(Number(draft) || 0)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        placeholder="0"
      />
      {max ? <span className="text-[10px] text-ink-dim/60">/ {formatNumber(max)}</span> : null}
    </label>
  );
}
