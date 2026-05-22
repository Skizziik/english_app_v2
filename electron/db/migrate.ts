import Database from 'better-sqlite3';

const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  native_language TEXT NOT NULL DEFAULT 'ru',
  target_language TEXT NOT NULL DEFAULT 'en',
  current_level TEXT NOT NULL DEFAULT 'A0',
  daily_goal_minutes INTEGER NOT NULL DEFAULT 10,
  preferred_learning_time TEXT,
  motivations TEXT,
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  onboarding_completed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_streak_date TEXT,
  hearts INTEGER NOT NULL DEFAULT 5,
  hearts_refill_at INTEGER,
  gems INTEGER NOT NULL DEFAULT 0,
  streak_freezes INTEGER NOT NULL DEFAULT 0,
  weekly_xp INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT NOT NULL,
  russian TEXT NOT NULL,
  part_of_speech TEXT,
  cefr_level TEXT NOT NULL,
  ipa TEXT,
  frequency_rank INTEGER,
  topic TEXT,
  example_en TEXT,
  example_ru TEXT,
  image_url TEXT,
  synonyms TEXT,
  antonyms TEXT,
  collocations TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS words_english_idx ON words(english);
CREATE INDEX IF NOT EXISTS words_level_idx ON words(cefr_level);
CREATE INDEX IF NOT EXISTS words_topic_idx ON words(topic);
CREATE INDEX IF NOT EXISTS words_freq_idx ON words(frequency_rank);

CREATE TABLE IF NOT EXISTS user_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  word_id INTEGER NOT NULL REFERENCES words(id),
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  state INTEGER NOT NULL DEFAULT 0,
  last_review INTEGER,
  due_date INTEGER,
  recognition_score INTEGER NOT NULL DEFAULT 0,
  production_score INTEGER NOT NULL DEFAULT 0,
  listening_score INTEGER NOT NULL DEFAULT 0,
  spelling_score INTEGER NOT NULL DEFAULT 0,
  is_learned INTEGER NOT NULL DEFAULT 0,
  first_seen_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS user_words_due_idx ON user_words(user_id, due_date);
CREATE INDEX IF NOT EXISTS user_words_uw_idx ON user_words(user_id, word_id);

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_idx INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cefr_level TEXT NOT NULL,
  icon_name TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER NOT NULL REFERENCES units(id),
  order_idx INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  cefr_level TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL DEFAULT 5,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  word_ids TEXT,
  grammar_topic_ids TEXT,
  exercises TEXT,
  prerequisites TEXT
);

CREATE TABLE IF NOT EXISTS user_lesson_progress (
  user_id INTEGER NOT NULL REFERENCES users(id),
  lesson_id INTEGER NOT NULL REFERENCES lessons(id),
  status TEXT NOT NULL DEFAULT 'available',
  score INTEGER NOT NULL DEFAULT 0,
  mistakes_count INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS grammar_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_idx INTEGER NOT NULL,
  cefr_level TEXT NOT NULL,
  title TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  explanation TEXT NOT NULL,
  examples_json TEXT,
  rules TEXT,
  common_mistakes TEXT,
  related_topics TEXT
);

CREATE TABLE IF NOT EXISTS phrases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT NOT NULL,
  russian TEXT NOT NULL,
  category TEXT NOT NULL,
  cefr_level TEXT NOT NULL,
  context TEXT
);

CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  cefr_level TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_ru TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  estimated_read_minutes INTEGER NOT NULL DEFAULT 2,
  topic TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 15
);

CREATE TABLE IF NOT EXISTS user_story_progress (
  user_id INTEGER NOT NULL REFERENCES users(id),
  story_id INTEGER NOT NULL REFERENCES stories(id),
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at INTEGER,
  clicked_words TEXT,
  PRIMARY KEY (user_id, story_id)
);

CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  gems_reward INTEGER NOT NULL DEFAULT 0,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id INTEGER NOT NULL REFERENCES users(id),
  achievement_id INTEGER NOT NULL REFERENCES achievements(id),
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  words_reviewed INTEGER NOT NULL DEFAULT 0,
  exercises_completed INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_answers INTEGER NOT NULL DEFAULT 0,
  activity_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mistral_cache (
  cache_key TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
`;

export function runMigrations(db: Database.Database): void {
  db.exec(TABLES_SQL);
}
