import { useTranslation } from 'react-i18next';
import type { Resource } from '../lib/engine/types';
import { RESOURCE_ORDER } from '../lib/labels';
import { formatNumber } from '../lib/engine/totals';
import type { ResourceTotals } from '../lib/engine/totals';
import { ResourceIcon } from './ResourceIcon';

export function ResourceAmount({
  resource,
  amount,
  exact = false,
  showLabel = true,
}: {
  resource: Resource;
  amount: number;
  exact?: boolean;
  showLabel?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums">
      <ResourceIcon resource={resource} />
      <span>{exact ? amount.toLocaleString('fr-FR') : formatNumber(amount)}</span>
      {showLabel && <span className="text-ink-dim">{t(`resource.${resource}`)}</span>}
    </span>
  );
}

export function ResourceTotalsRow({ totals, exact = false }: { totals: ResourceTotals; exact?: boolean }) {
  const entries = RESOURCE_ORDER.filter((r) => (totals[r] ?? 0) > 0);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
      {entries.map((r) => (
        <ResourceAmount key={r} resource={r} amount={totals[r]!} exact={exact} />
      ))}
    </div>
  );
}
