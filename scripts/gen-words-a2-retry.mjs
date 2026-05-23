import { Mistral } from '@mistralai/mistralai';
import fs from 'node:fs';
import path from 'node:path';

const key = process.env.MISTRAL_API_KEY || 'omuPDQIstHg8D0ZLilaqQPO1jpGJTze4';
const m = new Mistral({ apiKey: key });

const RETRY = [
  { topic: 'work', ru: 'работа и офис', target: 30 },
  { topic: 'verbs', ru: 'глаголы A2', target: 35 },
];

async function genTopic(topic, ru, count) {
  const prompt = `Generate ${count} ENGLISH A2-level vocabulary words on topic "${topic}" (${ru}).
For each word return: english, russian translation (1-3 short words), part of speech, IPA pronunciation, simple example sentence in English (max 8 words) and its Russian translation.
Avoid A1-level words. Avoid duplicates. No long dashes (use comma or colon instead).
Return STRICT JSON array, no preamble, no markdown fences.`;
  const res = await m.chat.complete({
    model: 'mistral-large-latest',
    messages: [{ role: 'user', content: prompt }],
    responseFormat: { type: 'json_object' },
  });
  let raw = res.choices[0].message.content;
  if (typeof raw !== 'string') raw = JSON.stringify(raw);
  raw = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(raw);
  const arr = Array.isArray(parsed) ? parsed : parsed.words ?? parsed.data ?? Object.values(parsed)[0];
  if (!Array.isArray(arr)) throw new Error('no array');
  return arr.map((w) => ({
    english: w.english?.trim() ?? '',
    russian: w.russian?.trim() ?? '',
    partOfSpeech: w.partOfSpeech ?? null,
    cefrLevel: 'A2',
    ipa: w.ipa ?? null,
    topic,
    exampleEn: w.exampleEn ?? null,
    exampleRu: w.exampleRu ?? null,
  })).filter((w) => w.english && w.russian);
}

const file = path.resolve('resources/seed-data/words_a2.json');
const existing = JSON.parse(fs.readFileSync(file, 'utf-8'));
const existingSet = new Set(existing.map((w) => w.english.toLowerCase()));
let nextRank = Math.max(...existing.map((w) => w.frequencyRank ?? 0)) + 1;
const all = [...existing];

for (const t of RETRY) {
  console.log(`-> ${t.topic}`);
  try {
    const words = await genTopic(t.topic, t.ru, t.target);
    let added = 0;
    for (const w of words) {
      const k = w.english.toLowerCase();
      if (existingSet.has(k)) continue;
      existingSet.add(k);
      w.frequencyRank = nextRank++;
      all.push(w);
      added++;
    }
    console.log(`   +${added} (total ${all.length})`);
    fs.writeFileSync(file, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err) {
    console.error(`   ${t.topic}:`, err.message);
  }
  await new Promise((r) => setTimeout(r, 3000));
}
console.log('Done A2:', all.length);
