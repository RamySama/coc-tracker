/**
 * Génère un dataset "slim" pour le tracker à partir du package `clash-of-clans-data`.
 *
 *  - Lit les JSON de node_modules/clash-of-clans-data/data/{home,builder}/**
 *  - Normalise le schéma (coûts, ressources, temps, hall requis)
 *  - Copie les icônes utilisées dans public/coc/
 *  - Écrit src/data/game/{buildings.home.json, buildings.builder.json, research.home.json,
 *    research.builder.json, halls.json, meta.json}
 *
 * Lancer :  node scripts/build-game-data.mjs
 * Mettre à jour la source :  npm run update-data
 */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PKG_DIR = join(ROOT, 'node_modules', 'clash-of-clans-data');
const PKG_VERSION = JSON.parse(readFileSync(join(PKG_DIR, 'package.json'), 'utf8')).version;
const DATA_DIR = join(PKG_DIR, 'data');

const OUT_DATA = join(ROOT, 'src', 'data', 'game');
const OUT_IMG = join(ROOT, 'public', 'coc');

// Catégories "bâtiments à améliorer par un ouvrier" (structures posées).
const CATEGORIES = {
  home: ['defenses', 'crafted-defenses', 'army-buildings', 'resource-buildings', 'traps', 'walls', 'other'],
  builder: ['defenses', 'army-buildings', 'resource-buildings', 'traps', 'walls', 'other'],
};

// Progression armée / labo : onglet "Recherche". [dossier, kind]
const RESEARCH_DIRS = {
  home: [
    ['heroes', 'hero'],
    ['guardians', 'guardian'],
    ['pets', 'pet'],
    ['troops', 'troop'],
    ['siege-machines', 'siege'],
    ['spells', 'spell'],
  ],
  builder: [
    ['heroes', 'hero'],
    ['troops', 'troop'],
  ],
};

// Ordre d'affichage voulu (ordre de déblocage en jeu). Les troupes/sorts d'élixir noir
// sont reclassés en 'dark-troop' / 'dark-spell'. Items absents = triés après, par HDV.
const RESEARCH_KIND_ORDER = ['hero', 'guardian', 'pet', 'troop', 'dark-troop', 'siege', 'spell', 'dark-spell'];
const RESEARCH_ITEM_ORDER = [
  // Caserne
  'barbarian', 'archer', 'giant', 'goblin', 'wall-breaker', 'balloon', 'wizard', 'healer', 'dragon',
  'pekka', 'baby-dragon', 'miner', 'electro-dragon', 'yeti', 'dragon-rider', 'electro-titan',
  'root-rider', 'thrower', 'meteor-golem',
  // Caserne noire
  'minion', 'hog-rider', 'valkyrie', 'golem', 'witch', 'lava-hound', 'bowler', 'ice-golem',
  'headhunter', 'apprentice-warden', 'druid', 'furnace',
  // Sorts
  'lightning-spell', 'healing-spell', 'rage-spell', 'jump-spell', 'freeze-spell', 'clone-spell',
  'invisibility-spell', 'recall-spell', 'revive-spell', 'totem-spell',
  // Sorts noirs
  'poison-spell', 'earthquake-spell', 'haste-spell', 'skeleton-spell', 'bat-spell',
  'overgrowth-spell', 'ice-block-spell',
];

/** "Dark Elixir" -> "darkElixir" ; "Gold or Elixir" -> "goldOrElixir" ; "Builder Gold" -> "builderGold" */
function resourceKey(raw) {
  if (!raw) return 'gold';
  return raw
    .trim()
    .replace(/\s+or\s+/gi, ' Or ')
    .split(/\s+/)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

function toSeconds(t) {
  if (!t) return 0;
  return (t.days || 0) * 86400 + (t.hours || 0) * 3600 + (t.minutes || 0) * 60 + (t.seconds || 0);
}

function walkJson(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJson(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

const usedIcons = new Set();
function registerIcon(rel) {
  if (rel && existsSync(join(PKG_DIR, rel))) {
    usedIcons.add(rel);
    return '/coc/' + rel.replace(/^images\//, '');
  }
  return null;
}
/** Icône représentative d'un bâtiment : image du dernier niveau, sinon icône générique. */
function buildingIcon(json) {
  const levels = json.levels || [];
  for (let i = levels.length - 1; i >= 0; i--) {
    const img = levels[i].images || {};
    const hit = registerIcon(img.normal) || registerIcon(img.icon);
    if (hit) return hit;
  }
  const img = json.images || {};
  return registerIcon(img.normal) || registerIcon(img.icon);
}

/** Mapping niveau d'un bâtiment -> HDV requis. Sert à corriger les gates d'unité. */
function buildingLevelToTh(base, ...relPaths) {
  for (const rel of relPaths) {
    const p = join(DATA_DIR, base, rel);
    if (existsSync(p)) {
      const j = JSON.parse(readFileSync(p, 'utf8'));
      const map = new Map();
      for (const l of j.levels || []) map.set(l.level, l.townHallRequired ?? l.builderHallRequired ?? null);
      if (map.size) return map;
    }
  }
  return new Map();
}

function heroHallToTh(base) {
  return buildingLevelToTh(base, 'army-buildings/hero-hall.json', 'army-buildings/hero-banner.json');
}

function normalizeBuilding(json, base) {
  const availRaw = json.availablePerTownHall || json.availablePerBuilderHall || [];
  const availablePerHall = availRaw.map((a) => ({
    hall: a.townHallLevel ?? a.builderHallLevel,
    count: a.count ?? 0,
    ...(a.countAfterMerges != null ? { countAfterMerges: a.countAfterMerges } : {}),
  }));

  // le package concatène les niveaux "Supercharge" (TH17+) à la suite, level repart à 1 :
  // on les écarte (feature séparée plus tard).
  const levels = (json.levels || [])
    .filter((l) => !l.supercharge)
    .map((l) => ({
      level: l.level,
      cost: l.buildCost ?? l.upgradeCost ?? 0,
      resource: resourceKey(l.buildCostResource ?? l.upgradeCostResource),
      timeSeconds: toSeconds(l.buildTime ?? l.upgradeTime),
      hallRequired: l.townHallRequired ?? l.builderHallRequired ?? null,
      xp: l.xpGained ?? 0,
      icon: registerIcon(l.images?.normal) || registerIcon(l.images?.icon),
      // capacité de stockage à ce niveau (bâtiments de stockage type Réservoir d'or…)
      capacity: l.capacity ?? null,
    }));

  return {
    key: json.id,
    name: json.name,
    base,
    category: json.category || 'other',
    size: json.size ?? null,
    maxLevel: levels.length ? levels[levels.length - 1].level : 0,
    icon: buildingIcon(json),
    availablePerHall,
    levels,
  };
}

function buildBase(base) {
  const buildings = [];
  for (const cat of CATEGORIES[base]) {
    for (const file of walkJson(join(DATA_DIR, base, cat))) {
      const json = JSON.parse(readFileSync(file, 'utf8'));
      if (!Array.isArray(json.levels) || json.levels.length === 0) continue;
      buildings.push(normalizeBuilding(json, base));
    }
  }
  buildings.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  return buildings;
}

/**
 * Troupes / sorts / engins / familiers / héros / gardiens : progression armée-labo.
 * `maps` = { hh, lab, spellFactory, darkSpellFactory, workshop, petHouse, barracks, darkBarracks }.
 * Le HDV requis d'un niveau est corrigé par le max( HDV brut, HDV du bâtiment de production
 * requis, HDV du labo requis ) : les données du package sous-estiment souvent le niveau 1.
 */
function normalizeResearch(json, base, kind, maps) {
  const rawLevels = (json.levels || []).filter((l) => !l.supercharge);
  const isDark = rawLevels.some(
    (l) => resourceKey(l.researchCostResource ?? l.upgradeCostResource ?? l.buildCostResource) === 'darkElixir',
  );

  // HDV auquel l'élément devient disponible (bâtiment de production requis)
  let unlockTh = 0;
  // bâtiment de production réel qui déclenche le déblocage (indépendant du HDV) :
  // le joueur peut être au bon HDV sans avoir encore monté ce bâtiment.
  let unlockBuilding = null;
  let unlockLevel = 0;
  if (kind === 'spell') {
    const m = isDark ? maps.darkSpellFactory : maps.spellFactory;
    unlockTh = m.get(json.spellFactoryLevelRequired) ?? 0;
    unlockBuilding = isDark ? 'dark-spell-factory' : 'spell-factory';
    unlockLevel = json.spellFactoryLevelRequired ?? 0;
  } else if (kind === 'siege') {
    unlockTh = maps.workshop.get(json.workshopLevelRequired) ?? 0;
    unlockBuilding = 'workshop';
    unlockLevel = json.workshopLevelRequired ?? 0;
  } else if (kind === 'pet') {
    unlockTh = maps.petHouse.get(json.petHouseLevelRequired) ?? 0;
    unlockBuilding = 'pet-house';
    unlockLevel = json.petHouseLevelRequired ?? 0;
  } else if (kind === 'troop') {
    const m = isDark ? maps.darkBarracks : maps.barracks;
    unlockTh = m.get(json.barrackLevelRequired) ?? 0;
    unlockBuilding = isDark ? 'dark-barracks' : base === 'builder' ? 'builder-barracks' : 'barracks';
    unlockLevel = json.barrackLevelRequired ?? 0;
  }
  const unlock = unlockBuilding && unlockLevel > 0 ? { building: unlockBuilding, level: unlockLevel } : null;

  const levels = rawLevels.map((l) => {
    const heroTh = l.heroHallLevelRequired != null ? maps.hh.get(l.heroHallLevelRequired) : null;
    const rawHall =
      l.townHallRequired ??
      heroTh ??
      l.builderHallLevelRequired ??
      l.builderHallRequired ??
      l.starLabRequired ??
      null;
    const labTh = l.laboratoryRequired ? maps.lab.get(l.laboratoryRequired) ?? 0 : 0;
    const hall = Math.max(rawHall ?? 0, unlockTh, labTh) || null;
    return {
      level: l.level,
      cost: l.researchCost ?? l.upgradeCost ?? l.buildCost ?? 0,
      resource: resourceKey(l.researchCostResource ?? l.upgradeCostResource ?? l.buildCostResource),
      timeSeconds: toSeconds(l.researchTime ?? l.upgradeTime ?? l.buildTime),
      hallRequired: hall,
      labRequired: l.laboratoryRequired ?? l.spellFactoryLevelRequired ?? l.petHouseLevelRequired ?? l.starLabRequired ?? null,
      xp: l.xpGained ?? 0,
      icon: registerIcon(l.images?.normal) || registerIcon(l.images?.icon),
    };
  });

  let finalKind = kind;
  if (kind === 'troop' && isDark) finalKind = 'dark-troop';
  if (kind === 'spell' && isDark) finalKind = 'dark-spell';
  const orderIdx = RESEARCH_ITEM_ORDER.indexOf(json.id);

  return {
    key: json.id,
    name: json.name,
    kind: finalKind,
    order: orderIdx === -1 ? 999 : orderIdx,
    base,
    maxLevel: levels.length ? levels[levels.length - 1].level : 0,
    icon: buildingIcon(json),
    unlock,
    levels,
  };
}

function buildResearch(base) {
  const maps = {
    hh: heroHallToTh(base),
    lab: buildingLevelToTh(base, 'army-buildings/laboratory.json', 'army-buildings/star-laboratory.json'),
    spellFactory: buildingLevelToTh(base, 'army-buildings/spell-factory.json'),
    darkSpellFactory: buildingLevelToTh(base, 'army-buildings/dark-spell-factory.json'),
    workshop: buildingLevelToTh(base, 'army-buildings/workshop.json'),
    petHouse: buildingLevelToTh(base, 'army-buildings/pet-house.json'),
    barracks: buildingLevelToTh(base, 'army-buildings/barracks.json', 'army-buildings/builder-barracks.json'),
    darkBarracks: buildingLevelToTh(base, 'army-buildings/dark-barracks.json'),
  };
  const items = [];
  for (const [dir, kind] of RESEARCH_DIRS[base]) {
    for (const file of walkJson(join(DATA_DIR, base, dir))) {
      const json = JSON.parse(readFileSync(file, 'utf8'));
      if (!Array.isArray(json.levels) || json.levels.length === 0) continue;
      items.push(normalizeResearch(json, base, kind, maps));
    }
  }
  const kindRank = (k) => {
    const i = RESEARCH_KIND_ORDER.indexOf(k);
    return i === -1 ? 99 : i;
  };
  const firstHall = (it) => it.levels.find((l) => l.hallRequired != null)?.hallRequired ?? 99;
  items.sort(
    (a, b) =>
      kindRank(a.kind) - kindRank(b.kind) ||
      a.order - b.order ||
      firstHall(a) - firstHall(b) ||
      a.name.localeCompare(b.name),
  );
  return items;
}

function buildHalls() {
  const halls = {};
  const th = JSON.parse(readFileSync(join(DATA_DIR, 'home/town-hall/town-hall.json'), 'utf8'));
  halls.home = th.levels.map((l) => ({
    level: l.level,
    cost: l.buildCost ?? 0,
    resource: resourceKey(l.buildCostResource),
    timeSeconds: toSeconds(l.buildTime),
    maxBuildings: l.maxBuildings ?? null,
    storageCapacity: l.storageCapacity ?? null,
    icon: registerIcon(l.images?.normal),
  }));
  const bh = JSON.parse(readFileSync(join(DATA_DIR, 'builder/builder-hall/builder-hall.json'), 'utf8'));
  halls.builder = bh.levels.map((l) => ({
    level: l.level,
    cost: l.buildCost ?? 0,
    resource: resourceKey(l.buildCostResource),
    timeSeconds: toSeconds(l.buildTime),
    maxBuildings: l.maxBuildings ?? null,
    storageCapacity: l.storageCapacity ?? null,
    icon: registerIcon(l.images?.normal),
  }));
  return halls;
}

// ---- run ----
rmSync(OUT_IMG, { recursive: true, force: true });
mkdirSync(OUT_IMG, { recursive: true });
mkdirSync(OUT_DATA, { recursive: true });

const home = buildBase('home');
const builder = buildBase('builder');
const researchHome = buildResearch('home');
const researchBuilder = buildResearch('builder');
const halls = buildHalls();

for (const rel of usedIcons) {
  const dest = join(OUT_IMG, rel.replace(/^images\//, ''));
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(PKG_DIR, rel), dest);
}

const meta = {
  sourcePackage: 'clash-of-clans-data',
  sourceVersion: PKG_VERSION,
  generatedAt: new Date().toISOString(),
  maxTownHall: halls.home[halls.home.length - 1].level,
  maxBuilderHall: halls.builder[halls.builder.length - 1].level,
  counts: {
    home: home.length,
    builder: builder.length,
    researchHome: researchHome.length,
    researchBuilder: researchBuilder.length,
    icons: usedIcons.size,
  },
};

writeFileSync(join(OUT_DATA, 'buildings.home.json'), JSON.stringify(home, null, 2));
writeFileSync(join(OUT_DATA, 'buildings.builder.json'), JSON.stringify(builder, null, 2));
writeFileSync(join(OUT_DATA, 'research.home.json'), JSON.stringify(researchHome, null, 2));
writeFileSync(join(OUT_DATA, 'research.builder.json'), JSON.stringify(researchBuilder, null, 2));
writeFileSync(join(OUT_DATA, 'halls.json'), JSON.stringify(halls, null, 2));
writeFileSync(join(OUT_DATA, 'meta.json'), JSON.stringify(meta, null, 2));

console.log('game-data généré :', JSON.stringify(meta.counts), '| source v' + PKG_VERSION);
