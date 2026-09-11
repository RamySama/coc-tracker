import type { Base, BuildingInstanceState } from './engine/types';

export interface VillageResources {
  gold: number;
  elixir: number;
  darkElixir: number;
  builderGold?: number;
  builderElixir?: number;
}

export interface VillagePlan {
  /** curseur « De » mémorisé dans la Planif */
  fromHall?: number;
  /** curseur « À » = objectif HDV */
  targetHall?: number;
  /** keys de bâtiments / items d'armée mis en objectif */
  wishlist?: string[];
}

export interface VillageDoc {
  id: string;
  name: string;
  base: Base;
  hall: number;
  builders: number;
  order: number;
  buildings: Record<string, BuildingInstanceState>;
  /** clé = key de l'item de recherche (troupe, sort, héros…), sans "#" */
  research?: Record<string, { level: number }>;
  resources?: VillageResources;
  plan?: VillagePlan;
  updatedAt: number;
}

export type VillageInput = Pick<VillageDoc, 'name' | 'base' | 'hall' | 'builders'>;

export type VillagePatch = Partial<Omit<VillageDoc, 'id'>>;

export interface VillageRepo {
  /** s'abonne à la liste des villages ; renvoie une fonction de désabonnement */
  subscribe(cb: (villages: VillageDoc[]) => void): () => void;
  create(input: VillageInput): Promise<string>;
  update(id: string, patch: VillagePatch): Promise<void>;
  remove(id: string): Promise<void>;
}
