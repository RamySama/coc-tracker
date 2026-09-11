import { useTranslation } from 'react-i18next';
import type { VillageDoc } from '../lib/appTypes';
import type { ResearchItem } from '../lib/engine/research';
import { nextResearchStep, researchMaxForHall } from '../lib/engine/research';
import { formatDuration } from '../lib/engine/totals';
import { useVillages } from '../store/villages';
import { useSaveToast } from '../hooks/useSaveToast';
import { buildingName } from '../lib/labels';
import { Stepper } from './Stepper';
import { Button } from './ui/Button';
import { ResourceAmount } from './ResourceAmount';

/** Panneau d'édition d'un item de recherche, affiché en ligne sous sa carte. */
export function ResearchEditPanel({ village, item }: { village: VillageDoc; item: ResearchItem }) {
  const { t, i18n } = useTranslation();
  const setResearch = useVillages((s) => s.setResearch);
  const saveToast = useSaveToast();
  const label = buildingName(item.key, item.name, i18n.language);

  const shortHall = t(village.base === 'home' ? 'base.hallHomeShort' : 'base.hallBuilderShort');
  const target = researchMaxForHall(item, village.hall);
  const level = village.research?.[item.key]?.level ?? 0;
  const step = nextResearchStep(village.base, item.key, level, village.hall);
  const labHint =
    step.state === 'available' ? item.levels[step.step.toLevel - 1]?.labRequired ?? null : null;

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 bg-surface-2/40 p-3">
      {step.state === 'available' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="font-semibold text-ink-dim">{t('upgrades.next')}</span>
          <span>{t('upgrades.step', { from: step.step.fromLevel, to: step.step.toLevel })}</span>
          <ResourceAmount resource={step.step.resource} amount={step.step.cost} />
          {step.step.timeSeconds > 0 && <span className="text-ink-dim">{formatDuration(step.step.timeSeconds)}</span>}
          {labHint != null && <span className="text-ink-dim/70">{t('research.labRequired', { n: labHint })}</span>}
        </div>
      )}
      {step.state === 'locked' && (
        <p className="text-xs text-warn">{t('upgrades.unlocksAt', { hall: shortHall, level: step.unlocksAtHall })}</p>
      )}
      {step.state === 'maxed' && <p className="text-xs text-success">{t('common.maxed')}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-ink-dim">{t('common.level')}</span>
        <Stepper value={level} min={0} max={target} onChange={(v) => setResearch(village.id, item.key, v)} />
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setResearch(village.id, item.key, target, label);
            saveToast(label);
          }}
          disabled={level >= target}
        >
          {t('common.max')} ({target})
        </Button>
      </div>
    </div>
  );
}
