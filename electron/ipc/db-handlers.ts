import { ipcMain } from 'electron';
import { and, eq, gt, isNull, like, lt, or, sql, desc, asc } from 'drizzle-orm';
import { db, sqlite } from '../db';
import * as schema from '../db/schema';
import { reviewCard, RatingValue, schedulingFromState } from '../lib/srs';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentUser() {
  const rows = sqlite().prepare('SELECT * FROM users LIMIT 1').all() as any[];
  return rows[0] ?? null;
}

function ensureStats(userId: number) {
  const row = sqlite().prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);
  if (!row) {
    sqlite().prepare('INSERT INTO user_stats (user_id) VALUES (?)').run(userId);
    return sqlite().prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);
  }
  return row;
}

export function registerDbHandlers(): void {
  // ===== user =====
  ipcMain.handle('user:current', () => getCurrentUser());

  ipcMain.handle('user:create', (_e, payload: any) => {
    const now = Math.floor(Date.now() / 1000);
    const info = sqlite()
      .prepare(
        `INSERT INTO users (name, native_language, target_language, current_level, daily_goal_minutes, preferred_learning_time, motivations, created_at, last_active_at, onboarding_completed)
         VALUES (@name, @nativeLanguage, @targetLanguage, @currentLevel, @dailyGoalMinutes, @preferredLearningTime, @motivations, @createdAt, @lastActiveAt, 0)`,
      )
      .run({
        name: payload.name ?? '',
        nativeLanguage: payload.nativeLanguage ?? 'ru',
        targetLanguage: payload.targetLanguage ?? 'en',
        currentLevel: payload.currentLevel ?? 'A0',
        dailyGoalMinutes: payload.dailyGoalMinutes ?? 10,
        preferredLearningTime: payload.preferredLearningTime ?? null,
        motivations: payload.motivations ? JSON.stringify(payload.motivations) : null,
        createdAt: now,
        lastActiveAt: now,
      });
    ensureStats(Number(info.lastInsertRowid));
    return sqlite().prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  });

  ipcMain.handle('user:update', (_e, patch: any) => {
    const user = getCurrentUser();
    if (!user) return null;
    const fields: string[] = [];
    const values: any = { id: user.id };
    if (patch.name !== undefined) {
      fields.push('name = @name');
      values.name = patch.name;
    }
    if (patch.currentLevel !== undefined) {
      fields.push('current_level = @currentLevel');
      values.currentLevel = patch.currentLevel;
    }
    if (patch.dailyGoalMinutes !== undefined) {
      fields.push('daily_goal_minutes = @dailyGoalMinutes');
      values.dailyGoalMinutes = patch.dailyGoalMinutes;
    }
    if (patch.preferredLearningTime !== undefined) {
      fields.push('preferred_learning_time = @preferredLearningTime');
      values.preferredLearningTime = patch.preferredLearningTime;
    }
    if (patch.motivations !== undefined) {
      fields.push('motivations = @motivations');
      values.motivations = JSON.stringify(patch.motivations);
    }
    if (fields.length === 0) return user;
    sqlite().prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = @id`).run(values);
    return sqlite().prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  });

  ipcMain.handle('user:completeOnboarding', (_e) => {
    const user = getCurrentUser();
    if (!user) return null;
    sqlite().prepare('UPDATE users SET onboarding_completed = 1 WHERE id = ?').run(user.id);
    return sqlite().prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  });

  // ===== stats =====
  ipcMain.handle('stats:get', () => {
    const user = getCurrentUser();
    if (!user) return null;
    return ensureStats(user.id);
  });

  ipcMain.handle('stats:addXp', (_e, amount: number) => {
    const user = getCurrentUser();
    if (!user) return null;
    ensureStats(user.id);
    sqlite()
      .prepare('UPDATE user_stats SET total_xp = total_xp + ?, weekly_xp = weekly_xp + ? WHERE user_id = ?')
      .run(amount, amount, user.id);
    return sqlite().prepare('SELECT * FROM user_stats WHERE user_id = ?').get(user.id);
  });

  ipcMain.handle('stats:loseHeart', () => {
    const user = getCurrentUser();
    if (!user) return null;
    ensureStats(user.id);
    const stats = sqlite().prepare('SELECT hearts FROM user_stats WHERE user_id = ?').get(user.id) as any;
    const newHearts = Math.max(0, (stats?.hearts ?? 5) - 1);
    const refillAt = newHearts < 5 ? Math.floor(Date.now() / 1000) + 30 * 60 : null;
    sqlite()
      .prepare('UPDATE user_stats SET hearts = ?, hearts_refill_at = ? WHERE user_id = ?')
      .run(newHearts, refillAt, user.id);
    return sqlite().prepare('SELECT * FROM user_stats WHERE user_id = ?').get(user.id);
  });

  ipcMain.handle('stats:refillHearts', () => {
    const user = getCurrentUser();
    if (!user) return null;
    sqlite()
      .prepare('UPDATE user_stats SET hearts = 5, hearts_refill_at = NULL WHERE user_id = ?')
      .run(user.id);
    return sqlite().prepare('SELECT * FROM user_stats WHERE user_id = ?').get(user.id);
  });

  ipcMain.handle('stats:bumpStreak', () => {
    const user = getCurrentUser();
    if (!user) return null;
    ensureStats(user.id);
    const stats = sqlite().prepare('SELECT * FROM user_stats WHERE user_id = ?').get(user.id) as any;
    const today = todayIso();
    const last = stats.last_streak_date as string | null;
    if (last === today) return stats;
    let newStreak = 1;
    if (last) {
      const lastD = new Date(last + 'T00:00:00Z').getTime();
      const todayD = new Date(today + 'T00:00:00Z').getTime();
      const diffDays = Math.round((todayD - lastD) / 86400000);
      if (diffDays === 1) newStreak = (stats.current_streak ?? 0) + 1;
      else if (diffDays === 0) newStreak = stats.current_streak ?? 0;
      else newStreak = 1;
    }
    const longest = Math.max(stats.longest_streak ?? 0, newStreak);
    sqlite()
      .prepare('UPDATE user_stats SET current_streak = ?, longest_streak = ?, last_streak_date = ? WHERE user_id = ?')
      .run(newStreak, longest, today, user.id);
    return sqlite().prepare('SELECT * FROM user_stats WHERE user_id = ?').get(user.id);
  });

  // ===== words =====
  ipcMain.handle('words:list', (_e, filter: any = {}) => {
    let sqlStr = 'SELECT * FROM words WHERE 1=1';
    const params: any = {};
    if (filter.cefrLevel) {
      sqlStr += ' AND cefr_level = @cefrLevel';
      params.cefrLevel = filter.cefrLevel;
    }
    if (filter.topic) {
      sqlStr += ' AND topic = @topic';
      params.topic = filter.topic;
    }
    sqlStr += ' ORDER BY frequency_rank ASC, id ASC';
    if (filter.limit) {
      sqlStr += ` LIMIT ${Number(filter.limit)}`;
    }
    return sqlite().prepare(sqlStr).all(params);
  });

  ipcMain.handle('words:get', (_e, id: number) => {
    return sqlite().prepare('SELECT * FROM words WHERE id = ?').get(id);
  });

  ipcMain.handle('words:search', (_e, q: string) => {
    const term = `%${q.toLowerCase()}%`;
    return sqlite()
      .prepare(
        `SELECT * FROM words WHERE LOWER(english) LIKE ? OR LOWER(russian) LIKE ? ORDER BY frequency_rank ASC LIMIT 50`,
      )
      .all(term, term);
  });

  // ===== lessons =====
  ipcMain.handle('lessons:listUnits', () => {
    const user = getCurrentUser();
    const units = sqlite().prepare('SELECT * FROM units ORDER BY order_idx ASC').all();
    if (!user) return units;
    return units.map((u: any) => {
      const total = (sqlite().prepare('SELECT COUNT(*) AS c FROM lessons WHERE unit_id = ?').get(u.id) as any).c;
      const done = (
        sqlite()
          .prepare(
            `SELECT COUNT(*) AS c FROM user_lesson_progress p JOIN lessons l ON l.id = p.lesson_id WHERE l.unit_id = ? AND p.user_id = ? AND p.status = 'completed'`,
          )
          .get(u.id, user.id) as any
      ).c;
      return { ...u, totalLessons: total, completedLessons: done };
    });
  });

  ipcMain.handle('lessons:listForUnit', (_e, unitId: number) => {
    const user = getCurrentUser();
    const rows = sqlite()
      .prepare('SELECT * FROM lessons WHERE unit_id = ? ORDER BY order_idx ASC')
      .all(unitId);
    if (!user) return rows;
    return rows.map((l: any) => {
      const p = sqlite()
        .prepare('SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?')
        .get(user.id, l.id);
      return { ...l, progress: p ?? null };
    });
  });

  ipcMain.handle('lessons:get', (_e, id: number) => {
    const l = sqlite().prepare('SELECT * FROM lessons WHERE id = ?').get(id) as any;
    if (!l) return null;
    const wordIds: number[] = JSON.parse(l.word_ids || '[]');
    const words = wordIds.length
      ? sqlite()
          .prepare(`SELECT * FROM words WHERE id IN (${wordIds.map(() => '?').join(',')})`)
          .all(...wordIds)
      : [];
    return { ...l, words };
  });

  ipcMain.handle('lessons:complete', (_e, payload: { lessonId: number; score: number; mistakes: number; timeSpent: number; xp: number }) => {
    const user = getCurrentUser();
    if (!user) return null;
    const existing = sqlite()
      .prepare('SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?')
      .get(user.id, payload.lessonId) as any;
    const now = Math.floor(Date.now() / 1000);
    if (existing) {
      sqlite()
        .prepare(
          `UPDATE user_lesson_progress SET status = 'completed', score = ?, mistakes_count = ?, time_spent_seconds = time_spent_seconds + ?, completed_at = ?, attempts_count = attempts_count + 1 WHERE user_id = ? AND lesson_id = ?`,
        )
        .run(payload.score, payload.mistakes, payload.timeSpent, now, user.id, payload.lessonId);
    } else {
      sqlite()
        .prepare(
          `INSERT INTO user_lesson_progress (user_id, lesson_id, status, score, mistakes_count, time_spent_seconds, completed_at, attempts_count) VALUES (?, ?, 'completed', ?, ?, ?, ?, 1)`,
        )
        .run(user.id, payload.lessonId, payload.score, payload.mistakes, payload.timeSpent, now);
    }
    return sqlite()
      .prepare('SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?')
      .get(user.id, payload.lessonId);
  });

  // ===== grammar =====
  ipcMain.handle('grammar:list', () => sqlite().prepare('SELECT * FROM grammar_topics ORDER BY order_idx ASC').all());
  ipcMain.handle('grammar:get', (_e, id: number) => sqlite().prepare('SELECT * FROM grammar_topics WHERE id = ?').get(id));

  // ===== stories =====
  ipcMain.handle('stories:list', () => sqlite().prepare('SELECT * FROM stories ORDER BY cefr_level ASC, id ASC').all());
  ipcMain.handle('stories:get', (_e, id: number) => sqlite().prepare('SELECT * FROM stories WHERE id = ?').get(id));
  ipcMain.handle('stories:markRead', (_e, id: number) => {
    const user = getCurrentUser();
    if (!user) return null;
    const now = Math.floor(Date.now() / 1000);
    sqlite()
      .prepare(
        `INSERT INTO user_story_progress (user_id, story_id, is_read, read_at) VALUES (?, ?, 1, ?)
         ON CONFLICT(user_id, story_id) DO UPDATE SET is_read = 1, read_at = excluded.read_at`,
      )
      .run(user.id, id, now);
    return true;
  });

  // ===== achievements =====
  ipcMain.handle('achievements:list', () => sqlite().prepare('SELECT * FROM achievements ORDER BY id ASC').all());
  ipcMain.handle('achievements:unlocked', () => {
    const user = getCurrentUser();
    if (!user) return [];
    return sqlite()
      .prepare(
        `SELECT a.*, ua.unlocked_at FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id WHERE ua.user_id = ?`,
      )
      .all(user.id);
  });

  // ===== sessions =====
  ipcMain.handle('sessions:start', (_e, activityType: string) => {
    const user = getCurrentUser();
    if (!user) return -1;
    const now = Math.floor(Date.now() / 1000);
    const info = sqlite()
      .prepare('INSERT INTO study_sessions (user_id, started_at, activity_type) VALUES (?, ?, ?)')
      .run(user.id, now, activityType);
    return Number(info.lastInsertRowid);
  });

  ipcMain.handle('sessions:end', (_e, payload: { id: number; xpEarned: number; wordsReviewed: number; exercisesCompleted: number; correctAnswers: number; totalAnswers: number }) => {
    const now = Math.floor(Date.now() / 1000);
    sqlite()
      .prepare(
        `UPDATE study_sessions SET ended_at = ?, xp_earned = ?, words_reviewed = ?, exercises_completed = ?, correct_answers = ?, total_answers = ? WHERE id = ?`,
      )
      .run(now, payload.xpEarned, payload.wordsReviewed, payload.exercisesCompleted, payload.correctAnswers, payload.totalAnswers, payload.id);
    return true;
  });

  ipcMain.handle('sessions:history', (_e, days: number) => {
    const user = getCurrentUser();
    if (!user) return [];
    const since = Math.floor(Date.now() / 1000) - days * 86400;
    return sqlite()
      .prepare('SELECT * FROM study_sessions WHERE user_id = ? AND started_at >= ? ORDER BY started_at DESC')
      .all(user.id, since);
  });

  // ===== SRS =====
  ipcMain.handle('srs:enqueueWords', (_e, wordIds: number[]) => {
    const user = getCurrentUser();
    if (!user) return 0;
    const now = Math.floor(Date.now() / 1000);
    const ins = sqlite().prepare(
      `INSERT INTO user_words (user_id, word_id, state, first_seen_at, due_date) VALUES (?, ?, 0, ?, ?)`,
    );
    const exists = sqlite().prepare('SELECT id FROM user_words WHERE user_id = ? AND word_id = ?');
    const tx = sqlite().transaction((ids: number[]) => {
      let added = 0;
      for (const id of ids) {
        if (!exists.get(user.id, id)) {
          ins.run(user.id, id, now, now);
          added++;
        }
      }
      return added;
    });
    return tx(wordIds);
  });

  ipcMain.handle('srs:dueQueue', (_e, limit: number = 30) => {
    const user = getCurrentUser();
    if (!user) return [];
    const now = Math.floor(Date.now() / 1000);
    return sqlite()
      .prepare(
        `SELECT uw.*, w.english, w.russian, w.ipa, w.example_en, w.example_ru, w.image_url, w.part_of_speech, w.cefr_level
         FROM user_words uw JOIN words w ON w.id = uw.word_id
         WHERE uw.user_id = ? AND (uw.due_date IS NULL OR uw.due_date <= ?)
         ORDER BY uw.due_date ASC NULLS FIRST LIMIT ?`,
      )
      .all(user.id, now, limit);
  });

  ipcMain.handle('srs:review', (_e, payload: { userWordId: number; rating: RatingValue }) => {
    const row = sqlite().prepare('SELECT * FROM user_words WHERE id = ?').get(payload.userWordId) as any;
    if (!row) return null;
    const card = schedulingFromState(row);
    const result = reviewCard(card, payload.rating);
    const now = Math.floor(Date.now() / 1000);
    const due = Math.floor(result.card.due.getTime() / 1000);
    sqlite()
      .prepare(
        `UPDATE user_words SET stability = ?, difficulty = ?, elapsed_days = ?, scheduled_days = ?, reps = ?, lapses = ?, state = ?, last_review = ?, due_date = ? WHERE id = ?`,
      )
      .run(
        result.card.stability,
        result.card.difficulty,
        result.card.elapsed_days,
        result.card.scheduled_days,
        result.card.reps,
        result.card.lapses,
        result.card.state,
        now,
        due,
        payload.userWordId,
      );
    return result;
  });
}
