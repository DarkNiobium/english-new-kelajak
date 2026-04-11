import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  user: {
    id: string;
    name: string;
    email: string;
    xp: number;
    streak: number;
    level: string;
  } | null;
  isAuthenticated: boolean;
  login: (userData: any) => void;
  logout: () => void;
  addXp: (amount: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (userData) => set({ user: userData, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      addXp: (amount) => set((state) => ({
        user: state.user ? { ...state.user, xp: state.user.xp + amount } : null
      }))
    }),
    {
      name: 'user-storage',
    }
  )
);
