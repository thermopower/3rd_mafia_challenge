import { create } from 'zustand';

export type AuthModalMode = 'login' | 'signup';

interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  pendingRedirect?: string;
  openModal: (mode: AuthModalMode, redirect?: string) => void;
  closeModal: () => void;
  switchMode: (mode: AuthModalMode) => void;
}

export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: 'login',
  pendingRedirect: undefined,
  openModal: (mode, redirect) =>
    set({ isOpen: true, mode, pendingRedirect: redirect }),
  closeModal: () =>
    set({ isOpen: false, mode: 'login', pendingRedirect: undefined }),
  switchMode: (mode) => set({ mode }),
}));
