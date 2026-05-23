import { create } from 'zustand';

export type TtsProvider = 'voxtral' | 'macos_say' | 'web_speech';

export interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  soundEffects: boolean;
  animations: boolean;
  autoPlayAudio: boolean;
  ttsProvider: TtsProvider;
  preferredVoice: string;
  voxtralVoiceId: string | null;
  voiceRate: number;
  showIpa: boolean;
  fsrsRetention: number;
  useMacSay: boolean;
  heartsEnabled: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Omit<SettingsState, 'load' | 'update' | 'loaded'>>) => Promise<void>;
}

export const useSettings = create<SettingsState>((set) => ({
  theme: 'dark',
  soundEffects: true,
  animations: true,
  autoPlayAudio: true,
  ttsProvider: 'voxtral',
  preferredVoice: 'Samantha',
  voxtralVoiceId: null,
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
