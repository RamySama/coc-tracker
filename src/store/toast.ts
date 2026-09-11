import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'success' | 'danger';
  action?: { label: string; run: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => number;
  dismiss: (id: number) => void;
}

let seq = 1;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push(t) {
    const id = seq++;
    set((s) => ({ toasts: [...s.toasts.filter((x) => x.message !== t.message), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4200);
    return id;
  },
  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
  },
}));

/** helper hors-composant */
export const toast = {
  info: (message: string, action?: Toast['action']) => useToasts.getState().push({ message, kind: 'info', action }),
  success: (message: string, action?: Toast['action']) => useToasts.getState().push({ message, kind: 'success', action }),
  danger: (message: string, action?: Toast['action']) => useToasts.getState().push({ message, kind: 'danger', action }),
};
