import { describe, expect, it } from 'vitest';
import { countAtHall, getBuilding, getCatalog, getHalls, maxHall } from './catalog';
import { completion, maxLevelForHall, nextStep, pendingUpgrades, storageCapacity } from './progress';
import { sumByResource, sumBuilderSeconds, wallClockSeconds } from './totals';
import { townHallDiff } from './planner';
import { presetBuildings } from './presets';
import { groupPendingByBuilding } from './grouping';
import {
  gateBuildingLevel,
  getResearch,
  getResearchItem,
  groupResearch,
  nextResearchStep,
  presetResearch,
  researchMaxAchievable,
  researchMaxForHall,
} from './research';
import type { Village } from './types';

describe('catalog', () => {
  it('charge les bâtiments du village principal', () => {
    const cannon = getBuilding('home', 'cannon');
    expect(cannon).toBeDefined();
    expect(cannon!.levels[0].cost).toBe(250);
    expect(cannon!.levels[0].resource).toBe('gold');
  });

  it('donne le bon nombre d’exemplaires par HDV', () => {
    const cannon = getBuilding('home', 'cannon')!;
    // 7 canons max à HDV 11
    expect(countAtHall(cannon, 11)).toBe(7);
    expect(countAtHall(cannon, 1)).toBeGreaterThanOrEqual(1);
  });

  it('HDV max cohérent avec les données', () => {
    expect(maxHall('home')).toBeGreaterThanOrEqual(17);
    expect(getHalls('home').length).toBe(maxHall('home'));
  });
});

describe('progress', () => {
  const village: Village = {
    base: 'home',
    hall: 11,
    builders: 5,
    buildings: { 'cannon#1': { level: 5 }, 'cannon#2': { level: 13 } },
  };

  it('maxLevelForHall respecte le hallRequired', () => {
    const cannon = getBuilding('home', 'cannon')!;
    const m10 = maxLevelForHall(cannon, 10);
    const m11 = maxLevelForHall(cannon, 11);
    expect(m11).toBeGreaterThanOrEqual(m10);
    expect(m11).toBeLessThanOrEqual(cannon.maxLevel);
  });

  it('nextStep renvoie la marche suivante disponible', () => {
    const res = nextStep('home', 'cannon', 5, 11);
    expect(res.state).toBe('available');
    if (res.state === 'available') {
      expect(res.step.toLevel).toBe(6);
      expect(res.step.cost).toBeGreaterThan(0);
    }
  });

  it('nextStep = maxed au-delà du niveau max', () => {
    const cannon = getBuilding('home', 'cannon')!;
    expect(nextStep('home', 'cannon', cannon.maxLevel, 18).state).toBe('maxed');
  });

  it('pendingUpgrades ne dépasse pas le max du HDV courant', () => {
    const steps = pendingUpgrades(village);
    const cannon = getBuilding('home', 'cannon')!;
    const cap = maxLevelForHall(cannon, 11);
    for (const s of steps.filter((s) => s.key === 'cannon')) {
      expect(s.toLevel).toBeLessThanOrEqual(cap);
      expect(s.locked).toBe(false);
    }
  });

  it('completion est entre 0 et 1', () => {
    const c = completion(village);
    expect(c.ratio).toBeGreaterThanOrEqual(0);
    expect(c.ratio).toBeLessThanOrEqual(1);
  });
});

describe('totals', () => {
  const village: Village = { base: 'home', hall: 10, builders: 5, buildings: {} };
  const steps = pendingUpgrades(village);

  it('sumByResource additionne par ressource', () => {
    const t = sumByResource(steps);
    expect(Object.keys(t).length).toBeGreaterThan(0);
    for (const v of Object.values(t)) expect(v).toBeGreaterThan(0);
  });

  it('wallClock <= temps cumulé et diminue avec plus d’ouvriers', () => {
    const total = sumBuilderSeconds(steps);
    const w1 = wallClockSeconds(steps, 1);
    const w5 = wallClockSeconds(steps, 5);
    expect(w1).toBeLessThanOrEqual(total + 1);
    expect(w5).toBeLessThanOrEqual(w1);
  });
});

describe('murs (agrégat)', () => {
  const village: Village = { base: 'home', hall: 11, builders: 5, buildings: { 'wall#all': { level: 10 } } };

  it('les murs comptent comme une seule entrée avec quantity', () => {
    const steps = pendingUpgrades(village).filter((s) => s.key === 'wall');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.instanceId === 'wall#all')).toBe(true);
    expect(steps[0].quantity).toBeGreaterThan(1);
    // coût = coût unitaire × quantité
    const cannon = getBuilding('home', 'wall')!;
    const unit = cannon.levels[steps[0].toLevel - 1].cost;
    expect(steps[0].cost).toBe(unit * steps[0].quantity);
  });

  it('completion pondère les murs par leur nombre', () => {
    const c = completion(village);
    expect(c.total).toBeGreaterThan(1000);
  });
});

describe('données — Supercharge écarté', () => {
  it('maxLevel réaliste (pas les niveaux supercharge)', () => {
    expect(getBuilding('home', 'gold-mine')!.maxLevel).toBeGreaterThan(10);
    expect(getBuilding('home', 'x-bow')!.maxLevel).toBeGreaterThan(8);
    // tous les niveaux strictement croissants
    for (const key of ['gold-mine', 'x-bow', 'air-defense', 'builders-hut']) {
      const lv = getBuilding('home', key)!.levels.map((l) => l.level);
      for (let i = 1; i < lv.length; i++) expect(lv[i]).toBeGreaterThan(lv[i - 1]);
    }
  });

  it('la Hutte d’ouvrier ne propose rien à HDV 11 (niveaux 2+ exigent HDV 14+)', () => {
    const bh = getBuilding('home', 'builders-hut')!;
    expect(maxLevelForHall(bh, 11)).toBe(1);
    const village: Village = { base: 'home', hall: 11, builders: 5, buildings: {} };
    const groups = groupPendingByBuilding(village);
    expect(groups.find((g) => g.key === 'builders-hut')).toBeUndefined();
  });
});

describe('presets', () => {
  it('advanced met les bâtiments au max du HDV précédent', () => {
    const b = presetBuildings('home', 12, 'advanced');
    const cannon = getBuilding('home', 'cannon')!;
    expect(b['cannon#1'].level).toBe(maxLevelForHall(cannon, 11));
    expect(b['wall#all'].level).toBe(maxLevelForHall(getBuilding('home', 'wall')!, 11));
  });
  it('fresh ne renvoie rien', () => {
    expect(Object.keys(presetBuildings('home', 12, 'fresh'))).toHaveLength(0);
  });
});

describe('grouping', () => {
  const village: Village = {
    base: 'home',
    hall: 12,
    builders: 5,
    buildings: presetBuildings('home', 12, 'advanced'),
  };

  it('fusionne les exemplaires identiques en un seul groupe', () => {
    const groups = groupPendingByBuilding(village);
    const cannon = groups.find((g) => g.key === 'cannon');
    expect(cannon).toBeDefined();
    expect(cannon!.identical).toBe(true);
    expect(cannon!.next).not.toBeNull();
  });

  it('exclut les marches à coût nul', () => {
    const groups = groupPendingByBuilding(village);
    for (const g of groups) for (const s of g.steps) expect(s.cost + s.timeSeconds).toBeGreaterThan(0);
  });
});

describe('recherche (armée / labo)', () => {
  it('héros et gardiens ont quitté le catalogue des bâtiments', () => {
    const cats = new Set(getCatalog('home').map((b) => b.category));
    expect(cats.has('hero')).toBe(false);
    expect(cats.has('guardian')).toBe(false);
    expect(getBuilding('home', 'barbarian-king')).toBeUndefined();
  });

  it('le dataset research couvre troupes / sorts / familiers / héros', () => {
    const kinds = new Set(getResearch('home').map((r) => r.kind));
    for (const k of ['troop', 'spell', 'pet', 'hero', 'siege', 'guardian']) expect(kinds.has(k as never)).toBe(true);
    expect(getResearchItem('home', 'barbarian')).toBeDefined();
    expect(getResearchItem('home', 'barbarian-king')).toBeDefined();
  });

  it('researchMaxForHall respecte le HDV requis', () => {
    const barb = getResearchItem('home', 'barbarian')!;
    const m8 = researchMaxForHall(barb, 8);
    const m9 = researchMaxForHall(barb, 9);
    expect(m9).toBeGreaterThanOrEqual(m8);
    for (const l of barb.levels.filter((x) => x.level <= m8)) expect(l.hallRequired ?? 0).toBeLessThanOrEqual(8);
  });

  it('presetResearch advanced met les troupes au max du HDV précédent', () => {
    const r = presetResearch('home', 12, 'advanced');
    const barb = getResearchItem('home', 'barbarian')!;
    expect(r['barbarian'].level).toBe(researchMaxForHall(barb, 11));
  });

  it('les sorts sont gatés par l’usine de sorts, pas seulement le HDV brut', () => {
    // Sort de saut / gel : usine de sorts niv. 4 -> HDV 9 (et non 8)
    const expected: Record<string, number> = {
      'jump-spell': 9,
      'freeze-spell': 9,
      'clone-spell': 10,
      'invisibility-spell': 11,
      'recall-spell': 13,
      'poison-spell': 8,
      'haste-spell': 9,
      'overgrowth-spell': 12,
      'ice-block-spell': 14,
    };
    for (const [key, th] of Object.entries(expected)) {
      const item = getResearchItem('home', key)!;
      expect(item.levels[0].hallRequired).toBe(th);
      expect(researchMaxForHall(item, th - 1)).toBe(0);
    }
  });

  it('groupResearch exclut les marches à coût nul', () => {
    const village: Village = { base: 'home', hall: 13, builders: 5, buildings: {}, research: {} };
    const groups = groupResearch(village);
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) for (const s of g.steps) expect(s.cost + s.timeSeconds).toBeGreaterThan(0);
  });
});

describe('stockage — capacité dynamique', () => {
  it('somme la capacité réelle des réservoirs construits (pas un chiffre générique par HDV)', () => {
    const goldStorage = getBuilding('home', 'gold-storage')!;
    const village: Village = {
      base: 'home',
      hall: 11,
      builders: 5,
      buildings: { 'gold-storage#1': { level: 5 }, 'gold-storage#2': { level: 3 } },
    };
    const expected = goldStorage.levels[4].capacity! + goldStorage.levels[2].capacity!;
    expect(storageCapacity(village).gold).toBe(expected);
  });

  it('les réservoirs non construits ne comptent pas', () => {
    const village: Village = { base: 'home', hall: 11, builders: 5, buildings: {} };
    expect(storageCapacity(village).gold ?? 0).toBe(0);
  });
});

describe('recherche — gatée par le Labo, pas seulement le HDV', () => {
  it('un niveau de troupe reste verrouillé si le Labo n’a pas encore le niveau requis', () => {
    const village: Village = {
      base: 'home',
      hall: 10,
      builders: 5,
      buildings: {},
      research: { barbarian: { level: 1 } },
    };
    const groups = groupResearch(village, { includeLocked: true });
    const barb = groups.find((g) => g.key === 'barbarian')!;
    expect(barb.steps.some((s) => s.toLevel > 1)).toBe(false);
    expect(barb.stepsLocked.some((s) => s.toLevel === 2)).toBe(true);
  });

  it('se débloque une fois le Labo construit au niveau requis', () => {
    const village: Village = {
      base: 'home',
      hall: 10,
      builders: 5,
      buildings: { 'laboratory#1': { level: 1 } },
      research: { barbarian: { level: 1 } },
    };
    const groups = groupResearch(village);
    const barb = groups.find((g) => g.key === 'barbarian')!;
    expect(barb.steps.some((s) => s.toLevel === 2)).toBe(true);
  });

  it('researchMaxAchievable plafonne au Labo actuel, pas seulement au HDV', () => {
    const barb = getResearchItem('home', 'barbarian')!;
    const hallOnly = researchMaxForHall(barb, 9); // HDV9 : plafond "un jour"
    const achievable = researchMaxAchievable(barb, 9, 0); // Labo niveau 0 (pas construit)
    expect(achievable).toBeLessThan(hallOnly);
    expect(achievable).toBeGreaterThanOrEqual(1); // le niveau 1 ne demande jamais de Labo
  });

  it('bloqué uniquement par le Labo (HDV déjà bon) -> état "maxed", pas "locked"', () => {
    // barbarian niv. 2 exige Labo niv. 1 (cf. dataset) ; ici le Labo est à 0.
    const state = nextResearchStep('home', 'barbarian', 1, 10, 0);
    expect(state.state).toBe('maxed');
  });

  it('gateBuildingLevel lit le niveau réel du Labo construit', () => {
    const village: Village = {
      base: 'home',
      hall: 10,
      builders: 5,
      buildings: { 'laboratory#1': { level: 4 } },
    };
    expect(gateBuildingLevel(village, 'troop')).toBe(4);
    expect(gateBuildingLevel(village, 'hero')).toBe(Infinity);
  });
});

describe('planner — townHallDiff', () => {
  it('HDV 10 -> 11 débloque de nouveaux bâtiments et niveaux', () => {
    const diff = townHallDiff('home', 10, 11);
    expect(diff.hallPath.length).toBe(1);
    expect(diff.hallPath[0].level).toBe(11);
    expect(diff.newBuildings.length + diff.higherLevels.length).toBeGreaterThan(0);
    expect(Object.keys(diff.costToMaxDelta).length).toBeGreaterThan(0);
  });

  it('la Tour de l’Aigle apparaît à HDV 11', () => {
    const diff = townHallDiff('home', 10, 11);
    const keys = [...diff.newBuildings, ...diff.extraCopies].map((b) => b.key);
    expect(keys).toContain('eagle-artillery');
  });

  it('storage rapporté et croissant sur une large plage', () => {
    const diff = townHallDiff('home', 10, 14);
    expect(diff.storageAfter!.gold).toBeGreaterThan(diff.storageBefore!.gold);
  });
});
