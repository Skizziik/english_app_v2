// Generate lessons from words_a1.json and words_a2.json, grouping by topic.
import fs from 'node:fs';
import path from 'node:path';

const wordsA1 = JSON.parse(fs.readFileSync('resources/seed-data/words_a1.json', 'utf-8'));
const wordsA2 = JSON.parse(fs.readFileSync('resources/seed-data/words_a2.json', 'utf-8'));
const units = JSON.parse(fs.readFileSync('resources/seed-data/units.json', 'utf-8'));
const lessonsFile = 'resources/seed-data/lessons.json';
const existingLessons = JSON.parse(fs.readFileSync(lessonsFile, 'utf-8'));

// Map topic -> unit (1-7 in units.json).
const TOPIC_TO_UNIT = {
  basics: 1, greetings: 1, people: 1,
  family: 2, home: 2, objects: 2, animals: 2, body: 2, clothes: 2,
  food: 3,
  numbers: 4, time: 4, weather: 4, nature: 4, colors: 4,
  verbs: 5, adjectives: 5, emotions: 5, feelings: 5, hobbies: 5, phrasal_verbs: 5,
  places: 6, transport: 6, shopping: 6, travel: 6,
  work: 7, jobs: 7, education: 7, technology: 7, health: 7,
};

const EXERCISE_PATTERNS = [
  ['TranslationMC', 'ReverseTranslationMC', 'Matching', 'ImageWord', 'ListeningMC', 'Typing'],
  ['ReverseTranslationMC', 'TranslationMC', 'ListeningType', 'WordBank', 'Matching'],
  ['Matching', 'ListeningMC', 'TranslationMC', 'Typing', 'FillBlank'],
];

const CHUNK = 6;

const unitOrderCursor = {};
for (const l of existingLessons) {
  unitOrderCursor[l.unitOrder] = Math.max(unitOrderCursor[l.unitOrder] ?? 0, l.order);
}
const coveredEnglish = new Set();
for (const l of existingLessons) {
  for (const e of (l.wordEnglish ?? [])) coveredEnglish.add(e.toLowerCase());
}

const newLessons = [...existingLessons];
let addedCount = 0;

function processLevel(words, levelLabel) {
  const byTopic = {};
  for (const w of words) {
    (byTopic[w.topic || 'misc'] ??= []).push(w);
  }
  for (const [topic, topicWords] of Object.entries(byTopic)) {
    const unitOrder = TOPIC_TO_UNIT[topic];
    if (!unitOrder) continue;
    const uncovered = topicWords.filter((w) => !coveredEnglish.has(w.english.toLowerCase()));
    for (let i = 0; i < uncovered.length; i += CHUNK) {
      const slice = uncovered.slice(i, i + CHUNK);
      if (slice.length < 3) break;
      unitOrderCursor[unitOrder] = (unitOrderCursor[unitOrder] ?? 0) + 1;
      const order = unitOrderCursor[unitOrder];
      const pattern = EXERCISE_PATTERNS[(order + i) % EXERCISE_PATTERNS.length];
      newLessons.push({
        unitOrder,
        order,
        title: `${cap(topic)} ${order}`,
        description: `Слова темы: ${topic} (${levelLabel})`,
        type: 'vocabulary',
        cefrLevel: levelLabel,
        estimatedMinutes: 4,
        xpReward: levelLabel === 'A2' ? 14 : 12,
        wordEnglish: slice.map((w) => w.english),
        exerciseTypes: pattern,
      });
      for (const w of slice) coveredEnglish.add(w.english.toLowerCase());
      addedCount++;
    }
  }
}

processLevel(wordsA1, 'A1');
processLevel(wordsA2, 'A2');

fs.writeFileSync(lessonsFile, JSON.stringify(newLessons, null, 2), 'utf-8');
console.log(`Added ${addedCount} lessons. Total: ${newLessons.length}`);

function cap(s) { return s[0].toUpperCase() + s.slice(1); }
