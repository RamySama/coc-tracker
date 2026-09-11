import { countAtHall, getCatalog, getHall, getHalls } from './catalog';
import { maxLevelForHall } from './progress';
import { getResearch, researchMaxForHall } from './research';
import type { Base, Resource } from './types';
import { sumByResource } from './totals';
import type { ResourceTotals } from './totals';

export interface HallStepCost {
  level: number;
  cost: number;
  resource: Resource;
  timeSeconds: number;
  icon: string | null;
}

/** Coût des améliorations de hall pour passer de `from` à `to` (exclus -> inclus). */
export function hallUpgradePath(base: Base, from: number, to: number): HallStepCost[] {
  return getHalls(base)
    .filter((h) => h.level > from && h.level <= to)
    .map((h) => ({ level: h.level, cost: h.cost, resource: h.resource, timeSeconds: h.timeSeconds, icon: h.icon }));
}

export interface NewBuildingUnlock {
  key: string;
  name: string;
  category: string;
  icon: string | null;
  countBefore: number;
  countAfter: number;
  /** niveau max débloqué à `to` pour ce bâtiment */
  maxLevelAfter: number;
}

export interface HigherLevelUnlock {
  key: string;
  name: string;
  category: string;
  icon: string | null;
  maxLevelBefore: number;
  maxLevelAfter: number;
  count: number;
}

export interface ResearchUnlock {
  key: string;
  name: string;
  kind: string;
  icon: string | null;
  maxLevelBefore: number;
  maxLevelAfter: number;
}

export interface TownHallDiff {
  base: Base;
  from: number;
  to: number;
  hallPath: HallStepCost[];
  newBuildings: NewBuildingUnlock[];
  extraCopies: NewBuildingUnlock[];
  higherLevels: HigherLevelUnlock[];
  /** nouveaux éléments d'armée/labo débloqués (troupes, sorts, familiers, héros…) */
  newResearch: ResearchUnlock[];
  /** éléments d'armée/labo qui gagnent des niveaux */
  researchHigherLevels: ResearchUnlock[];
  storageBefore: { gold: number; elixir: number; darkElixir: number } | null;
  storageAfter: { gold: number; elixir: number; darkElixir: number } | null;
  /** coût pour "maxer" tout ce que ce palier ajoute, en partant d'un village maxé au niveau `from` */
  costToMaxDelta: ResourceTotals;
  timeToMaxDeltaBuilderSeconds: number;
}

/**
 * Ce que débloque le passage de hall `from` -> `to` (par défaut from+1).
 * Le "delta à maxer" suppose un village déjà maxé au niveau `from`.
 */
export function townHallDiff(base: Base, from: number, to: number = from + 1): TownHallDiff {
  const catalog = getCatalog(base);
  const newBuildings: NewBuildingUnlock[] = [];
  const extraCopies: NewBuildingUnlock[] = [];
  const higherLevels: HigherLevelUnlock[] = [];

  const deltaSteps: { cost: number; resource: Resource; timeSeconds: number; xp: number }[] = [];

  for (const b of catalog) {
    const cBefore = countAtHall(b, from);
    const cAfter = countAtHall(b, to);
    const maxBefore = maxLevelForHall(b, from);
    const maxAfter = maxLevelForHall(b, to);
    if (cAfter === 0) continue;

    if (cBefore === 0 && cAfter > 0) {
      newBuildings.push({
        key: b.key, name: b.name, category: b.category, icon: b.icon,
        countBefore: 0, countAfter: cAfter, maxLevelAfter: maxAfter,
      });
      // nouveau bâtiment : coût complet 1 -> maxAfter, pour chaque exemplaire
      for (let i = 0; i < cAfter; i++) {
        for (let lvl = 1; lvl <= maxAfter; lvl++) deltaSteps.push(step(b, lvl));
      }
      continue;
    }

    if (cAfter > cBefore) {
      extraCopies.push({
        key: b.key, name: b.name, category: b.category, icon: b.icon,
        countBefore: cBefore, countAfter: cAfter, maxLevelAfter: maxAfter,
      });
      // exemplaires en plus : coût complet 1 -> maxAfter
      for (let i = 0; i < cAfter - cBefore; i++) {
        for (let lvl = 1; lvl <= maxAfter; lvl++) deltaSteps.push(step(b, lvl));
      }
    }

    if (maxAfter > maxBefore) {
      higherLevels.push({
        key: b.key, name: b.name, category: b.category, icon: b.icon,
        maxLevelBefore: maxBefore, maxLevelAfter: maxAfter, count: cAfter,
      });
      // niveaux supplémentaires sur les exemplaires déjà présents
      for (let i = 0; i < cBefore; i++) {
        for (let lvl = maxBefore + 1; lvl <= maxAfter; lvl++) deltaSteps.push(step(b, lvl));
      }
    }
  }

  // Armée / laboratoire
  const newResearch: ResearchUnlock[] = [];
  const researchHigherLevels: ResearchUnlock[] = [];
  for (const item of getResearch(base)) {
    const maxBefore = researchMaxForHall(item, from);
    const maxAfter = researchMaxForHall(item, to);
    if (maxAfter <= maxBefore) continue;
    const entry: ResearchUnlock = {
      key: item.key, name: item.name, kind: item.kind, icon: item.icon, maxLevelBefore: maxBefore, maxLevelAfter: maxAfter,
    };
    if (maxBefore === 0) newResearch.push(entry);
    else researchHigherLevels.push(entry);
    for (let lvl = maxBefore + 1; lvl <= maxAfter; lvl++) {
      const def = item.levels[lvl - 1];
      if (def) deltaSteps.push({ cost: def.cost, resource: def.resource, timeSeconds: def.timeSeconds, xp: def.xp });
    }
  }

  const hallPath = hallUpgradePath(base, from, to);
  for (const h of hallPath) deltaSteps.push({ cost: h.cost, resource: h.resource, timeSeconds: h.timeSeconds, xp: 0 });

  const costToMaxDelta = sumByResource(deltaSteps);
  const timeToMaxDeltaBuilderSeconds = deltaSteps.reduce((a, s) => a + s.timeSeconds, 0);

  const hallFrom = getHall(base, from);
  const hallTo = getHall(base, to);

  return {
    base, from, to, hallPath,
    newBuildings, extraCopies, higherLevels,
    newResearch, researchHigherLevels,
    storageBefore: hallFrom?.storageCapacity ?? null,
    storageAfter: hallTo?.storageCapacity ?? null,
    costToMaxDelta,
    timeToMaxDeltaBuilderSeconds,
  };
}

function step(b: import('./types').Building, level: number) {
  const def = b.levels[level - 1];
  return { cost: def?.cost ?? 0, resource: def?.resource ?? 'gold', timeSeconds: def?.timeSeconds ?? 0, xp: def?.xp ?? 0 };
}
