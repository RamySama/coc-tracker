interface HasLevels {
  icon: string | null;
  maxLevel: number;
  levels: { level: number; icon?: string | null }[];
}

/**
 * Image d'un bâtiment / d'une troupe pour un niveau donné.
 * Niveau 0 (non construit) → image du niveau 1. Retombe sur l'icône générique si besoin.
 */
export function levelIcon(item: HasLevels | null | undefined, level: number): string | null {
  if (!item) return null;
  const idx = Math.min(Math.max(level, 1), item.maxLevel) - 1;
  return item.levels[idx]?.icon ?? item.icon ?? null;
}
