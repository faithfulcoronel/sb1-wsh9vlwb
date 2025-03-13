import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WelcomeState {
  hasSeenWelcome: boolean;
  setHasSeenWelcome: (value: boolean) => void;
}

export const useWelcomeStore = create<WelcomeState>()(
  persist(
    (set) => ({
      hasSeenWelcome: false,
      setHasSeenWelcome: (value) => set({ hasSeenWelcome: value }),
    }),
    {
      name: 'welcome-settings',
    }
  )
);