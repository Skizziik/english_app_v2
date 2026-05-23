import fs from 'node:fs';
import { settingsPath } from './paths';

export type TtsProvider = 'voxtral' | 'macos_say' | 'web_speech';

export interface AppSettings {
  windowBounds?: { x?: number; y?: number; width: number; height: number };
  theme: 'dark' | 'light' | 'system';
  soundEffects: boolean;
  animations: boolean;
  autoPlayAudio: boolean;
  ttsProvider: TtsProvider;
  preferredVoice: string;        // macOS voice name (Samantha, Alex...)
  voxtralVoiceId: string | null; // Voxtral voice_id (or null for default)
  voiceRate: number;
  showIpa: boolean;
  fsrsRetention: number;
  useMacSay: boolean;            // kept for back-compat; ignored if ttsProvider is set
  heartsEnabled: boolean;
  mistralApiKey?: string;
}

const DEFAULTS: AppSettings = {
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
};

let cache: AppSettings = { ...DEFAULTS };

export function initSettings(): void {
  try {
    if (fs.existsSync(settingsPath())) {
      const raw = fs.readFileSync(settingsPath(), 'utf-8');
      const parsed = JSON.parse(raw);
      cache = { ...DEFAULTS, ...parsed };
    } else {
      persist();
    }
  } catch (err) {
    console.error('[settings] failed to read, using defaults', err);
    cache = { ...DEFAULTS };
  }
}

export function getSettings(): AppSettings {
  return cache;
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  cache = { ...cache, ...patch };
  persist();
  return cache;
}

function persist(): void {
  try {
    fs.writeFileSync(settingsPath(), JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[settings] failed to persist', err);
  }
}
