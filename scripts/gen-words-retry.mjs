// Retry the topics that hit rate limit earlier.
import { Mistral } from '@mistralai/mistralai';
import fs from 'node:fs';
import path from 'node:path';

const key = process.env.MISTRAL_API_KEY || 'omuPDQIstHg8D0ZLilaqQPO1jpGJTze4';
const m = new Mistral({ apiKey: key });

const RETRY = [
  { topic: 'food', russian: 'еда и напитки', target: 35 },
  { topic: 'animals', russian: 'животные', target: 25 },
  { topic: 'transport', russian: 'транспорт', target: 15 },
  { topic: 'places', russian: 'места в городе', target: 25 },
];

async function genTopic(topic, russianTopic, count) {
  const prompt = `Generate ${count} most common ENGLISH A1-level vocabulary words on topic "${topic}" (${russianTopic}).
For each word return: english, russian translation (1-3 short words), part of speech, IPA pronunciation, simple example sentence in English (max 7 words) and its Russian translation.
Use only beginner-friendly words. Avoid duplicates. No long dashes in any text (use comma or colon instead).
Return STRICT JSON array, no preamble, no markdown fences. Format:
[
  {"english":"word","russian":"перевод","partOfSpeech":"noun","ipa":"/wɜːrd/","exampleEn":"This is a word.","exampleRu":"Это слово."}
]`;
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
    cefrLevel: 'A1',
    ipa: w.ipa ?? null,
    topic,
    exampleEn: w.exampleEn ?? null,
    exampleRu: w.exampleRu ?? null,
  })).filter((w) => w.english && w.russian);
}

const file = path.resolve('resources/seed-data/words_a1.json');
const existing = JSON.parse(fs.readFileSync(file, 'utf-8'));
const existingSet = new Set(existing.map((w) => w.english.toLowerCase()));
console.log('Existing:', existing.length);

let nextRank = Math.max(...existing.map((w) => w.frequencyRank ?? 0)) + 1;
const all = [...existing];

for (const t of RETRY) {
  console.log(`-> ${t.topic}`);
  try {
    const words = await genTopic(t.topic, t.russian, t.target);
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
console.log('Done', all.length);
