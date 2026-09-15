export type Base = 'home' | 'builder';

export type Resource =
  | 'gold'
  | 'elixir'
  | 'darkElixir'
  | 'builderGold'
  | 'builderElixir'
  | 'goldOrElixir';

export interface BuildingLevel {
  level: number;
  cost: number;
  resource: Resource;
  timeSeconds: number;
  hallRequired: number | null;
  xp: number;
  /** image du bâtiment à ce niveau */
  icon?: string | null;
  /** capacité de stockage à ce niveau (bâtiments de stockage uniquement) */
  capacity?: number | null;
}

export interface HallAvailability {
  hall: number;
  count: number;
  countAfterMerges?: number;
}

export interface Building {
  key: string;
  name: string;
  base: Base;
  category: string;
  size: string | null;
  maxLevel: number;
  icon: string | null;
  availablePerHall: HallAvailability[];
  levels: BuildingLevel[];
}

export interface HallLevel {
  level: number;
  cost: number;
  resource: Resource;
  timeSeconds: number;
  maxBuildings: number | null;
  storageCapacity: { gold: number; elixir: number; darkElixir: number } | null;
  icon: string | null;
}

/** État d'un exemplaire de bâtiment ("cannon#1"). level 0 = pas encore construit. */
export interface BuildingInstanceState {
  level: number;
  priority?: boolean;
}

export interface Village {
  base: Base;
  hall: number;
  builders: number;
  /** clé = instanceId "key#index" (index 1-based) */
  buildings: Record<string, BuildingInstanceState>;
  /** clé = key de l'item de recherche (troupe, sort, héros…) */
  research?: Record<string, { level: number }>;
  /** liste de souhaits : keys de bâtiments / items mis en objectif */
  wishlist?: string[];
}

/** Une marche d'amélioration concrète pour un exemplaire donné. */
export interface UpgradeStep {
  instanceId: string;
  key: string;
  name: string;
  category: string;
  icon: string | null;
  base: Base;
  fromLevel: number;
  toLevel: number;
  cost: number;
  resource: Resource;
  timeSeconds: number;
  xp: number;
  /** nb d'exemplaires concernés par cette marche (murs = plusieurs à la fois) */
  quantity: number;
  /** true si la marche demande un hall plus haut que le hall courant du village */
  locked: boolean;
  unlocksAtHall: number | null;
  /** recherche uniquement : niveau du bâtiment "gate" (Labo…) requis si c'est lui qui bloque */
  unlocksAtGateLevel?: number | null;
}
