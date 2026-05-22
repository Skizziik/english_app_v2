import { create } from 'zustand';
import type { User, UserStats } from '@/types';

interface UserState {
  user: User | null;
  stats: UserStats | null;
  loaded: boolean;
  load: () => Promise<void>;
  setUser: (u: User | null) => void;
  setStats: (s: UserStats | null) => void;
  addXp: (amount: number) => Promise<void>;
  loseHeart: () => Promise<void>;
  bumpStreak: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  stats: null,
  loaded: false,
  async load() {
    const user = (await window.api.user.current()) as User | null;
    let stats: UserStats | null = null;
    if (user) {
      stats = (await window.api.stats.get()) as UserStats | null;
    }
    set({ user, stats, loaded: true });
  },
  setUser(u) {
    set({ user: u });
  },
  setStats(s) {
    set({ stats: s });
  },
  async addXp(amount) {
    const stats = (await window.api.stats.addXp(amount)) as UserStats;
    set({ stats });
  },
  async loseHeart() {
    const stats = (await window.api.stats.loseHeart()) as UserStats;
    set({ stats });
  },
  async bumpStreak() {
    const stats = (await window.api.stats.bumpStreak()) as UserStats;
    set({ stats });
  },
}));
