import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVillages } from '../store/villages';
import { useCurrentVillage } from '../hooks/useCurrentVillage';
import { useVillageEngine } from '../hooks/useVillageEngine';
import { Onboarding } from './Onboarding';
import { ResourceAmount, ResourceTotalsRow } from '../components/ResourceAmount';
import { ResourceInput } from '../components/ResourceInput';
import { BuildingIcon } from '../components/BuildingIcon';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { useSaveToast } from '../hooks/useSaveToast';
import { formatDuration } from '../lib/engine/totals';
import { getHall, maxHall } from '../lib/engine/catalog';
import { buildingName, hallLongKey } from '../lib/labels';
import type { Resource } from '../lib/engine/types';
import type { VillageResources } from '../lib/appTypes';

const HOME_RES: Resource[] = ['gold', 'elixir', 'darkElixir'];
const BUILDER_RES: Resource[] = ['builderGold', 'builderElixir'];

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const loading = useVillages((s) => s.loading);
  const updateVillage = useVillages((s) => s.updateVillage);
  const village = useCurrentVillage();
  const engine = useVillageEngine(village);
  const saveToast = useSaveToast();

  if (loading) return <p className="text-ink-dim">{t('common.loading')}</p>;
  if (!village || !engine) return <Onboarding />;

  const hallName = t(hallLongKey(village.base));
  const shortHall = t(village.base === 'home' ? 'base.hallHomeShort' : 'base.hallBuilderShort');
  const { completion: comp, groups, researchGroups, totals } = engine;
  const allGroups = [...groups, ...researchGroups];

  const pendingCount = allGroups.reduce((n, g) => n + g.steps.length, 0);
  const storage = getHall(village.base, village.hall)?.storageCapacity ?? null;
  const resKeys = village.base === 'home' ? HOME_RES : BUILDER_RES;
  const resources = village.resources;

  const commitResource = (key: Resource, v: number) => {
    const nextRes: VillageResources = {
      gold: 0,
      elixir: 0,
      darkElixir: 0,
      ...resources,
      [key]: v,
    };
    updateVillage(village.id, { resources: nextRes });
  };

  // suggestions : 5 prochaines amélios les moins chères (bâtiments + recherche)
  const suggestions = allGroups
    .filter((g) => g.next)
    .sort((a, b) => (a.next!.cost || 0) - (b.next!.cost || 0))
    .slice(0, 5);

  const canAfford = (r: Resource, cost: number) =>
    resources ? (resources[r as keyof VillageResources] ?? 0) >= cost : false;

  const objective = village.plan?.targetHall;
  const hasObjective = objective != null && objective > village.hall;
  const canLevelUp = village.hall < maxHall(village.base);
  const levelUp = () => {
    updateVillage(village.id, { hall: village.hall + 1 });
    saveToast(`${hallName} ${village.hall + 1}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-brand text-xl font-bold">{village.name}</h1>
        <span className="flex items-center gap-2 text-sm text-ink-dim">
          {hallName} {village.hall} · {village.builders} {t('common.builders')}
          {canLevelUp && (
            <Button variant="glow" size="sm" onClick={levelUp} title={t('dashboard.levelUpHint', { hall: `${shortHall} ${village.hall + 1}` })}>
              ⬆️ {t('dashboard.levelUp')}
            </Button>
          )}
        </span>
        {hasObjective && (
          <Link
            to="/planner"
            className="glow-brand-sm w-full rounded-md px-2.5 py-1 text-xs font-semibold text-white [background-image:var(--gradient-brand)] [text-shadow:0_1px_2px_rgb(0_0_0/0.4)] sm:w-auto"
          >
            🎯 {t('dashboard.objective', { hall: `${shortHall} ${objective}` })}
          </Link>
        )}
      </header>

      {/* Progression */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span>{t('dashboard.progress', { hall: `${shortHall} ${village.hall}` })}</span>
          <span className="tabular-nums text-ink-dim">{Math.round(comp.ratio * 100)}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="glow-brand-sm h-full rounded-full transition-all [background-image:var(--gradient-brand)]"
            style={{ width: `${comp.ratio * 100}%` }}
          />
        </div>
      </section>

      {/* Mes ressources */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-dim">{t('dashboard.myResources')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {resKeys.map((r) => (
            <ResourceInput
              key={r}
              resource={r}
              value={resources?.[r as keyof VillageResources] ?? 0}
              max={r === 'gold' ? storage?.gold : r === 'elixir' ? storage?.elixir : r === 'darkElixir' ? storage?.darkElixir : null}
              onCommit={(v) => commitResource(r, v)}
            />
          ))}
        </div>
      </section>

      {pendingCount === 0 ? (
        <EmptyState
          icon="🏆"
          title={t('dashboard.everythingMaxed')}
          action={
            <Button to="/planner" size="sm">
              {t('dashboard.openPlanner', { hall: hallName })} →
            </Button>
          }
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h2 className="mb-2 text-sm font-semibold text-ink-dim">{t('dashboard.remaining')}</h2>
              <ResourceTotalsRow totals={totals.byResource} />
              <p className="mt-3 text-xs text-ink-dim">
                {t('dashboard.wallClock', { n: village.builders })}: {formatDuration(totals.wallClock)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <h2 className="mb-1 text-sm font-semibold text-ink-dim">{t('common.total')}</h2>
              <p className="text-2xl font-bold tabular-nums">
                {pendingCount} <span className="text-sm font-normal text-ink-dim">{t('nav.upgrades').toLowerCase()}</span>
              </p>
              <Link to="/upgrades" className="mt-2 inline-block text-sm font-semibold text-brand-2 hover:text-brand-3">
                {t('nav.upgrades')} →
              </Link>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink-dim">{t('dashboard.nextUp')}</h2>
            <ul className="flex flex-col gap-2">
              {suggestions.map((g) => {
                const s = g.next!;
                return (
                  <li key={g.key} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5">
                    <BuildingIcon icon={g.icon} name={g.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">
                        {buildingName(g.key, g.name, i18n.language)}
                        {g.count > 1 && <span className="text-ink-dim"> ×{g.count}</span>}
                      </div>
                      <div className="text-xs text-ink-dim">{t('upgrades.step', { from: s.fromLevel, to: s.toLevel })}</div>
                    </div>
                    {canAfford(s.resource, s.cost) && <span className="text-success">✓</span>}
                    <ResourceAmount resource={s.resource} amount={s.cost} />
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
