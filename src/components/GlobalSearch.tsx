import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useUI } from '../store/ui';
import { useCurrentVillage } from '../hooks/useCurrentVillage';
import { countAtHall, getCatalog } from '../lib/engine/catalog';
import { getResearch, researchMaxForHall } from '../lib/engine/research';
import { maxLevelForHall, WALL_INSTANCE, isWall } from '../lib/engine/progress';
import { buildingName } from '../lib/labels';
import { levelIcon } from '../lib/icons';
import { BuildingIcon } from './BuildingIcon';
import { ease } from '../lib/motion';

interface Hit {
  key: string;
  name: string;
  icon: string | null;
  level: number;
  target: number;
  where: 'buildings' | 'research';
  group: string;
}

export function GlobalSearch() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const open = useUI((s) => s.searchOpen);
  const openSearch = useUI((s) => s.openSearch);
  const closeSearch = useUI((s) => s.closeSearch);
  const village = useCurrentVillage();
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/input|textarea/i.test((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch, closeSearch]);

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    if (!village) return [];
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const match = (key: string, name: string) =>
      name.toLowerCase().includes(query) || buildingName(key, name, i18n.language).toLowerCase().includes(query);

    const out: Hit[] = [];
    for (const b of getCatalog(village.base)) {
      const count = countAtHall(b, village.hall);
      if (count === 0 || !match(b.key, b.name)) continue;
      const lvl = isWall(b)
        ? village.buildings[WALL_INSTANCE]?.level ?? 0
        : village.buildings[`${b.key}#1`]?.level ?? 0;
      out.push({
        key: b.key,
        name: buildingName(b.key, b.name, i18n.language),
        icon: levelIcon(b, lvl),
        level: lvl,
        target: maxLevelForHall(b, village.hall),
        where: 'buildings',
        group: t(`category.${b.category}`, b.category),
      });
    }
    for (const it of getResearch(village.base)) {
      const target = researchMaxForHall(it, village.hall);
      if (target === 0 || !match(it.key, it.name)) continue;
      const lvl = village.research?.[it.key]?.level ?? 0;
      out.push({
        key: it.key,
        name: buildingName(it.key, it.name, i18n.language),
        icon: levelIcon(it, lvl),
        level: lvl,
        target,
        where: 'research',
        group: t(`category.${it.kind}`, it.kind),
      });
    }
    return out.slice(0, 40);
  }, [village, q, i18n.language, t]);

  const go = (h: Hit) => {
    closeSearch();
    navigate(`/village/${h.where}?open=${encodeURIComponent(h.key)}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={ease}
        >
          <div className="absolute inset-0 bg-black/60" onClick={closeSearch} />
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-brand-2/30 bg-surface [box-shadow:var(--shadow-pop),0_0_44px_-14px_var(--color-brand-2)]"
            initial={{ y: -12, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={ease}
          >
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none"
            />
            <div className="max-h-[50vh] overflow-y-auto p-1.5">
              {q && hits.length === 0 && <p className="p-4 text-sm text-ink-dim">{t('search.noResults')}</p>}
              {hits.map((h) => (
                <button
                  key={h.where + h.key}
                  onClick={() => go(h)}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-surface-2"
                >
                  <BuildingIcon icon={h.icon} name={h.name} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm">{h.name}</span>
                  <span className="shrink-0 text-xs text-ink-dim">{h.group}</span>
                  <span className="shrink-0 text-xs tabular-nums text-ink-dim/70">
                    {h.level}/{h.target}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
