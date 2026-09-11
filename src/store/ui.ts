import { create } from 'zustand';

interface UIState {
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useUI = create<UIState>((set) => ({
  searchOpen: false,
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
}));
