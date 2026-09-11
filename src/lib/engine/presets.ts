import { countAtHall, getCatalog, instanceId } from './catalog';
import { isWall, maxLevelForHall, WALL_INSTANCE } from './progress';
import type { Base, BuildingInstanceState } from './types';

export type PresetMode = 'fresh' | 'advanced';

/**
 * Préremplit l'état des bâtiments à la création d'un village.
 *  - `fresh`    : rien (tout à 0, à saisir).
 *  - `advanced` : chaque exemplaire au max autorisé par le hall précédent
 *                 (0 si le bâtiment n'existait pas encore).
 */
export function presetBuildings(base: Base, hall: number, mode: PresetMode): Record<string, BuildingInstanceState> {
  if (mode === 'fresh') return {};

  const prev = Math.max(1, hall - 1);
  const out: Record<string, BuildingInstanceState> = {};

  for (const building of getCatalog(base)) {
    const count = countAtHall(building, hall);
    if (count === 0) continue;
    const level = maxLevelForHall(building, prev);
    if (level <= 0) continue;

    if (isWall(building)) {
      out[WALL_INSTANCE] = { level };
      continue;
    }
    for (let i = 1; i <= count; i++) out[instanceId(building.key, i)] = { level };
  }
  return out;
}
