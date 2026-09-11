import type { VillageDoc, VillageInput, VillagePatch, VillageRepo } from '../appTypes';

const KEY = 'coc-tracker.villages.v1';

function load(): VillageDoc[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VillageDoc[]) : [];
  } catch {
    return [];
  }
}

function save(villages: VillageDoc[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(villages));
  } catch {
    /* quota / mode privé : on ignore */
  }
}

function uid(): string {
  return 'v_' + Math.random().toString(36).slice(2, 10);
}

/** Dépôt local (localStorage). Utilisé hors-ligne ou sans compte. */
export function createLocalRepo(): VillageRepo {
  const listeners = new Set<(v: VillageDoc[]) => void>();
  const emit = () => {
    const v = load();
    listeners.forEach((l) => l(v));
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) emit();
    });
  }

  return {
    subscribe(cb) {
      listeners.add(cb);
      cb(load());
      return () => listeners.delete(cb);
    },
    async create(input: VillageInput) {
      const villages = load();
      const id = uid();
      villages.push({
        id,
        ...input,
        order: villages.length,
        buildings: {},
        updatedAt: Date.now(),
      });
      save(villages);
      emit();
      return id;
    },
    async update(id: string, patch: VillagePatch) {
      const villages = load();
      const i = villages.findIndex((v) => v.id === id);
      if (i === -1) return;
      villages[i] = { ...villages[i], ...patch, updatedAt: Date.now() };
      save(villages);
      emit();
    },
    async remove(id: string) {
      save(load().filter((v) => v.id !== id));
      emit();
    },
  };
}
