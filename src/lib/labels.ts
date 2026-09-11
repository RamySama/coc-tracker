import namesFr from '../data/game/names.fr.json';
import type { Base, Resource } from './engine/types';

const FR_NAMES = namesFr as Record<string, string>;

/** Nom localisé d'un bâtiment (fallback = nom anglais du dataset). */
export function buildingName(key: string, fallback: string, locale: string): string {
  if (locale === 'fr' && FR_NAMES[key]) return FR_NAMES[key];
  return fallback;
}

/** "TH" / "HDV" selon la base et la langue — clé i18n à résoudre par l'appelant. */
export function hallShortKey(base: Base): string {
  return base === 'home' ? 'base.hallHomeShort' : 'base.hallBuilderShort';
}

export function hallLongKey(base: Base): string {
  return base === 'home' ? 'base.hallHome' : 'base.hallBuilder';
}

export const RESOURCE_COLORS: Record<Resource, string> = {
  gold: '#f5c542',
  elixir: '#d946a8',
  darkElixir: '#a78bfa',
  builderGold: '#f5c542',
  builderElixir: '#d946a8',
  goldOrElixir: '#e879a9',
};

export const RESOURCE_ORDER: Resource[] = [
  'gold',
  'elixir',
  'darkElixir',
  'goldOrElixir',
  'builderGold',
  'builderElixir',
];
