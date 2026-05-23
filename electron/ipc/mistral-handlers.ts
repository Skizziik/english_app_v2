import { ipcMain } from 'electron';
import { createHash } from 'node:crypto';
import { sqlite } from '../db';
import { getSettings } from '../lib/settings';

const DEFAULT_KEY = 'omuPDQIstHg8D0ZLilaqQPO1jpGJTze4';

// We need a *native* dynamic import here because the SDK is ESM-only,
// and TypeScript's CommonJS compilation otherwise rewrites import() into require().
const nativeImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>;

let MistralCtor: any | null = null;
async function loadMistral(): Promise<any> {
  if (MistralCtor) return MistralCtor;
  const mod: any = await nativeImport('@mistralai/mistralai');
  MistralCtor = mod.Mistral ?? mod.default?.Mistral ?? mod.default;
  if (!MistralCtor) throw new Error('Failed to resolve Mistral export');
  return MistralCtor;
}

async function getClient(): Promise<any> {
  const Mistral = await loadMistral();
  const key = process.env.MISTRAL_API_KEY || getSettings().mistralApiKey || DEFAULT_KEY;
  return new Mistral({ apiKey: key });
}

const MODELS = {
  fast: 'mistral-small-latest',
  smart: 'mistral-large-latest',
  tts: 'voxtral-mini-tts-2603',
} as const;

const DEFAULT_VOXTRAL_VOICE = 'c69964a6-ab8b-4f8a-9465-ec0925096ec8'; // Paul - Neutral (en_US)

let lastCallAt = 0;
let callsThisMinute = 0;
let minuteWindowStart = Date.now();

async function rateLimit(): Promise<void> {
  const now = Date.now();
  if (now - minuteWindowStart > 60_000) {
    minuteWindowStart = now;
    callsThisMinute = 0;
  }
  if (callsThisMinute >= 60) {
    throw new Error('AI отдыхает, попробуй через минуту');
  }
  const sinceLast = now - lastCallAt;
  if (sinceLast < 1000) {
    await new Promise((r) => setTimeout(r, 1000 - sinceLast));
  }
  lastCallAt = Date.now();
  callsThisMinute++;
}

function cacheKey(model: string, prompt: string): string {
  return createHash('sha256').update(model + '|' + prompt).digest('hex');
}

function readCache(key: string): string | null {
  const row = sqlite().prepare('SELECT * FROM mistral_cache WHERE cache_key = ?').get(key) as any;
  if (!row) return null;
  const now = Math.floor(Date.now() / 1000);
  if (row.expires_at < now) return null;
  return row.response;
}

function writeCache(key: string, prompt: string, response: string, model: string, ttlDays = 30): void {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlDays * 86400;
  sqlite()
    .prepare(
      `INSERT INTO mistral_cache (cache_key, prompt, response, model, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET response = excluded.response, expires_at = excluded.expires_at`,
    )
    .run(key, prompt, response, model, now, exp);
}

async function complete(model: string, messages: Array<{ role: string; content: string }>): Promise<string> {
  const promptHash = JSON.stringify(messages);
  const key = cacheKey(model, promptHash);
  const cached = readCache(key);
  if (cached) return cached;

  await rateLimit();
  const client = await getClient();
  const res = await client.chat.complete({
    model,
    messages: messages as any,
  });
  const choice = res.choices?.[0];
  const content = typeof choice?.message?.content === 'string' ? choice.message.content : '';
  writeCache(key, promptHash, content, model);
  return content;
}

export function registerMistralHandlers(): void {
  ipcMain.handle('mistral:chat', async (_e, payload: { messages: Array<{ role: string; content: string }>; model?: string }) => {
    try {
      const model = payload.model === 'fast' ? MODELS.fast : MODELS.smart;
      return await complete(model, payload.messages);
    } catch (err: any) {
      console.error('[mistral:chat]', err.message);
      throw err;
    }
  });

  ipcMain.handle('mistral:checkWriting', async (_e, payload: { text: string; topic: string; level: string }) => {
    const prompt = `Check this English text written by a ${payload.level} level Russian speaker.
Text: "${payload.text}"
Topic: "${payload.topic}"

Provide:
1. Corrected version
2. List of errors (max 5) with brief explanations in Russian
3. One suggestion for improvement
4. Score 0-100

Return ONLY valid JSON: { "corrected": "...", "errors": [{"original":"...", "correction":"...", "explanation":"..."}], "suggestion": "...", "score": 0 }`;
    const raw = await complete(MODELS.smart, [{ role: 'user', content: prompt }]);
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { corrected: raw, errors: [], suggestion: '', score: 50 };
    }
  });

  ipcMain.handle('mistral:explainWord', async (_e, payload: { word: string; sentence: string }) => {
    const prompt = `Объясни значение и использование английского слова "${payload.word}" в предложении: "${payload.sentence}". Дай:
- Перевод в этом контексте на русский
- Почему здесь используется именно это слово
- 1 похожий пример

На русском. Кратко, 2-3 предложения. Без длинных тире.`;
    return await complete(MODELS.fast, [{ role: 'user', content: prompt }]);
  });

  ipcMain.handle('mistral:validateCloze', async (_e, payload: { sentence: string; userWord: string }) => {
    const prompt = `Is the word "${payload.userWord}" a valid completion for this sentence: "${payload.sentence}"? Consider grammar and meaning.
Return ONLY valid JSON: { "valid": true/false, "suggestion": "...", "explanation": "Объяснение на русском" }`;
    const raw = await complete(MODELS.fast, [{ role: 'user', content: prompt }]);
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { valid: false, explanation: 'Не удалось разобрать ответ AI' };
    }
  });

  // Voxtral TTS via Mistral. Returns base64-encoded mp3.
  ipcMain.handle('mistral:tts', async (_e, payload: { text: string; voiceId?: string }) => {
    const trimmed = payload.text.slice(0, 1000);
    const chosenVoice = payload.voiceId ?? DEFAULT_VOXTRAL_VOICE;
    const key = cacheKey('voxtral|' + chosenVoice, trimmed);
    const cached = readCache(key);
    if (cached) return cached;

    await rateLimit();
    const client = await getClient();
    const req: any = {
      model: MODELS.tts,
      input: trimmed,
      voiceId: chosenVoice,
      responseFormat: 'mp3' as any,
    };

    const result: any = await client.audio.speech.complete(req);
    const audioData: string | undefined = result?.audioData ?? result?.audio_data;
    if (!audioData || typeof audioData !== 'string') {
      throw new Error('Voxtral: no audio in response');
    }
    writeCache(key, trimmed, audioData, 'voxtral', 30);
    return audioData;
  });

  ipcMain.handle('mistral:listVoices', async () => {
    try {
      const client = await getClient();
      const list: any = await client.audio.voices.list({});
      const items = list?.items ?? list?.data ?? list?.voices ?? [];
      return items
        .filter((v: any) => (v.languages || []).some((l: string) => l.toLowerCase().startsWith('en')))
        .map((v: any) => ({
          id: v.id,
          name: v.name ?? v.slug,
          slug: v.slug,
          gender: v.gender,
          tags: v.tags ?? [],
          languages: v.languages ?? [],
        }));
    } catch (err: any) {
      console.warn('[mistral:listVoices]', err.message);
      return [];
    }
  });
}
