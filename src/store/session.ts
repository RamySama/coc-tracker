import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'fr' | 'en';

interface SessionState {
  locale: Locale;
  currentVillageId: string | null;
  hideMaxed: boolean;
  setLocale: (l: Locale) => void;
  setCurrentVillage: (id: string | null) => void;
  toggleHideMaxed: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      locale: 'fr',
      currentVillageId: null,
      hideMaxed: false,
      setLocale: (locale) => set({ locale }),
      setCurrentVillage: (currentVillageId) => set({ currentVillageId }),
      toggleHideMaxed: () => set((s) => ({ hideMaxed: !s.hideMaxed })),
    }),
    { name: 'coc-tracker.session.v1' },
  ),
);
