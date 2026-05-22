import { ipcMain } from 'electron';
import { createHash } from 'node:crypto';
import { Mistral } from '@mistralai/mistralai';
import { sqlite } from '../db';
import { getSettings } from '../lib/settings';

const DEFAULT_KEY = 'omuPDQIstHg8D0ZLilaqQPO1jpGJTze4';

function getClient(): Mistral {
  const key = process.env.MISTRAL_API_KEY || getSettings().mistralApiKey || DEFAULT_KEY;
  return new Mistral({ apiKey: key });
}

const MODELS = {
  fast: 'mistral-small-latest',
  smart: 'mistral-large-latest',
} as const;

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
  const client = getClient();
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
}
