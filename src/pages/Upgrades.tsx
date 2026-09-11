import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVillages } from '../store/villages';
import { useCurrentVillage } from '../hooks/useCurrentVillage';
import { useSaveToast } from '../hooks/useSaveToast';
import { groupPendingByBuilding } from '../lib/engine/grouping';
import { groupResearch } from '../lib/engine/research';
import { sortCategories } from '../lib/engine/catalog';
import { formatDuration, sumByResource, wallClockSeconds } from '../lib/engine/totals';
import { buildingName, hallLongKey, RESOURCE_ORDER } from '../lib/labels';
import { toEngineVillage } from '../hooks/useVillageEngine';
import { BuildingGroupCard } from '../components/BuildingGroupCard';
import { ResourceTotalsRow } from '../components/ResourceAmount';
import { EmptyState } from '../components/ui/EmptyState';
import { Onboarding } from './Onboarding';
import type { Resource } from '../lib/engine/types';

type Sort = 'nextCost' | 'totalCost' | 'time' | 'hall' | 'category';

export function Upgrades() {
  const { t, i18n } = useTranslation();
  const village = useCurrentVillage();
  const setBuilding = useVillages((s) => s.setBuilding);
  const setResearch = useVillages((s) => s.setResearch);
  const toggleWishlist = useVillages((s) => s.toggleWishlist);
  const saveToast = useSaveToast();

  const [sort, setSort] = useState<Sort>('nextCost');
  const [showLocked, setShowLocked] = useState(false);
  const [cat, setCat] = useState('all');
  const [res, setRes] = useState<Resource | 'all'>('all');
  const [wishedOnly, setWishedOnly] = useState(false);

  const groups = useMemo(() => {
    if (!village) return [];
    const ev = toEngineVillage(village);
    return [
      ...groupPendingByBuilding(ev, { includeLocked: showLocked }),
      ...groupResearch(ev, { includeLocked: showLocked }),
    ];
  }, [village, showLocked]);

  const cats = useMemo(() => sortCategories([...new Set(groups.map((g) => g.category))]), [groups]);

  const hasWishes = groups.some((g) => g.wished);

  const rows = useMemo(() => {
    let list = groups;
    if (cat !== 'all') list = list.filter((g) => g.category === cat);
    if (res !== 'all') list = list.filter((g) => (g.totalByResource[res] ?? 0) > 0);
    if (wishedOnly) list = list.filter((g) => g.wished);
    const cmp = (a: (typeof list)[number], b: (typeof list)[number]) => {
      if (sort === 'nextCost') return (a.next?.cost ?? Infinity) - (b.next?.cost ?? Infinity);
      if (sort === 'totalCost') {
        const sum = (x: typeof a) => Object.values(x.totalByResource).reduce((s, v) => s + (v ?? 0), 0);
        return sum(b) - sum(a);
      }
      if (sort === 'time') return b.totalBuilderSeconds - a.totalBuilderSeconds;
      if (sort === 'hall') return (a.next?.unlocksAtHall ?? 0) - (b.next?.unlocksAtHall ?? 0);
      return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    };
    // les objectifs (★) remontent toujours en tête
    return [...list].sort((a, b) => Number(b.wished) - Number(a.wished) || cmp(a, b));
  }, [groups, cat, res, sort, wishedOnly]);

  if (!village || !village.buildings) return <Onboarding />;

  const hallName = t(hallLongKey(village.base));
  const shortHall = t(village.base === 'home' ? 'base.hallHomeShort' : 'base.hallBuilderShort');

  const allSteps = rows.flatMap((g) => g.steps);
  const totals = sumByResource(allSteps);
  const wallClock = wallClockSeconds(allSteps, village.builders);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-brand text-xl font-bold">{t('upgrades.title')}</h1>
        <p className="text-sm text-ink-dim">{t('upgrades.groupCount', { count: rows.length })}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-lg bg-surface-2 px-2.5 py-1.5 outline-none">
          <option value="all">{t('common.all')}</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {t(`category.${c}`, c)}
            </option>
          ))}
        </select>
        <select value={res} onChange={(e) => setRes(e.target.value as Resource | 'all')} className="rounded-lg bg-surface-2 px-2.5 py-1.5 outline-none">
          <option value="all">{t('resource.gold')} / {t('resource.elixir')} …</option>
          {RESOURCE_ORDER.map((r) => (
            <option key={r} value={r}>
              {t(`resource.${r}`)}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-lg bg-surface-2 px-2.5 py-1.5 outline-none">
          <option value="nextCost">{t('upgrades.sortNextCost')}</option>
          <option value="totalCost">{t('upgrades.sortTotalCost')}</option>
          <option value="time">{t('upgrades.sort.time')}</option>
          <option value="category">{t('upgrades.sort.category')}</option>
        </select>
        {hasWishes && (
          <button
            onClick={() => setWishedOnly((v) => !v)}
            className={`rounded-lg border px-2.5 py-1.5 transition-colors ${
              wishedOnly ? 'glow-brand-sm border-brand-2 text-brand-2' : 'border-border text-ink-dim hover:text-ink'
            }`}
          >
            ★ {t('upgrades.filterWished')}
          </button>
        )}
        <label className="flex items-center gap-1.5 text-ink-dim">
          <input type="checkbox" checked={showLocked} onChange={(e) => setShowLocked(e.target.checked)} className="accent-brand-2" />
          {t('upgrades.showLocked')}
        </label>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="🎉" title={t('upgrades.empty', { hall: hallName })} />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((g) => (
            <BuildingGroupCard
              key={g.source + ':' + g.key}
              group={g}
              resources={village.resources}
              showLocked={showLocked}
              shortHall={shortHall}
              onWish={() => toggleWishlist(village.id, g.key)}
              onBump={(instanceId, toLevel) => {
                const label = buildingName(g.key, g.name, i18n.language);
                if (g.source === 'research') setResearch(village.id, g.key, toLevel, label);
                else setBuilding(village.id, instanceId, { level: toLevel }, label);
                saveToast(label);
              }}
            />
          ))}
        </ul>
      )}

      {allSteps.length > 0 && (
        <div className="sticky bottom-0 z-10 -mx-1 rounded-xl border border-border bg-surface-2/95 p-3 shadow-pop backdrop-blur">
          <div className="mb-1 flex items-center justify-between text-xs text-ink-dim">
            <span>{t('common.total')}</span>
            <span>
              {t('common.time')} ({village.builders}): {formatDuration(wallClock)}
            </span>
          </div>
          <ResourceTotalsRow totals={totals} exact />
        </div>
      )}
    </div>
  );
}
