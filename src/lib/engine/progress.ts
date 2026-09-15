import { countAtHall, getBuilding, getCatalog, instanceId } from './catalog';
import type { Base, Building, Resource, UpgradeStep, Village } from './types';

/** Les murs sont suivis en agrégat : un seul "exemplaire" représentant tout le lot. */
export const WALL_INSTANCE = 'wall#all';
export function isWall(building: Building): boolean {
  return building.category === 'wall';
}

/** Niveau max atteignable pour ce bâtiment au niveau de hall donné. */
export function maxLevelForHall(building: Building, hall: number): number {
  let max = 0;
  for (const lvl of building.levels) {
    if (lvl.hallRequired == null || lvl.hallRequired <= hall) max = lvl.level;
  }
  return max;
}

interface StepOpts {
  /** inclure aussi les marches encore verrouillées par le hall courant */
  includeLocked?: boolean;
}

/**
 * Marches restantes pour un exemplaire : de fromLevel+1 jusqu'au max du bâtiment.
 * Par défaut, s'arrête au max autorisé par le hall courant.
 * `quantity` multiplie le coût (utilisé pour le lot de murs).
 */
export function stepsForInstance(
  building: Building,
  id: string,
  fromLevel: number,
  hall: number,
  opts: StepOpts = {},
  quantity = 1,
): UpgradeStep[] {
  const ceiling = opts.includeLocked ? building.maxLevel : maxLevelForHall(building, hall);
  const steps: UpgradeStep[] = [];
  for (let to = Math.max(fromLevel, 0) + 1; to <= ceiling; to++) {
    const def = building.levels[to - 1];
    if (!def) break;
    const reqHall = def.hallRequired ?? 0;
    steps.push({
      instanceId: id,
      key: building.key,
      name: building.name,
      category: building.category,
      icon: building.icon,
      base: building.base,
      fromLevel: to - 1,
      toLevel: to,
      cost: def.cost * quantity,
      resource: def.resource,
      timeSeconds: def.timeSeconds,
      xp: def.xp * quantity,
      quantity,
      locked: reqHall > hall,
      unlocksAtHall: reqHall > hall ? reqHall : null,
    });
  }
  return steps;
}

export type NextStep =
  | { state: 'maxed' }
  | { state: 'available'; step: UpgradeStep }
  | { state: 'locked'; step: UpgradeStep; unlocksAtHall: number };

/** Prochaine marche pour un exemplaire (ou maxed). */
export function nextStep(base: Base, key: string, fromLevel: number, hall: number): NextStep {
  const building = getBuilding(base, key);
  if (!building) return { state: 'maxed' };
  if (fromLevel >= building.maxLevel) return { state: 'maxed' };
  const [step] = stepsForInstance(building, instanceId(key, 1), fromLevel, hall, { includeLocked: true });
  if (!step) return { state: 'maxed' };
  if (step.locked) return { state: 'locked', step, unlocksAtHall: step.unlocksAtHall! };
  return { state: 'available', step };
}

export interface ExpandedInstance {
  id: string;
  building: Building;
  level: number;
  priority: boolean;
  /** nb d'exemplaires que cette entrée représente (1 sauf pour les murs) */
  count: number;
  isWall: boolean;
}

/**
 * Exemplaires disponibles au hall courant, fusionnés avec l'état stocké.
 * Les murs sont regroupés en une seule entrée (`wall#all`) avec `count` = nb total.
 */
export function expandInstances(village: Village): ExpandedInstance[] {
  const out: ExpandedInstance[] = [];
  for (const building of getCatalog(village.base)) {
    const count = countAtHall(building, village.hall);
    if (count === 0) continue;

    if (isWall(building)) {
      const state = village.buildings[WALL_INSTANCE];
      out.push({
        id: WALL_INSTANCE,
        building,
        level: state?.level ?? 0,
        priority: state?.priority ?? false,
        count,
        isWall: true,
      });
      continue;
    }

    for (let i = 1; i <= count; i++) {
      const id = instanceId(building.key, i);
      const state = village.buildings[id];
      out.push({ id, building, level: state?.level ?? 0, priority: state?.priority ?? false, count: 1, isWall: false });
    }
  }
  return out;
}

/**
 * Toutes les marches d'amélioration restantes du village.
 * includeLocked = inclure celles qui demandent un hall plus haut.
 */
export function pendingUpgrades(village: Village, opts: StepOpts = {}): UpgradeStep[] {
  const steps: UpgradeStep[] = [];
  for (const inst of expandInstances(village)) {
    steps.push(...stepsForInstance(inst.building, inst.id, inst.level, village.hall, opts, inst.count));
  }
  return steps;
}

/** Progression 0..1 vers le "max pour le hall courant" (niveaux cumulés, murs pondérés). */
export function completion(village: Village): { done: number; total: number; ratio: number } {
  let done = 0;
  let total = 0;
  for (const inst of expandInstances(village)) {
    const target = maxLevelForHall(inst.building, village.hall);
    // les murs comptent pour un seul lot pour ne pas écraser la barre de progression
    const weight = inst.isWall ? 1 : inst.count;
    total += target * weight;
    done += Math.min(Math.max(inst.level, 0), target) * weight;
  }
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

/** Bâtiments de stockage -> ressource concernée, par type de village. */
const STORAGE_BUILDINGS: Record<Base, Partial<Record<string, Resource>>> = {
  home: { 'gold-storage': 'gold', 'elixir-storage': 'elixir', 'dark-elixir-storage': 'darkElixir' },
  builder: { 'gold-storage': 'builderGold', 'elixir-storage': 'builderElixir' },
};

/**
 * Capacité de stockage réelle du village : somme des réservoirs construits, à leur
 * niveau actuel (contrairement au chiffre générique par HDV, ignoré ici).
 */
export function storageCapacity(village: Village): Partial<Record<Resource, number>> {
  const map = STORAGE_BUILDINGS[village.base];
  const out: Partial<Record<Resource, number>> = {};
  for (const inst of expandInstances(village)) {
    const resource = map[inst.building.key];
    if (!resource || inst.level <= 0) continue;
    const capacity = inst.building.levels[inst.level - 1]?.capacity ?? 0;
    out[resource] = (out[resource] ?? 0) + capacity * inst.count;
  }
  return out;
}
