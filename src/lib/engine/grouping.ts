import { expandInstances, maxLevelForHall, stepsForInstance } from './progress';
import { sumByResource, sumBuilderSeconds } from './totals';
import { levelIcon } from '../icons';
import type { ResourceTotals } from './totals';
import type { Base, UpgradeStep, Village } from './types';

export interface BuildingGroup {
  source: 'building';
  key: string;
  name: string;
  icon: string | null;
  category: string;
  base: Base;
  /** nb d'exemplaires au hall courant (nb total de murs pour les murs) */
  count: number;
  /** instanceIds des exemplaires, alignés avec copyLevels */
  instanceIds: string[];
  /** niveau de chaque exemplaire, trié croissant */
  copyLevels: number[];
  target: number;
  identical: boolean;
  isWall: boolean;
  /** key présente dans la liste de souhaits du village */
  wished: boolean;
  /** prochaine marche débloquée de l'exemplaire le moins avancé */
  next: UpgradeStep | null;
  /** toutes les marches débloquées restantes (tous exemplaires), sans le bruit coût 0 */
  steps: UpgradeStep[];
  stepsLocked: UpgradeStep[];
  totalByResource: ResourceTotals;
  totalBuilderSeconds: number;
}

interface Opts {
  includeLocked?: boolean;
}

const isNoise = (s: UpgradeStep) => s.cost === 0 && s.timeSeconds === 0;

/** Regroupe les améliorations restantes par type de bâtiment. */
export function groupPendingByBuilding(village: Village, opts: Opts = {}): BuildingGroup[] {
  const wishlist = new Set(village.wishlist ?? []);
  type Acc = {
    building: import('./types').Building;
    entries: { id: string; level: number; count: number; isWall: boolean }[];
  };
  const byKey = new Map<string, Acc>();

  for (const inst of expandInstances(village)) {
    let acc = byKey.get(inst.building.key);
    if (!acc) {
      acc = { building: inst.building, entries: [] };
      byKey.set(inst.building.key, acc);
    }
    acc.entries.push({ id: inst.id, level: inst.level, count: inst.count, isWall: inst.isWall });
  }

  const groups: BuildingGroup[] = [];

  for (const { building, entries } of byKey.values()) {
    const target = maxLevelForHall(building, village.hall);
    const sorted = [...entries].sort((a, b) => a.level - b.level);

    const steps: UpgradeStep[] = [];
    const stepsLocked: UpgradeStep[] = [];
    for (const e of sorted) {
      const all = stepsForInstance(building, e.id, e.level, village.hall, { includeLocked: true }, e.count);
      for (const s of all) {
        if (isNoise(s)) continue;
        if (s.locked) stepsLocked.push(s);
        else steps.push(s);
      }
    }
    const visibleLocked = opts.includeLocked ? stepsLocked : [];
    if (steps.length === 0 && visibleLocked.length === 0) continue;

    const copyLevels = sorted.map((e) => e.level);
    const count = building.category === 'wall' ? sorted[0].count : sorted.length;

    groups.push({
      source: 'building',
      key: building.key,
      name: building.name,
      icon: levelIcon(building, copyLevels[0]),
      category: building.category,
      base: building.base,
      count,
      instanceIds: sorted.map((e) => e.id),
      copyLevels,
      target,
      identical: copyLevels.every((l) => l === copyLevels[0]),
      isWall: building.category === 'wall',
      wished: wishlist.has(building.key),
      next: steps[0] ?? null,
      steps,
      stepsLocked,
      totalByResource: sumByResource(steps),
      totalBuilderSeconds: sumBuilderSeconds(steps),
    });
  }

  return groups;
}
