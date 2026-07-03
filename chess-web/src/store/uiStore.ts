import { create } from 'zustand';

type Tab = 'play' | 'learn' | 'profile' | 'settings';
type GameMode = null | 'local' | 'engine';

interface UIState {
  activeTab: Tab;
  gameMode: GameMode;
  timeControl: number | null; // em segundos
  setActiveTab: (tab: Tab) => void;
  setGameMode: (mode: GameMode) => void;
  setTimeControl: (time: number | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'play',
  gameMode: null,
  timeControl: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setTimeControl: (time) => set({ timeControl: time }),
}));
