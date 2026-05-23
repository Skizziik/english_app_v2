// Generates a large A1 wordlist via Mistral and merges into words_a1.json.
import { Mistral } from '@mistralai/mistralai';
import fs from 'node:fs';
import path from 'node:path';

const key = process.env.MISTRAL_API_KEY || 'omuPDQIstHg8D0ZLilaqQPO1jpGJTze4';
const m = new Mistral({ apiKey: key });

const TOPICS_A1 = [
  { topic: 'family', russian: 'семья', target: 30 },
  { topic: 'food', russian: 'еда и напитки', target: 40 },
  { topic: 'home', russian: 'дом и комнаты', target: 30 },
  { topic: 'body', russian: 'части тела', target: 25 },
  { topic: 'clothes', russian: 'одежда', target: 20 },
  { topic: 'colors', russian: 'цвета', target: 12 },
  { topic: 'numbers', russian: 'числа 11-100', target: 15 },
  { topic: 'time', russian: 'время, месяцы', target: 20 },
  { topic: 'weather', russian: 'погода и природа', target: 20 },
  { topic: 'animals', russian: 'животные', target: 25 },
  { topic: 'transport', russian: 'транспорт', target: 15 },
  { topic: 'places', russian: 'места в городе', target: 25 },
  { topic: 'verbs', russian: 'базовые глаголы', target: 40 },
  { topic: 'adjectives', russian: 'описательные прилагательные', target: 30 },
  { topic: 'jobs', russian: 'профессии', target: 15 },
  { topic: 'hobbies', russian: 'хобби и спорт', target: 20 },
  { topic: 'objects', russian: 'обычные предметы', target: 25 },
  { topic: 'emotions', russian: 'эмоции', target: 15 },
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
  try {
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
  } catch (err) {
    console.error(`[${topic}] parse failed:`, err.message);
    console.error('raw:', raw.slice(0, 200));
    return [];
  }
}

const file = path.resolve('resources/seed-data/words_a1.json');
const existing = JSON.parse(fs.readFileSync(file, 'utf-8'));
const existingSet = new Set(existing.map((w) => w.english.toLowerCase()));
console.log('Existing A1 words:', existing.length);

let nextRank = Math.max(...existing.map((w) => w.frequencyRank ?? 0)) + 1;
const all = [...existing];

for (const t of TOPICS_A1) {
  console.log(`-> Generating ${t.target} words for ${t.topic}...`);
  try {
    const words = await genTopic(t.topic, t.russian, t.target);
    let added = 0;
    for (const w of words) {
      const key = w.english.toLowerCase();
      if (existingSet.has(key)) continue;
      existingSet.add(key);
      w.frequencyRank = nextRank++;
      all.push(w);
      added++;
    }
    console.log(`   got ${words.length}, added ${added} unique (total now ${all.length})`);
    // Save after each topic so we don't lose progress.
    fs.writeFileSync(file, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err) {
    console.error(`   [${t.topic}] error:`, err.message);
  }
  await new Promise((r) => setTimeout(r, 1500));
}

console.log(`Done. Total A1 words: ${all.length}`);
