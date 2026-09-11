import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentVillage } from '../hooks/useCurrentVillage';
import { useVillages } from '../store/villages';
import { getHall, maxHall } from '../lib/engine/catalog';
import { townHallDiff } from '../lib/engine/planner';
import type { NewBuildingUnlock, HigherLevelUnlock, ResearchUnlock } from '../lib/engine/planner';
import { formatDuration, formatNumber } from '../lib/engine/totals';
import { buildingName } from '../lib/labels';
import { BuildingIcon } from '../components/BuildingIcon';
import { ResourceAmount, ResourceTotalsRow } from '../components/ResourceAmount';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { RangeSlider } from '../components/ui/RangeSlider';
import { Onboarding } from './Onboarding';

export function Planner() {
  const { t, i18n } = useTranslation();
  const village = useCurrentVillage();
  const setPlan = useVillages((s) => s.setPlan);
  const toggleWishlist = useVillages((s) => s.toggleWishlist);
  const hallMax = village ? maxHall(village.base) : 18;

  const [from, setFrom] = useState(village?.plan?.fromHall ?? village?.hall ?? 11);
  const [to, setTo] = useState(village?.plan?.targetHall ?? Math.min((village?.hall ?? 11) + 1, hallMax));

  // (re)synchronise les curseurs quand le village (donc sa planif mémorisée) charge / change
  useEffect(() => {
    if (!village) return;
    setFrom(village.plan?.fromHall ?? village.hall);
    setTo(village.plan?.targetHall ?? Math.min(village.hall + 1, maxHall(village.base)));
  }, [village?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const f = Math.min(from, hallMax - 1);
  const tt = Math.max(to, f + 1);

  const diff = useMemo(() => (village ? townHallDiff(village.base, f, tt) : null), [village, f, tt]);

  if (!village || !diff) return <Onboarding />;

  const shortHall = t(village.base === 'home' ? 'base.hallHomeShort' : 'base.hallBuilderShort');
  const title = t(village.base === 'home' ? 'planner.title' : 'planner.titleBuilder');
  const nameOf = (key: string, fallback: string) => buildingName(key, fallback, i18n.language);
  const wishlist = new Set(village.plan?.wishlist ?? []);
  const wish = (key: string) => toggleWishlist(village.id, key);

  const commitPlan = (nf: number, nt: number) => setPlan(village.id, { fromHall: nf, targetHall: nt });

  const nbNewBuildings = diff.newBuildings.length + diff.extraCopies.length;
  const nbNewUnits = diff.newResearch.length;
  const nbLevels = diff.higherLevels.length + diff.researchHigherLevels.length;
  const nothing = nbNewBuildings + nbNewUnits + nbLevels === 0;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-brand text-xl font-bold">{title}</h1>

      {/* De → À */}
      <Card>
        <div className="flex items-center justify-center gap-4">
          <HallStop base={village.base} level={f} label={shortHall} />
          <span className="text-2xl text-ink-dim" aria-hidden>
            →
          </span>
          <HallStop base={village.base} level={tt} label={shortHall} />
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-ink-dim">
            {t('planner.from')}
            <RangeSlider
              min={1}
              max={hallMax - 1}
              value={from}
              onChange={(v) => {
                const nt = to <= v ? v + 1 : to;
                setFrom(v);
                setTo(nt);
                commitPlan(v, nt);
              }}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-dim">
            {t('planner.to')}
            <RangeSlider
              min={2}
              max={hallMax}
              value={to}
              onChange={(v) => {
                const nt = Math.max(v, f + 1);
                setTo(nt);
                commitPlan(from, nt);
              }}
            />
          </label>
        </div>
      </Card>

      {/* Résumé */}
      <Card glow>
        <h2 className="text-brand text-sm font-semibold">{t('planner.costToMax')}</h2>
        <p className="text-xs text-ink-dim">🎯 {t('planner.objective')} : {shortHall} {tt}</p>
        <p className="mb-2 text-xs text-ink-dim">{t('planner.fromMaxed', { level: f })}</p>
        <div className="text-base">
          <ResourceTotalsRow totals={diff.costToMaxDelta} exact />
        </div>
        <p className="mt-2 text-xs text-ink-dim">
          {formatDuration(diff.timeToMaxDeltaBuilderSeconds + diff.hallPath.reduce((a, h) => a + h.timeSeconds, 0))} ×1{' '}
          {t('common.builders').toLowerCase()}
        </p>
        {!nothing && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {nbNewBuildings > 0 && <Counter n={nbNewBuildings} label={t('planner.cNewBuildings')} />}
            {nbNewUnits > 0 && <Counter n={nbNewUnits} label={t('planner.cNewUnits')} />}
            {nbLevels > 0 && <Counter n={nbLevels} label={t('planner.cLevels')} />}
          </div>
        )}
      </Card>

      {/* Paliers de hall */}
      {diff.hallPath.length > 0 && (
        <Card>
          <SectionHeader title={t('planner.hallCost', { hall: shortHall })} />
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {diff.hallPath.map((h) => (
              <li key={h.level} className="flex items-center justify-between">
                <span>
                  {shortHall} {h.level}
                </span>
                <span className="flex items-center gap-3">
                  <ResourceAmount resource={h.resource} amount={h.cost} />
                  <span className="text-xs text-ink-dim">{formatDuration(h.timeSeconds)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Stockage */}
      {diff.storageBefore && diff.storageAfter && (
        <Card>
          <SectionHeader title={t('planner.storage')} />
          <div className="mt-3 flex flex-col gap-3">
            {(['gold', 'elixir', 'darkElixir'] as const).map((r) => {
              const a = diff.storageBefore![r];
              const b = diff.storageAfter![r];
              const w = b === 0 ? 0 : (a / b) * 100;
              return (
                <div key={r}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-ink-dim">{t(`resource.${r}`)}</span>
                    <span className="tabular-nums">
                      {formatNumber(a)} {b > a && <span className="text-gold">→ {formatNumber(b)}</span>}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                    <div className="glow-brand-sm h-full rounded-full [background-image:var(--gradient-brand)]" style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {nothing && <Card className="text-ink-dim">{t('planner.nothingNew')}</Card>}

      <ChipGrid
        title={t('planner.newBuildings')}
        items={diff.newBuildings}
        nameOf={nameOf}
        wishlist={wishlist}
        onWish={wish}
        sub={(b) => `${b.countAfter}× · ${t('common.max')} ${b.maxLevelAfter}`}
      />
      <ChipGrid
        title={t('planner.extraCopies')}
        items={diff.extraCopies}
        nameOf={nameOf}
        wishlist={wishlist}
        onWish={wish}
        sub={(b) => t('planner.copies', { before: b.countBefore, after: b.countAfter })}
      />
      <ChipGrid
        title={t('planner.newResearch')}
        items={diff.newResearch}
        nameOf={nameOf}
        wishlist={wishlist}
        onWish={wish}
        sub={(b) => t(`category.${b.kind}`, b.kind)}
      />

      <PillList title={t('planner.higherLevels')} items={diff.higherLevels} nameOf={nameOf} wishlist={wishlist} onWish={wish} />
      <PillList
        title={t('planner.researchLevels')}
        items={diff.researchHigherLevels}
        nameOf={nameOf}
        wishlist={wishlist}
        onWish={wish}
      />
    </div>
  );
}

function HallStop({ base, level, label }: { base: 'home' | 'builder'; level: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <BuildingIcon icon={getHall(base, level)?.icon ?? null} name={label} size={44} />
      <span className="text-xs font-semibold">
        {label} {level}
      </span>
    </div>
  );
}

function Counter({ n, label }: { n: number; label: string }) {
  return (
    <span className="rounded-md bg-surface-2 px-2 py-1">
      <span className="font-bold text-ink">{n}</span> <span className="text-ink-dim">{label}</span>
    </span>
  );
}

function WishStar({ on, onClick }: { on: boolean; onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={on ? t('planner.removeWish') : t('planner.addWish')}
      className={`shrink-0 text-sm leading-none transition-colors ${on ? 'text-brand-2 [text-shadow:0_0_8px_var(--color-brand-2)]' : 'text-ink-dim/40 hover:text-ink-dim'}`}
    >
      {on ? '★' : '☆'}
    </button>
  );
}

function ChipGrid<T extends NewBuildingUnlock | ResearchUnlock>({
  title,
  items,
  nameOf,
  sub,
  wishlist,
  onWish,
}: {
  title: string;
  items: T[];
  nameOf: (k: string, f: string) => string;
  sub: (b: T) => string;
  wishlist: Set<string>;
  onWish: (k: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title={title} count={items.length} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((b) => (
          <div key={b.key} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
            <BuildingIcon icon={b.icon} name={b.name} size={30} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{nameOf(b.key, b.name)}</div>
              <div className="truncate text-[11px] text-ink-dim">{sub(b)}</div>
            </div>
            <WishStar on={wishlist.has(b.key)} onClick={() => onWish(b.key)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function PillList({
  title,
  items,
  nameOf,
  wishlist,
  onWish,
}: {
  title: string;
  items: (HigherLevelUnlock | ResearchUnlock)[];
  nameOf: (k: string, f: string) => string;
  wishlist: Set<string>;
  onWish: (k: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title={title} count={items.length} />
      <div className="flex flex-wrap gap-1.5">
        {items.map((b) => (
          <span key={b.key} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs">
            {nameOf(b.key, b.name)} <span className="tabular-nums text-ink-dim">{b.maxLevelBefore}→{b.maxLevelAfter}</span>
            <WishStar on={wishlist.has(b.key)} onClick={() => onWish(b.key)} />
          </span>
        ))}
      </div>
    </section>
  );
}
