import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVillages } from '../store/villages';
import { useSession } from '../store/session';
import { useCurrentVillage } from '../hooks/useCurrentVillage';
import { useSaveToast } from '../hooks/useSaveToast';
import { levelIcon } from '../lib/icons';
import { HideMaxedToggle } from '../components/HideMaxedToggle';
import {
  gateBuildingLevel,
  getResearch,
  groupResearch,
  presetResearch,
  RESEARCH_KIND_ORDER,
  researchMaxAchievable,
} from '../lib/engine/research';
import { toEngineVillage } from '../hooks/useVillageEngine';
import { sumByResource, sumBuilderSeconds, formatDuration } from '../lib/engine/totals';
import { buildingName } from '../lib/labels';
import { BuildingIcon } from '../components/BuildingIcon';
import { ResearchEditPanel } from '../components/ResearchEditPanel';
import { CollapsibleRow } from '../components/CollapsibleRow';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { ResourceTotalsRow } from '../components/ResourceAmount';

export function ResearchPanel() {
  const { t, i18n } = useTranslation();
  const village = useCurrentVillage();
  const applyPreset = useVillages((s) => s.applyPreset);
  const hideMaxed = useSession((s) => s.hideMaxed);
  const saveToast = useSaveToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    const k = params.get('open');
    if (!k) return;
    setOpenKey(k);
    setQ('');
    const el = document.getElementById(`r-${k}`);
    if (el) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    params.delete('open');
    setParams(params, { replace: true });
  }, [params, setParams]);

  const sections = useMemo(() => {
    if (!village) return [];
    const ev = toEngineVillage(village);
    const query = q.trim().toLowerCase();
    const items = getResearch(village.base)
      .filter((it) => {
        if (!query) return true;
        return (
          it.name.toLowerCase().includes(query) ||
          buildingName(it.key, it.name, i18n.language).toLowerCase().includes(query)
        );
      })
      .map((it) => {
        // Plafond réel : HDV *et* bâtiment gate (Labo…) — un niveau que le HDV
        // autoriserait mais hors de portée du Labo actuel reste masqué.
        const target = researchMaxAchievable(it, village.hall, gateBuildingLevel(ev, it.kind));
        const level = village.research?.[it.key]?.level ?? 0;
        return { it, target, level, done: target > 0 && level >= target, locked: target === 0 };
      })
      .filter((x) => !x.locked && !(hideMaxed && x.done));

    const byKind = new Map<string, typeof items>();
    for (const x of items) {
      if (!byKind.has(x.it.kind)) byKind.set(x.it.kind, []);
      byKind.get(x.it.kind)!.push(x);
    }
    return RESEARCH_KIND_ORDER.filter((k) => byKind.has(k)).map((kind) => ({ kind, items: byKind.get(kind)! }));
  }, [village, q, i18n.language, hideMaxed]);

  const recap = useMemo(() => {
    if (!village) return null;
    const groups = groupResearch(toEngineVillage(village));
    const steps = groups.flatMap((g) => g.steps);
    return { byResource: sumByResource(steps), seconds: sumBuilderSeconds(steps), count: steps.length };
  }, [village]);

  if (!village) return null;

  const shortHall = t(village.base === 'home' ? 'base.hallHomeShort' : 'base.hallBuilderShort');
  const prevHall = `${shortHall} ${Math.max(1, village.hall - 1)}`;

  function applyBulk() {
    if (!village) return;
    if (!confirm(t('research.bulkConfirm', { hall: prevHall }))) return;
    const preset = presetResearch(village.base, village.hall, 'advanced');
    applyPreset(village.id, { research: { ...preset, ...(village.research ?? {}) } }, t('research.bulkMaxPrev', { hall: prevHall }));
    saveToast(t('research.bulkMaxPrev', { hall: prevHall }));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-dim">{t('research.subtitle')}</p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none"
          placeholder={t('research.search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button variant="soft" size="sm" onClick={applyBulk}>
          {t('research.bulkMaxPrev', { hall: prevHall })}
        </Button>
      </div>

      <HideMaxedToggle />

      {sections.length === 0 && <EmptyState icon="🔍" title={t('search.noResults')} />}

      {sections.map(({ kind, items }) => (
        <section key={kind} className="flex flex-col gap-1.5">
          <SectionHeader title={t(`category.${kind}`, kind)} count={items.length} />
          <div className="flex flex-col gap-1.5">
            {items.map(({ it, target, level, done }) => {
              const open = openKey === it.key;
              return (
                <CollapsibleRow
                  key={it.key}
                  id={`r-${it.key}`}
                  open={open}
                  glow={done}
                  onToggle={() => setOpenKey(open ? null : it.key)}
                  header={
                    <>
                      <BuildingIcon icon={levelIcon(it, level)} name={it.name} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{buildingName(it.key, it.name, i18n.language)}</div>
                        <div className="text-xs text-ink-dim">
                          {t('common.levelShort')} {level}
                          <span className="text-ink-dim/60"> / {target}</span>
                        </div>
                      </div>
                      {done ? (
                        <span className="rounded-md bg-success/15 px-2 py-0.5 text-xs text-success">{t('common.maxed')}</span>
                      ) : (
                        <span className={`text-ink-dim/50 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden>
                          ›
                        </span>
                      )}
                    </>
                  }
                >
                  <ResearchEditPanel village={village} item={it} />
                </CollapsibleRow>
              );
            })}
          </div>
        </section>
      ))}

      {recap && recap.count > 0 && (
        <div className="sticky bottom-0 z-10 -mx-1 rounded-xl border border-border bg-surface-2/95 p-3 shadow-pop backdrop-blur">
          <div className="mb-1 flex items-center justify-between text-xs text-ink-dim">
            <span>{t('research.recap')}</span>
            <span>{formatDuration(recap.seconds)} ×1</span>
          </div>
          <ResourceTotalsRow totals={recap.byResource} exact />
        </div>
      )}
    </div>
  );
}
