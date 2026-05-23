import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

interface SeedWord {
  english: string;
  russian: string;
  partOfSpeech?: string;
  cefrLevel: string;
  ipa?: string;
  frequencyRank?: number;
  topic?: string;
  exampleEn?: string;
  exampleRu?: string;
  imageUrl?: string;
}

interface SeedUnit {
  id?: number;
  order: number;
  title: string;
  description: string;
  cefrLevel: string;
  iconName: string;
  color: string;
}

interface SeedLesson {
  unitOrder: number;
  order: number;
  title: string;
  description: string;
  type: string;
  cefrLevel: string;
  estimatedMinutes: number;
  xpReward: number;
  wordEnglish?: string[];
  exerciseTypes?: string[];
}

interface SeedGrammar {
  order: number;
  cefrLevel: string;
  title: string;
  titleRu: string;
  explanation: string;
  examples: Array<{ en: string; ru: string }>;
}

interface SeedStory {
  title: string;
  cefrLevel: string;
  contentEn: string;
  contentRu: string;
  topic?: string;
}

interface SeedPhrase {
  english: string;
  russian: string;
  category: string;
  cefrLevel: string;
  context?: string;
}

interface SeedAchievement {
  key: string;
  title: string;
  description: string;
  iconName: string;
  xpReward: number;
  gemsReward: number;
  conditionType: string;
  conditionValue: number;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch (err) {
    console.error('[seed] failed to read', file, err);
    return fallback;
  }
}

export async function seedIfEmpty(
  _db: BetterSQLite3Database<typeof schema>,
  sqlite: Database.Database,
  resourcesDir: string,
): Promise<void> {
  const seedDir = path.join(resourcesDir, 'seed-data');

  // Words seed is idempotent: re-runs on every launch and just inserts new ones.
  {
    const allWords: SeedWord[] = [];
    for (const level of ['a1', 'a2', 'b1', 'b2', 'c1']) {
      const file = path.join(seedDir, `words_${level}.json`);
      const arr = readJson<SeedWord[]>(file, []);
      allWords.push(...arr);
    }
    if (allWords.length > 0) {
      const existing = new Set(
        (sqlite.prepare('SELECT english, cefr_level FROM words').all() as Array<{ english: string; cefr_level: string }>).map(
          (r) => `${r.english.toLowerCase()}|${r.cefr_level}`,
        ),
      );
      const newRows = allWords.filter((w) => !existing.has(`${w.english.toLowerCase()}|${w.cefrLevel}`));
      if (newRows.length > 0) {
        const ins = sqlite.prepare(
          `INSERT INTO words (english, russian, part_of_speech, cefr_level, ipa, frequency_rank, topic, example_en, example_ru, image_url)
           VALUES (@english, @russian, @partOfSpeech, @cefrLevel, @ipa, @frequencyRank, @topic, @exampleEn, @exampleRu, @imageUrl)`,
        );
        const tx = sqlite.transaction((rows: SeedWord[]) => {
          for (const w of rows) {
            ins.run({
              english: w.english,
              russian: w.russian,
              partOfSpeech: w.partOfSpeech ?? null,
              cefrLevel: w.cefrLevel,
              ipa: w.ipa ?? null,
              frequencyRank: w.frequencyRank ?? null,
              topic: w.topic ?? null,
              exampleEn: w.exampleEn ?? null,
              exampleRu: w.exampleRu ?? null,
              imageUrl: w.imageUrl ?? null,
            });
          }
        });
        tx(newRows);
        console.log(`[seed] inserted ${newRows.length} new words (total: ${allWords.length})`);
      }
    }
  }

  const unitCount = (sqlite.prepare('SELECT COUNT(*) AS c FROM units').get() as { c: number }).c;
  if (unitCount === 0) {
    const units = readJson<SeedUnit[]>(path.join(seedDir, 'units.json'), []);
    if (units.length > 0) {
      const ins = sqlite.prepare(
        `INSERT INTO units (order_idx, title, description, cefr_level, icon_name, color)
         VALUES (@order, @title, @description, @cefrLevel, @iconName, @color)`,
      );
      const tx = sqlite.transaction((rows: SeedUnit[]) => {
        for (const u of rows) ins.run(u as any);
      });
      tx(units);
      console.log(`[seed] inserted ${units.length} units`);
    }
  }

  const lessonCount = (sqlite.prepare('SELECT COUNT(*) AS c FROM lessons').get() as { c: number }).c;
  if (lessonCount === 0) {
    const lessons = readJson<SeedLesson[]>(path.join(seedDir, 'lessons.json'), []);
    if (lessons.length > 0) {
      const unitRows = sqlite.prepare('SELECT id, order_idx FROM units').all() as Array<{ id: number; order_idx: number }>;
      const unitByOrder = new Map(unitRows.map((u) => [u.order_idx, u.id]));
      const wordRows = sqlite.prepare('SELECT id, english FROM words').all() as Array<{ id: number; english: string }>;
      const wordByEn = new Map(wordRows.map((w) => [w.english.toLowerCase(), w.id]));

      const ins = sqlite.prepare(
        `INSERT INTO lessons (unit_id, order_idx, title, description, type, cefr_level, estimated_minutes, xp_reward, word_ids, exercises)
         VALUES (@unitId, @order, @title, @description, @type, @cefrLevel, @estimatedMinutes, @xpReward, @wordIds, @exercises)`,
      );
      const tx = sqlite.transaction((rows: SeedLesson[]) => {
        for (const l of rows) {
          const unitId = unitByOrder.get(l.unitOrder);
          if (!unitId) continue;
          const wordIds = (l.wordEnglish ?? [])
            .map((w) => wordByEn.get(w.toLowerCase()))
            .filter((x): x is number => typeof x === 'number');
          ins.run({
            unitId,
            order: l.order,
            title: l.title,
            description: l.description ?? null,
            type: l.type,
            cefrLevel: l.cefrLevel,
            estimatedMinutes: l.estimatedMinutes,
            xpReward: l.xpReward,
            wordIds: JSON.stringify(wordIds),
            exercises: JSON.stringify(l.exerciseTypes ?? []),
          });
        }
      });
      tx(lessons);
      console.log(`[seed] inserted ${lessons.length} lessons`);
    }
  }

  const grammarCount = (sqlite.prepare('SELECT COUNT(*) AS c FROM grammar_topics').get() as { c: number }).c;
  if (grammarCount === 0) {
    const topics = readJson<SeedGrammar[]>(path.join(seedDir, 'grammar_topics.json'), []);
    if (topics.length > 0) {
      const ins = sqlite.prepare(
        `INSERT INTO grammar_topics (order_idx, cefr_level, title, title_ru, explanation, examples_json)
         VALUES (@order, @cefrLevel, @title, @titleRu, @explanation, @examples)`,
      );
      const tx = sqlite.transaction((rows: SeedGrammar[]) => {
        for (const g of rows) {
          ins.run({
            order: g.order,
            cefrLevel: g.cefrLevel,
            title: g.title,
            titleRu: g.titleRu,
            explanation: g.explanation,
            examples: JSON.stringify(g.examples),
          });
        }
      });
      tx(topics);
      console.log(`[seed] inserted ${topics.length} grammar topics`);
    }
  }

  const storyCount = (sqlite.prepare('SELECT COUNT(*) AS c FROM stories').get() as { c: number }).c;
  if (storyCount === 0) {
    const stories = readJson<SeedStory[]>(path.join(seedDir, 'stories.json'), []);
    if (stories.length > 0) {
      const ins = sqlite.prepare(
        `INSERT INTO stories (title, cefr_level, content_en, content_ru, word_count, estimated_read_minutes, topic, xp_reward)
         VALUES (@title, @cefrLevel, @contentEn, @contentRu, @wordCount, @minutes, @topic, 15)`,
      );
      const tx = sqlite.transaction((rows: SeedStory[]) => {
        for (const s of rows) {
          const wc = s.contentEn.trim().split(/\s+/).length;
          ins.run({
            title: s.title,
            cefrLevel: s.cefrLevel,
            contentEn: s.contentEn,
            contentRu: s.contentRu,
            wordCount: wc,
            minutes: Math.max(1, Math.round(wc / 60)),
            topic: s.topic ?? null,
          });
        }
      });
      tx(stories);
      console.log(`[seed] inserted ${stories.length} stories`);
    }
  }

  const phraseCount = (sqlite.prepare('SELECT COUNT(*) AS c FROM phrases').get() as { c: number }).c;
  if (phraseCount === 0) {
    const phrases = readJson<SeedPhrase[]>(path.join(seedDir, 'phrases.json'), []);
    if (phrases.length > 0) {
      const ins = sqlite.prepare(
        `INSERT INTO phrases (english, russian, category, cefr_level, context) VALUES (@english, @russian, @category, @cefrLevel, @context)`,
      );
      const tx = sqlite.transaction((rows: SeedPhrase[]) => {
        for (const p of rows) ins.run({ ...p, context: p.context ?? null });
      });
      tx(phrases);
      console.log(`[seed] inserted ${phrases.length} phrases`);
    }
  }

  const achCount = (sqlite.prepare('SELECT COUNT(*) AS c FROM achievements').get() as { c: number }).c;
  if (achCount === 0) {
    const ach = readJson<SeedAchievement[]>(path.join(seedDir, 'achievements.json'), []);
    if (ach.length > 0) {
      const ins = sqlite.prepare(
        `INSERT INTO achievements (key, title, description, icon_name, xp_reward, gems_reward, condition_type, condition_value)
         VALUES (@key, @title, @description, @iconName, @xpReward, @gemsReward, @conditionType, @conditionValue)`,
      );
      const tx = sqlite.transaction((rows: SeedAchievement[]) => {
        for (const a of rows) ins.run(a as any);
      });
      tx(ach);
      console.log(`[seed] inserted ${ach.length} achievements`);
    }
  }
}
