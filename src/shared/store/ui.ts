import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      isDarkMode: false, // Pivot to Light-First default
      toggleSidebar: () => set((state: UiState) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      toggleDarkMode: () => set((state: UiState) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'ui-storage',
    }
  )
);
