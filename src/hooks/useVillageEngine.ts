import { useMemo } from 'react';
import type { VillageDoc } from '../lib/appTypes';
import type { UpgradeStep, Village } from '../lib/engine/types';
import { completion, expandInstances, pendingUpgrades } from '../lib/engine/progress';
import { groupPendingByBuilding } from '../lib/engine/grouping';
import { getResearch, groupResearch, researchMaxForHall } from '../lib/engine/research';
import { sumByResource, sumBuilderSeconds, sumXp, wallClockSeconds } from '../lib/engine/totals';

export function toEngineVillage(doc: VillageDoc): Village {
  return {
    base: doc.base,
    hall: doc.hall,
    builders: doc.builders,
    buildings: doc.buildings,
    research: doc.research,
    wishlist: doc.plan?.wishlist,
  };
}

export function useVillageEngine(doc: VillageDoc | null) {
  return useMemo(() => {
    if (!doc) return null;
    const village = toEngineVillage(doc);
    const instances = expandInstances(village);
    const unlocked: UpgradeStep[] = pendingUpgrades(village);
    const withLocked: UpgradeStep[] = pendingUpgrades(village, { includeLocked: true });
    const locked = withLocked.filter((s) => s.locked);

    const buildingComp = completion(village);
    // progression recherche : niveaux atteints / max-HDV, poids 1 par item
    let rDone = 0;
    let rTotal = 0;
    for (const item of getResearch(village.base)) {
      const target = researchMaxForHall(item, village.hall);
      rTotal += target;
      rDone += Math.min(village.research?.[item.key]?.level ?? 0, target);
    }
    const totalDone = buildingComp.done + rDone;
    const totalAll = buildingComp.total + rTotal;

    const researchGroups = groupResearch(village);
    const researchSteps = researchGroups.flatMap((g) => g.steps);
    const allUnlocked = [...unlocked, ...researchSteps];

    return {
      village,
      instances,
      unlocked,
      locked,
      withLocked,
      groups: groupPendingByBuilding(village),
      researchGroups,
      totals: {
        byResource: sumByResource(allUnlocked),
        builderSeconds: sumBuilderSeconds(unlocked),
        wallClock1: wallClockSeconds(unlocked, 1),
        wallClock: wallClockSeconds(unlocked, doc.builders),
        xp: sumXp(allUnlocked),
      },
      completion: { done: totalDone, total: totalAll, ratio: totalAll === 0 ? 0 : totalDone / totalAll },
    };
  }, [doc]);
}
