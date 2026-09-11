import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BuildingGroup } from '../lib/engine/grouping';
import type { ResearchGroup } from '../lib/engine/research';
import type { VillageResources } from '../lib/appTypes';
import { formatDuration } from '../lib/engine/totals';
import { buildingName } from '../lib/labels';
import { BuildingIcon } from './BuildingIcon';
import { Button } from './ui/Button';
import { ResourceAmount, ResourceTotalsRow } from './ResourceAmount';

interface Props {
  group: BuildingGroup | ResearchGroup;
  resources?: VillageResources;
  showLocked: boolean;
  shortHall: string;
  onBump: (instanceId: string, toLevel: number) => void;
  onWish: () => void;
}

export function BuildingGroupCard({ group, resources, showLocked, shortHall, onBump, onWish }: Props) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const min = group.copyLevels[0];
  const max = group.copyLevels[group.copyLevels.length - 1];
  const name = buildingName(group.key, group.name, i18n.language);

  const next = group.next;
  const affordable =
    next && resources ? (resources[next.resource as keyof VillageResources] ?? 0) >= next.cost : false;

  const steps = showLocked ? [...group.steps, ...group.stepsLocked] : group.steps;

  return (
    <li
      className={`rounded-xl border bg-surface ${group.wished ? 'border-brand-2/50 glow-brand-sm' : 'border-border'}`}
    >
      <div className="flex items-center gap-3 p-3">
        <BuildingIcon icon={group.icon} name={group.name} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onWish}
              aria-label={t(group.wished ? 'planner.removeWish' : 'planner.addWish')}
              className={`shrink-0 text-sm leading-none ${group.wished ? 'text-brand-2 [text-shadow:0_0_8px_var(--color-brand-2)]' : 'text-ink-dim/40 hover:text-ink-dim'}`}
            >
              {group.wished ? '★' : '☆'}
            </button>
            <span className="truncate text-sm font-medium">{name}</span>
            {group.count > 1 && <span className="text-xs text-ink-dim">×{group.count}</span>}
          </div>
          <div className="text-xs text-ink-dim">
            {t('common.levelShort')} {min === max ? min : `${min}–${max}`}
            <span className="text-ink-dim/60"> → {group.target}</span>
          </div>
        </div>
        {next && (
          <Button
            variant="primary"
            size="sm"
            className="shrink-0"
            onClick={() => onBump(group.instanceIds[0], group.copyLevels[0] + 1)}
          >
            +1
          </Button>
        )}
      </div>

      {next && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 px-3 py-2 text-xs">
          <span className="font-semibold text-ink-dim">{t('upgrades.next')}</span>
          <span>{t('upgrades.step', { from: next.fromLevel, to: next.toLevel })}</span>
          <ResourceAmount resource={next.resource} amount={next.cost} />
          {next.timeSeconds > 0 && <span className="text-ink-dim">{formatDuration(next.timeSeconds)}</span>}
          {affordable && <span className="rounded bg-success/15 px-1.5 text-success">{t('upgrades.affordable')}</span>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-3 py-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-ink-dim/70">{t('upgrades.totalRemaining')}</span>
          <ResourceTotalsRow totals={group.totalByResource} exact />
        </div>
        <button onClick={() => setOpen((v) => !v)} className="self-end text-xs font-medium text-brand-2 hover:text-brand-3">
          {open ? '▾' : '▸'} {steps.length}
        </button>
      </div>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-border/60 p-2">
          {steps.map((s, idx) => (
            <li
              key={s.instanceId + '-' + s.toLevel + '-' + idx}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${s.locked ? 'opacity-50' : ''}`}
            >
              <span className="flex-1">{t('upgrades.step', { from: s.fromLevel, to: s.toLevel })}</span>
              {s.quantity > 1 && <span className="text-ink-dim">×{s.quantity}</span>}
              <ResourceAmount resource={s.resource} amount={s.cost} />
              {s.locked ? (
                <span className="text-warn/80">{shortHall} {s.unlocksAtHall}</span>
              ) : (
                <button
                  onClick={() => onBump(s.instanceId, s.toLevel)}
                  className="rounded bg-surface-2 px-1.5 py-0.5 text-ink-dim transition-colors hover:bg-surface-3 hover:text-success"
                >
                  ✓
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
