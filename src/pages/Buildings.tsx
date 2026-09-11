import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVillages } from '../store/villages';
import { useSession } from '../store/session';
import { useCurrentVillage } from '../hooks/useCurrentVillage';
import { useSaveToast } from '../hooks/useSaveToast';
import { countAtHall, getCatalog, instanceId, sortCategories } from '../lib/engine/catalog';
import { isWall, maxLevelForHall, WALL_INSTANCE } from '../lib/engine/progress';
import { presetBuildings } from '../lib/engine/presets';
import { buildingName } from '../lib/labels';
import { levelIcon } from '../lib/icons';
import { HideMaxedToggle } from '../components/HideMaxedToggle';
import { BuildingIcon } from '../components/BuildingIcon';
import { BuildingEditPanel } from '../components/BuildingEditPanel';
import { CollapsibleRow } from '../components/CollapsibleRow';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export function BuildingsPanel() {
  const { t, i18n } = useTranslation();
  const village = useCurrentVillage();
  const applyPreset = useVillages((s) => s.applyPreset);
  const hideMaxed = useSession((s) => s.hideMaxed);
  const saveToast = useSaveToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);

  // deep-link ?open=<key> depuis la recherche globale
  useEffect(() => {
    const k = params.get('open');
    if (!k) return;
    setOpenKey(k);
    setQ('');
    const el = document.getElementById(`b-${k}`);
    if (el) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    params.delete('open');
    setParams(params, { replace: true });
  }, [params, setParams]);

  const groups = useMemo(() => {
    if (!village) return [];
    const query = q.trim().toLowerCase();
    const items = getCatalog(village.base)
      .map((b) => ({ b, count: countAtHall(b, village.hall) }))
      .filter((x) => x.count > 0)
      .filter((x) => {
        if (!query) return true;
        return (
          x.b.name.toLowerCase().includes(query) ||
          buildingName(x.b.key, x.b.name, i18n.language).toLowerCase().includes(query)
        );
      })
      .map(({ b, count }) => {
        const target = maxLevelForHall(b, village.hall);
        const levels = isWall(b)
          ? [village.buildings[WALL_INSTANCE]?.level ?? 0]
          : Array.from({ length: count }, (_, i) => village.buildings[instanceId(b.key, i + 1)]?.level ?? 0);
        const atMax = levels.filter((l) => l >= target).length;
        const identical = levels.every((l) => l === levels[0]);
        return { b, count, target, levels, atMax, identical, done: atMax === levels.length };
      })
      .filter((x) => !(hideMaxed && x.done));

    const byCat = new Map<string, typeof items>();
    for (const it of items) {
      if (!byCat.has(it.b.category)) byCat.set(it.b.category, []);
      byCat.get(it.b.category)!.push(it);
    }
    return sortCategories([...byCat.keys()]).map((cat) => ({ cat, items: byCat.get(cat)! }));
  }, [village, q, i18n.language, hideMaxed]);

  if (!village) return null;

  const shortHall = t(village.base === 'home' ? 'base.hallHomeShort' : 'base.hallBuilderShort');
  const prevHall = `${shortHall} ${Math.max(1, village.hall - 1)}`;

  function applyBulk() {
    if (!village) return;
    if (!confirm(t('buildings.bulkConfirm', { hall: prevHall }))) return;
    const preset = presetBuildings(village.base, village.hall, 'advanced');
    applyPreset(village.id, { buildings: { ...preset, ...village.buildings } }, t('buildings.bulkMaxPrev', { hall: prevHall }));
    saveToast(t('buildings.bulkMaxPrev', { hall: prevHall }));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-dim">{t('buildings.setLevel')}</p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none"
          placeholder={t('buildings.search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button variant="soft" size="sm" onClick={applyBulk}>
          {t('buildings.bulkMaxPrev', { hall: prevHall })}
        </Button>
      </div>

      <HideMaxedToggle />

      {groups.length === 0 && <EmptyState icon="🔍" title={t('search.noResults')} />}

      {groups.map(({ cat, items }) => (
        <section key={cat} className="flex flex-col gap-1.5">
          <SectionHeader title={t(`category.${cat}`, cat)} count={items.length} />
          <div className="flex flex-col gap-1.5">
            {items.map(({ b, count, target, levels, atMax, identical, done }) => {
              const min = Math.min(...levels);
              const max = Math.max(...levels);
              const open = openKey === b.key;
              return (
                <CollapsibleRow
                  key={b.key}
                  id={`b-${b.key}`}
                  open={open}
                  glow={done}
                  onToggle={() => setOpenKey(open ? null : b.key)}
                  header={
                    <>
                      <BuildingIcon icon={levelIcon(b, min)} name={b.name} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{buildingName(b.key, b.name, i18n.language)}</div>
                        <div className="text-xs text-ink-dim">
                          {count > 1 && `×${count} · `}
                          {identical ? `${t('common.levelShort')} ${min}` : `${t('common.levelShort')} ${min}–${max}`}
                          <span className="text-ink-dim/60"> / {target}</span>
                        </div>
                      </div>
                      {done ? (
                        <span className="rounded-md bg-success/15 px-2 py-0.5 text-xs text-success">{t('common.maxed')}</span>
                      ) : (
                        <span className="text-xs tabular-nums text-ink-dim">
                          {atMax}/{levels.length}
                        </span>
                      )}
                      <span className={`text-ink-dim/50 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden>
                        ›
                      </span>
                    </>
                  }
                >
                  <BuildingEditPanel village={village} building={b} />
                </CollapsibleRow>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
