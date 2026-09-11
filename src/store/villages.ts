import { create } from 'zustand';
import type { BuildingInstanceState } from '../lib/engine/types';
import type { VillageDoc, VillageInput, VillagePatch, VillagePlan, VillageRepo } from '../lib/appTypes';

interface VillagesState {
  villages: VillageDoc[];
  loading: boolean;
  repoKind: 'none' | 'local' | 'cloud';
  /** dernier changement annulable */
  lastChange: { label: string } | null;

  bind: (repo: VillageRepo | null, kind: 'none' | 'local' | 'cloud') => void;
  createVillage: (input: VillageInput) => Promise<string | null>;
  updateVillage: (id: string, patch: VillagePatch) => Promise<void>;
  removeVillage: (id: string) => Promise<void>;
  /** modifie/supprime l'état d'un exemplaire de bâtiment ; écriture différée (debounce) */
  setBuilding: (villageId: string, instanceId: string, next: Partial<BuildingInstanceState> | null, label?: string) => void;
  /** met plusieurs exemplaires au même niveau en une fois (un seul undo) */
  setBuildingLevels: (villageId: string, ids: string[], level: number, label?: string) => void;
  /** modifie/supprime le niveau d'un item de recherche ; écriture différée (debounce) */
  setResearch: (villageId: string, key: string, level: number | null, label?: string) => void;
  /** applique un patch de bâtiments/recherche en une fois (préréglages) */
  applyPreset: (villageId: string, patch: Pick<VillagePatch, 'buildings' | 'research'>, label: string) => void;
  /** met à jour la planif (curseurs De/À) ; écriture différée */
  setPlan: (villageId: string, patch: Partial<VillagePlan>) => void;
  /** (dé)coche une key dans la liste de souhaits */
  toggleWishlist: (villageId: string, key: string) => void;
  undoLast: () => void;
}

let repo: VillageRepo | null = null;
let unsub: (() => void) | null = null;
const flushTimers = new Map<string, ReturnType<typeof setTimeout>>();
const dirty = new Set<string>();
/** closure de restauration du dernier changement */
let undoFn: (() => void) | null = null;

export const useVillages = create<VillagesState>((set, get) => ({
  villages: [],
  loading: true,
  repoKind: 'none',
  lastChange: null,

  bind(nextRepo, kind) {
    unsub?.();
    unsub = null;
    repo = nextRepo;
    dirty.clear();
    set({ repoKind: kind, loading: Boolean(nextRepo), villages: nextRepo ? get().villages : [] });
    if (!nextRepo) {
      set({ loading: false, villages: [] });
      return;
    }
    unsub = nextRepo.subscribe((incoming) => {
      const merged = incoming.map((v) => (dirty.has(v.id) ? (get().villages.find((x) => x.id === v.id) ?? v) : v));
      set({ villages: merged, loading: false });
    });
  },

  async createVillage(input) {
    if (!repo) return null;
    return repo.create(input);
  },

  async updateVillage(id, patch) {
    if (!repo) return;
    set({ villages: get().villages.map((v) => (v.id === id ? { ...v, ...patch } : v)) });
    await repo.update(id, patch);
  },

  async removeVillage(id) {
    if (!repo) return;
    set({ villages: get().villages.filter((v) => v.id !== id) });
    await repo.remove(id);
  },

  setBuilding(villageId, instanceId, next, label) {
    const village = get().villages.find((v) => v.id === villageId);
    if (!village) return;
    const before = village.buildings;
    const buildings = { ...before };
    if (next === null) delete buildings[instanceId];
    else buildings[instanceId] = { ...(buildings[instanceId] ?? { level: 0 }), ...next };
    commit(villageId, { buildings }, get, set);
    registerUndo(label, () => commit(villageId, { buildings: before }, get, set), set);
  },

  setBuildingLevels(villageId, ids, level, label) {
    const village = get().villages.find((v) => v.id === villageId);
    if (!village) return;
    const before = village.buildings;
    const buildings = { ...before };
    for (const id of ids) {
      if (level <= 0) delete buildings[id];
      else buildings[id] = { ...(buildings[id] ?? { level: 0 }), level };
    }
    commit(villageId, { buildings }, get, set);
    registerUndo(label, () => commit(villageId, { buildings: before }, get, set), set);
  },

  setResearch(villageId, key, level, label) {
    const village = get().villages.find((v) => v.id === villageId);
    if (!village) return;
    const before = village.research ?? {};
    const research = { ...before };
    if (level === null || level <= 0) delete research[key];
    else research[key] = { level };
    commit(villageId, { research }, get, set);
    registerUndo(label, () => commit(villageId, { research: before }, get, set), set);
  },

  applyPreset(villageId, patch, label) {
    const village = get().villages.find((v) => v.id === villageId);
    if (!village) return;
    const before = { buildings: village.buildings, research: village.research ?? {} };
    commit(villageId, patch, get, set);
    registerUndo(label, () => commit(villageId, before, get, set), set);
  },

  setPlan(villageId, patch) {
    const village = get().villages.find((v) => v.id === villageId);
    if (!village) return;
    commit(villageId, { plan: { ...(village.plan ?? {}), ...patch } }, get, set);
  },

  toggleWishlist(villageId, key) {
    const village = get().villages.find((v) => v.id === villageId);
    if (!village) return;
    const cur = village.plan?.wishlist ?? [];
    const wishlist = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
    commit(villageId, { plan: { ...(village.plan ?? {}), wishlist } }, get, set);
  },

  undoLast() {
    undoFn?.();
    undoFn = null;
    set({ lastChange: null });
  },
}));

function commit(
  villageId: string,
  patch: Pick<VillagePatch, 'buildings' | 'research' | 'plan'>,
  get: () => VillagesState,
  set: (s: Partial<VillagesState>) => void,
) {
  dirty.add(villageId);
  set({ villages: get().villages.map((v) => (v.id === villageId ? { ...v, ...patch } : v)) });
  scheduleFlush(villageId, get);
}

function registerUndo(label: string | undefined, fn: () => void, set: (s: Partial<VillagesState>) => void) {
  if (!label) return;
  undoFn = fn;
  set({ lastChange: { label } });
}

function scheduleFlush(villageId: string, get: () => VillagesState) {
  clearTimeout(flushTimers.get(villageId));
  flushTimers.set(
    villageId,
    setTimeout(async () => {
      flushTimers.delete(villageId);
      const current = get().villages.find((v) => v.id === villageId);
      if (!current || !repo) return;
      try {
        await repo.update(villageId, {
          buildings: current.buildings,
          research: current.research ?? {},
          plan: current.plan ?? {},
        });
      } finally {
        dirty.delete(villageId);
      }
    }, 500),
  );
}
