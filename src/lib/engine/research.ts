import researchHome from '../../data/game/research.home.json';
import researchBuilder from '../../data/game/research.builder.json';
import { sumByResource, sumBuilderSeconds } from './totals';
import { levelIcon } from '../icons';
import type { ResourceTotals } from './totals';
import type { Base, Resource, UpgradeStep, Village } from './types';
import type { NextStep } from './progress';
import type { PresetMode } from './presets';

export type ResearchKind =
  | 'hero'
  | 'guardian'
  | 'pet'
  | 'troop'
  | 'dark-troop'
  | 'siege'
  | 'spell'
  | 'dark-spell';

export interface ResearchLevel {
  level: number;
  cost: number;
  resource: Resource;
  timeSeconds: number;
  hallRequired: number | null;
  labRequired: number | null;
  xp: number;
  icon?: string | null;
}

export interface ResearchItem {
  key: string;
  name: string;
  kind: ResearchKind;
  order: number;
  base: Base;
  maxLevel: number;
  icon: string | null;
  levels: ResearchLevel[];
}

const DATA: Record<Base, ResearchItem[]> = {
  home: researchHome as unknown as ResearchItem[],
  builder: researchBuilder as unknown as ResearchItem[],
};

const byKey: Record<Base, Map<string, ResearchItem>> = {
  home: new Map(DATA.home.map((r) => [r.key, r])),
  builder: new Map(DATA.builder.map((r) => [r.key, r])),
};

export const RESEARCH_KIND_ORDER: ResearchKind[] = [
  'hero',
  'guardian',
  'pet',
  'troop',
  'dark-troop',
  'siege',
  'spell',
  'dark-spell',
];

export function getResearch(base: Base): ResearchItem[] {
  return DATA[base];
}

export function getResearchItem(base: Base, key: string): ResearchItem | undefined {
  return byKey[base].get(key);
}

/** Niveau max atteignable pour cet item au niveau de hall donné. */
export function researchMaxForHall(item: ResearchItem, hall: number): number {
  let max = 0;
  for (const l of item.levels) {
    if (l.hallRequired == null || l.hallRequired <= hall) max = l.level;
  }
  return max;
}

const isNoise = (s: UpgradeStep) => s.cost === 0 && s.timeSeconds === 0;

/** Marches restantes pour un item, de fromLevel+1 au max (plafonné au hall courant par défaut). */
export function researchSteps(
  item: ResearchItem,
  fromLevel: number,
  hall: number,
  opts: { includeLocked?: boolean } = {},
): UpgradeStep[] {
  const ceiling = opts.includeLocked ? item.maxLevel : researchMaxForHall(item, hall);
  const steps: UpgradeStep[] = [];
  for (let to = Math.max(fromLevel, 0) + 1; to <= ceiling; to++) {
    const def = item.levels[to - 1];
    if (!def) break;
    const reqHall = def.hallRequired ?? 0;
    steps.push({
      instanceId: item.key,
      key: item.key,
      name: item.name,
      category: item.kind,
      icon: item.icon,
      base: item.base,
      fromLevel: to - 1,
      toLevel: to,
      cost: def.cost,
      resource: def.resource,
      timeSeconds: def.timeSeconds,
      xp: def.xp,
      quantity: 1,
      locked: reqHall > hall,
      unlocksAtHall: reqHall > hall ? reqHall : null,
    });
  }
  return steps;
}

export function nextResearchStep(base: Base, key: string, fromLevel: number, hall: number): NextStep {
  const item = getResearchItem(base, key);
  if (!item || fromLevel >= item.maxLevel) return { state: 'maxed' };
  const [step] = researchSteps(item, fromLevel, hall, { includeLocked: true });
  if (!step) return { state: 'maxed' };
  if (step.locked) return { state: 'locked', step, unlocksAtHall: step.unlocksAtHall! };
  return { state: 'available', step };
}

export interface ResearchGroup {
  source: 'research';
  key: string;
  name: string;
  kind: ResearchKind;
  category: ResearchKind;
  icon: string | null;
  base: Base;
  count: 1;
  level: number;
  /** compat avec BuildingGroup pour la carte partagée */
  copyLevels: number[];
  instanceIds: string[];
  identical: true;
  isWall: false;
  wished: boolean;
  target: number;
  next: UpgradeStep | null;
  steps: UpgradeStep[];
  stepsLocked: UpgradeStep[];
  totalByResource: ResourceTotals;
  totalBuilderSeconds: number;
}

export function groupResearch(village: Village, opts: { includeLocked?: boolean } = {}): ResearchGroup[] {
  const out: ResearchGroup[] = [];
  const wishlist = new Set(village.wishlist ?? []);
  for (const item of getResearch(village.base)) {
    const level = village.research?.[item.key]?.level ?? 0;
    const all = researchSteps(item, level, village.hall, { includeLocked: true });
    const steps = all.filter((s) => !s.locked && !isNoise(s));
    const stepsLocked = all.filter((s) => s.locked && !isNoise(s));
    const visibleLocked = opts.includeLocked ? stepsLocked : [];
    if (steps.length === 0 && visibleLocked.length === 0) continue;
    out.push({
      source: 'research',
      key: item.key,
      name: item.name,
      kind: item.kind,
      category: item.kind,
      icon: levelIcon(item, level),
      base: item.base,
      count: 1,
      level,
      copyLevels: [level],
      instanceIds: [item.key],
      identical: true,
      isWall: false,
      wished: wishlist.has(item.key),
      target: researchMaxForHall(item, village.hall),
      next: steps[0] ?? null,
      steps,
      stepsLocked,
      totalByResource: sumByResource(steps),
      totalBuilderSeconds: sumBuilderSeconds(steps),
    });
  }
  return out;
}

export function presetResearch(base: Base, hall: number, mode: PresetMode): Record<string, { level: number }> {
  if (mode === 'fresh') return {};
  const prev = Math.max(1, hall - 1);
  const out: Record<string, { level: number }> = {};
  for (const item of getResearch(base)) {
    const level = researchMaxForHall(item, prev);
    if (level > 0) out[item.key] = { level };
  }
  return out;
}
