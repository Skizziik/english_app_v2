// Generate lessons from the words_a1.json file, grouping by topic.
import fs from 'node:fs';
import path from 'node:path';

const wordsFile = path.resolve('resources/seed-data/words_a1.json');
const unitsFile = path.resolve('resources/seed-data/units.json');
const lessonsFile = path.resolve('resources/seed-data/lessons.json');

const words = JSON.parse(fs.readFileSync(wordsFile, 'utf-8'));
const units = JSON.parse(fs.readFileSync(unitsFile, 'utf-8'));
const existingLessons = JSON.parse(fs.readFileSync(lessonsFile, 'utf-8'));

// Group A1 words by topic
const byTopic = {};
for (const w of words) {
  const t = w.topic || 'misc';
  (byTopic[t] = byTopic[t] ?? []).push(w);
}

// Map our existing topics to units (unitOrder is 1-based in units.json)
const TOPIC_TO_UNIT = {
  basics: 1,
  greetings: 1,
  people: 1,
  family: 2,
  home: 2,
  objects: 2,
  animals: 2,
  body: 2,
  clothes: 2,
  food: 3,
  numbers: 4,
  time: 4,
  weather: 4,
  nature: 4,
  colors: 4,
  verbs: 5,
  adjectives: 5,
  emotions: 5,
  hobbies: 5,
  places: 6,
  transport: 6,
  shopping: 6,
  work: 7,
  jobs: 7,
  education: 7,
  technology: 7,
};

const EXERCISE_PATTERNS = [
  ['TranslationMC', 'ReverseTranslationMC', 'Matching', 'ImageWord', 'ListeningMC', 'Typing'],
  ['ReverseTranslationMC', 'TranslationMC', 'ListeningType', 'WordBank', 'Matching'],
  ['Matching', 'ListeningMC', 'TranslationMC', 'Typing', 'FillBlank'],
];

const CHUNK = 6;
const newLessons = [...existingLessons];
let lessonsAdded = 0;

// Map topic-> what order index to use within that unit
const unitOrderCursor = {};
for (const l of existingLessons) {
  const key = l.unitOrder;
  unitOrderCursor[key] = Math.max(unitOrderCursor[key] ?? 0, l.order);
}

// Track which words are already covered by existing lessons
const coveredEnglish = new Set();
for (const l of existingLessons) {
  for (const e of (l.wordEnglish ?? [])) coveredEnglish.add(e.toLowerCase());
}

for (const [topic, topicWords] of Object.entries(byTopic)) {
  const unitOrder = TOPIC_TO_UNIT[topic];
  if (!unitOrder) continue;
  const uncovered = topicWords.filter((w) => !coveredEnglish.has(w.english.toLowerCase()));
  if (uncovered.length === 0) continue;

  // chunk
  for (let i = 0; i < uncovered.length; i += CHUNK) {
    const slice = uncovered.slice(i, i + CHUNK);
    if (slice.length < 3) break;
    unitOrderCursor[unitOrder] = (unitOrderCursor[unitOrder] ?? 0) + 1;
    const order = unitOrderCursor[unitOrder];
    const exercisePattern = EXERCISE_PATTERNS[(order + i) % EXERCISE_PATTERNS.length];
    const lesson = {
      unitOrder,
      order,
      title: `${capitalize(topic)} ${order}`,
      description: `Слова темы: ${topic}`,
      type: 'vocabulary',
      cefrLevel: 'A1',
      estimatedMinutes: 4,
      xpReward: 12,
      wordEnglish: slice.map((w) => w.english),
      exerciseTypes: exercisePattern,
    };
    newLessons.push(lesson);
    for (const w of slice) coveredEnglish.add(w.english.toLowerCase());
    lessonsAdded++;
  }
}

fs.writeFileSync(lessonsFile, JSON.stringify(newLessons, null, 2), 'utf-8');
console.log(`Added ${lessonsAdded} lessons. Total: ${newLessons.length}`);

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
