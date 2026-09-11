import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { VillageDoc } from '../lib/appTypes';
import type { Building } from '../lib/engine/types';
import { countAtHall, instanceId } from '../lib/engine/catalog';
import { isWall, maxLevelForHall, nextStep, WALL_INSTANCE } from '../lib/engine/progress';
import { formatDuration } from '../lib/engine/totals';
import { useVillages } from '../store/villages';
import { useSaveToast } from '../hooks/useSaveToast';
import { buildingName } from '../lib/labels';
import { Stepper } from './Stepper';
import { Button } from './ui/Button';
import { ResourceAmount } from './ResourceAmount';

/** Panneau d'édition d'un bâtiment, affiché en ligne sous sa carte. */
export function BuildingEditPanel({ village, building }: { village: VillageDoc; building: Building }) {
  const { t, i18n } = useTranslation();
  const setBuilding = useVillages((s) => s.setBuilding);
  const setBuildingLevels = useVillages((s) => s.setBuildingLevels);
  const saveToast = useSaveToast();
  const [detailed, setDetailed] = useState(false);
  const label = buildingName(building.key, building.name, i18n.language);

  const shortHall = t(village.base === 'home' ? 'base.hallHomeShort' : 'base.hallBuilderShort');
  const count = countAtHall(building, village.hall);
  const target = maxLevelForHall(building, village.hall); // plafond autorisé par le HDV courant
  const wall = isWall(building);
  const ids = wall ? [WALL_INSTANCE] : Array.from({ length: count }, (_, i) => instanceId(building.key, i + 1));
  const levels = ids.map((id) => village.buildings[id]?.level ?? 0);
  const identical = levels.every((l) => l === levels[0]);
  const commonLevel = identical ? levels[0] : Math.min(...levels);

  const setAll = (v: number) => setBuildingLevels(village.id, ids, Math.min(v, target));
  const maxAll = () => {
    setBuildingLevels(village.id, ids, target, label);
    saveToast(label);
  };

  const step = nextStep(village.base, building.key, Math.min(...levels), village.hall);

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 bg-surface-2/40 p-3">
      {/* Prochaine amélioration */}
      {step.state === 'available' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="font-semibold text-ink-dim">{t('upgrades.next')}</span>
          <span>{t('upgrades.step', { from: step.step.fromLevel, to: step.step.toLevel })}</span>
          <ResourceAmount resource={step.step.resource} amount={step.step.cost} />
          {step.step.timeSeconds > 0 && <span className="text-ink-dim">{formatDuration(step.step.timeSeconds)}</span>}
        </div>
      )}
      {step.state === 'locked' && (
        <p className="text-xs text-warn">{t('upgrades.unlocksAt', { hall: shortHall, level: step.unlocksAtHall })}</p>
      )}
      {step.state === 'maxed' && <p className="text-xs text-success">{t('common.maxed')}</p>}

      {/* Réglage groupé + Max */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-ink-dim">
          {wall || count === 1 ? t('common.level') : t('buildingEditor.allAtLevel')}
        </span>
        <Stepper value={commonLevel} min={0} max={target} onChange={setAll} />
        <Button variant="primary" size="sm" onClick={maxAll} disabled={levels.every((l) => l >= target)}>
          {t('common.max')} ({target})
        </Button>
      </div>
      {!identical && !wall && <p className="text-xs text-warn/80">{t('buildingEditor.mixedLevels')}</p>}
      {wall && <p className="text-xs text-ink-dim">{t('buildings.wallsAllSame')}</p>}

      {/* Détail par exemplaire */}
      {count > 1 && !wall && (
        <div>
          <button onClick={() => setDetailed((v) => !v)} className="text-xs font-medium text-brand-2 hover:text-brand-3">
            {detailed ? '▾ ' : '▸ '}
            {t('buildingEditor.perCopy')}
          </button>
          {detailed && (
            <div className="mt-2 flex flex-col gap-2">
              {ids.map((id, i) => (
                <div key={id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-2">
                  <span className="text-xs text-ink-dim">{t('buildings.instance', { n: i + 1 })}</span>
                  <Stepper
                    value={village.buildings[id]?.level ?? 0}
                    min={0}
                    max={target}
                    size="sm"
                    onChange={(v) => setBuilding(village.id, id, { level: v })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
