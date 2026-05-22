import { create } from 'zustand';

export interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  soundEffects: boolean;
  animations: boolean;
  autoPlayAudio: boolean;
  preferredVoice: string;
  voiceRate: number;
  showIpa: boolean;
  fsrsRetention: number;
  useMacSay: boolean;
  heartsEnabled: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Omit<SettingsState, 'load' | 'update' | 'loaded'>>) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  theme: 'dark',
  soundEffects: true,
  animations: true,
  autoPlayAudio: true,
  preferredVoice: 'Samantha',
  voiceRate: 200,
  showIpa: true,
  fsrsRetention: 0.9,
  useMacSay: true,
  heartsEnabled: true,
  loaded: false,
  async load() {
    const s = (await window.api.settings.get()) as any;
    set({ ...s, loaded: true });
  },
  async update(patch) {
    set(patch as any);
    await window.api.settings.set(patch);
  },
}));
