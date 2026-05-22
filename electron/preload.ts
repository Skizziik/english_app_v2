import { contextBridge, ipcRenderer } from 'electron';

const api = {
  db: {
    query: <T = unknown>(channel: string, payload?: unknown) =>
      ipcRenderer.invoke(`db:${channel}`, payload) as Promise<T>,
  },
  tts: {
    speak: (payload: { text: string; voice?: string; rate?: number }) =>
      ipcRenderer.invoke('tts:speak', payload) as Promise<void>,
    listVoices: () => ipcRenderer.invoke('tts:listVoices') as Promise<Array<{ id: string; name: string; lang: string }>>,
    stop: () => ipcRenderer.invoke('tts:stop') as Promise<void>,
  },
  mistral: {
    chat: (payload: { messages: Array<{ role: string; content: string }>; model?: string }) =>
      ipcRenderer.invoke('mistral:chat', payload) as Promise<string>,
    checkWriting: (payload: { text: string; topic: string; level: string }) =>
      ipcRenderer.invoke('mistral:checkWriting', payload) as Promise<unknown>,
    explainWord: (payload: { word: string; sentence: string }) =>
      ipcRenderer.invoke('mistral:explainWord', payload) as Promise<string>,
    validateCloze: (payload: { sentence: string; userWord: string }) =>
      ipcRenderer.invoke('mistral:validateCloze', payload) as Promise<unknown>,
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get') as Promise<Record<string, unknown>>,
    set: (patch: Record<string, unknown>) =>
      ipcRenderer.invoke('settings:set', patch) as Promise<void>,
  },
  user: {
    current: () => ipcRenderer.invoke('user:current') as Promise<unknown>,
    create: (payload: unknown) => ipcRenderer.invoke('user:create', payload) as Promise<unknown>,
    update: (payload: unknown) => ipcRenderer.invoke('user:update', payload) as Promise<unknown>,
    completeOnboarding: (payload: unknown) =>
      ipcRenderer.invoke('user:completeOnboarding', payload) as Promise<unknown>,
  },
  stats: {
    get: () => ipcRenderer.invoke('stats:get') as Promise<unknown>,
    addXp: (amount: number) => ipcRenderer.invoke('stats:addXp', amount) as Promise<unknown>,
    loseHeart: () => ipcRenderer.invoke('stats:loseHeart') as Promise<unknown>,
    refillHearts: () => ipcRenderer.invoke('stats:refillHearts') as Promise<unknown>,
    bumpStreak: () => ipcRenderer.invoke('stats:bumpStreak') as Promise<unknown>,
  },
  words: {
    list: (filter: unknown) => ipcRenderer.invoke('words:list', filter) as Promise<unknown[]>,
    get: (id: number) => ipcRenderer.invoke('words:get', id) as Promise<unknown>,
    search: (q: string) => ipcRenderer.invoke('words:search', q) as Promise<unknown[]>,
  },
  lessons: {
    listUnits: () => ipcRenderer.invoke('lessons:listUnits') as Promise<unknown[]>,
    listForUnit: (unitId: number) =>
      ipcRenderer.invoke('lessons:listForUnit', unitId) as Promise<unknown[]>,
    get: (id: number) => ipcRenderer.invoke('lessons:get', id) as Promise<unknown>,
    complete: (payload: unknown) =>
      ipcRenderer.invoke('lessons:complete', payload) as Promise<unknown>,
  },
  srs: {
    dueQueue: (limit: number) => ipcRenderer.invoke('srs:dueQueue', limit) as Promise<unknown[]>,
    review: (payload: { userWordId: number; rating: number }) =>
      ipcRenderer.invoke('srs:review', payload) as Promise<unknown>,
    enqueueWords: (wordIds: number[]) =>
      ipcRenderer.invoke('srs:enqueueWords', wordIds) as Promise<unknown>,
  },
  grammar: {
    list: () => ipcRenderer.invoke('grammar:list') as Promise<unknown[]>,
    get: (id: number) => ipcRenderer.invoke('grammar:get', id) as Promise<unknown>,
  },
  stories: {
    list: () => ipcRenderer.invoke('stories:list') as Promise<unknown[]>,
    get: (id: number) => ipcRenderer.invoke('stories:get', id) as Promise<unknown>,
    markRead: (id: number) => ipcRenderer.invoke('stories:markRead', id) as Promise<unknown>,
  },
  achievements: {
    list: () => ipcRenderer.invoke('achievements:list') as Promise<unknown[]>,
    unlocked: () => ipcRenderer.invoke('achievements:unlocked') as Promise<unknown[]>,
  },
  sessions: {
    start: (activityType: string) =>
      ipcRenderer.invoke('sessions:start', activityType) as Promise<number>,
    end: (payload: unknown) => ipcRenderer.invoke('sessions:end', payload) as Promise<unknown>,
    history: (days: number) => ipcRenderer.invoke('sessions:history', days) as Promise<unknown[]>,
  },
  onNavigate: (cb: (route: string) => void) => {
    const handler = (_: unknown, route: string) => cb(route);
    ipcRenderer.on('navigate', handler);
    return () => ipcRenderer.removeListener('navigate', handler);
  },
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
