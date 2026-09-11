import homeBuildings from '../../data/game/buildings.home.json';
import builderBuildings from '../../data/game/buildings.builder.json';
import hallsData from '../../data/game/halls.json';
import metaData from '../../data/game/meta.json';
import type { Base, Building, HallLevel } from './types';

const CATALOG: Record<Base, Building[]> = {
  home: homeBuildings as unknown as Building[],
  builder: builderBuildings as unknown as Building[],
};

const halls = hallsData as unknown as { home: HallLevel[]; builder: HallLevel[] };
const HALLS: Record<Base, HallLevel[]> = {
  home: halls.home,
  builder: halls.builder,
};

export const meta = metaData as {
  sourcePackage: string;
  sourceVersion: string;
  generatedAt: string;
  maxTownHall: number;
  maxBuilderHall: number;
  counts: Record<string, number>;
};

export const BASES: Base[] = ['home', 'builder'];

export function getCatalog(base: Base): Building[] {
  return CATALOG[base];
}

const byKey: Record<Base, Map<string, Building>> = {
  home: new Map(CATALOG.home.map((b) => [b.key, b])),
  builder: new Map(CATALOG.builder.map((b) => [b.key, b])),
};

export function getBuilding(base: Base, key: string): Building | undefined {
  return byKey[base].get(key);
}

export function getHalls(base: Base): HallLevel[] {
  return HALLS[base];
}

export function getHall(base: Base, level: number): HallLevel | undefined {
  return HALLS[base].find((h) => h.level === level);
}

export function maxHall(base: Base): number {
  return HALLS[base][HALLS[base].length - 1].level;
}

/** Nombre d'exemplaires de ce bâtiment disponibles à un niveau de hall donné. */
export function countAtHall(building: Building, hall: number): number {
  let count = 0;
  for (const entry of building.availablePerHall) {
    if (entry.hall <= hall) count = entry.count;
  }
  return count;
}

/** Catégories présentes dans un catalogue, ordre d'affichage stable. */
const CATEGORY_ORDER = [
  'townhall',
  'defense',
  'crafted-defense',
  'trap',
  'wall',
  'army',
  'resource',
  'research',
  'other',
  // recherche / armée
  'hero',
  'guardian',
  'pet',
  'troop',
  'dark-troop',
  'siege',
  'spell',
  'dark-spell',
];

export function sortCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
}

export function instanceId(key: string, index: number): string {
  return `${key}#${index}`;
}

export function parseInstanceId(id: string): { key: string; index: number } {
  const at = id.lastIndexOf('#');
  return { key: id.slice(0, at), index: Number(id.slice(at + 1)) };
}
