import { sqliteTable, integer, text, real, primaryKey, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().default(''),
  nativeLanguage: text('native_language').notNull().default('ru'),
  targetLanguage: text('target_language').notNull().default('en'),
  currentLevel: text('current_level').notNull().default('A0'),
  dailyGoalMinutes: integer('daily_goal_minutes').notNull().default(10),
  preferredLearningTime: text('preferred_learning_time'),
  motivations: text('motivations'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }).notNull(),
  onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' }).notNull().default(false),
});

export const userStats = sqliteTable('user_stats', {
  userId: integer('user_id').primaryKey().references(() => users.id),
  totalXp: integer('total_xp').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastStreakDate: text('last_streak_date'),
  hearts: integer('hearts').notNull().default(5),
  heartsRefillAt: integer('hearts_refill_at', { mode: 'timestamp' }),
  gems: integer('gems').notNull().default(0),
  streakFreezes: integer('streak_freezes').notNull().default(0),
  weeklyXp: integer('weekly_xp').notNull().default(0),
});

export const words = sqliteTable(
  'words',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    english: text('english').notNull(),
    russian: text('russian').notNull(),
    partOfSpeech: text('part_of_speech'),
    cefrLevel: text('cefr_level').notNull(),
    ipa: text('ipa'),
    frequencyRank: integer('frequency_rank'),
    topic: text('topic'),
    exampleEn: text('example_en'),
    exampleRu: text('example_ru'),
    imageUrl: text('image_url'),
    synonyms: text('synonyms'),
    antonyms: text('antonyms'),
    collocations: text('collocations'),
    notes: text('notes'),
  },
  (t) => ({
    englishIdx: index('words_english_idx').on(t.english),
    levelIdx: index('words_level_idx').on(t.cefrLevel),
    topicIdx: index('words_topic_idx').on(t.topic),
    freqIdx: index('words_freq_idx').on(t.frequencyRank),
  }),
);

export const userWords = sqliteTable(
  'user_words',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    wordId: integer('word_id').notNull().references(() => words.id),
    stability: real('stability').notNull().default(0),
    difficulty: real('difficulty').notNull().default(0),
    elapsedDays: integer('elapsed_days').notNull().default(0),
    scheduledDays: integer('scheduled_days').notNull().default(0),
    reps: integer('reps').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    state: integer('state').notNull().default(0),
    lastReview: integer('last_review', { mode: 'timestamp' }),
    dueDate: integer('due_date', { mode: 'timestamp' }),
    recognitionScore: integer('recognition_score').notNull().default(0),
    productionScore: integer('production_score').notNull().default(0),
    listeningScore: integer('listening_score').notNull().default(0),
    spellingScore: integer('spelling_score').notNull().default(0),
    isLearned: integer('is_learned', { mode: 'boolean' }).notNull().default(false),
    firstSeenAt: integer('first_seen_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    dueIdx: index('user_words_due_idx').on(t.userId, t.dueDate),
    userWordIdx: index('user_words_uw_idx').on(t.userId, t.wordId),
  }),
);

export const units = sqliteTable('units', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  order: integer('order_idx').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  cefrLevel: text('cefr_level').notNull(),
  iconName: text('icon_name'),
  color: text('color'),
});

export const lessons = sqliteTable('lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  unitId: integer('unit_id').notNull().references(() => units.id),
  order: integer('order_idx').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  cefrLevel: text('cefr_level').notNull(),
  estimatedMinutes: integer('estimated_minutes').notNull().default(5),
  xpReward: integer('xp_reward').notNull().default(10),
  wordIds: text('word_ids'),
  grammarTopicIds: text('grammar_topic_ids'),
  exercises: text('exercises'),
  prerequisites: text('prerequisites'),
});

export const userLessonProgress = sqliteTable(
  'user_lesson_progress',
  {
    userId: integer('user_id').notNull().references(() => users.id),
    lessonId: integer('lesson_id').notNull().references(() => lessons.id),
    status: text('status').notNull().default('available'),
    score: integer('score').notNull().default(0),
    mistakesCount: integer('mistakes_count').notNull().default(0),
    timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    attemptsCount: integer('attempts_count').notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.lessonId] }),
  }),
);

export const grammarTopics = sqliteTable('grammar_topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  order: integer('order_idx').notNull(),
  cefrLevel: text('cefr_level').notNull(),
  title: text('title').notNull(),
  titleRu: text('title_ru').notNull(),
  explanation: text('explanation').notNull(),
  examplesJson: text('examples_json'),
  rules: text('rules'),
  commonMistakes: text('common_mistakes'),
  relatedTopics: text('related_topics'),
});

export const phrases = sqliteTable('phrases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  english: text('english').notNull(),
  russian: text('russian').notNull(),
  category: text('category').notNull(),
  cefrLevel: text('cefr_level').notNull(),
  context: text('context'),
});

export const stories = sqliteTable('stories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  cefrLevel: text('cefr_level').notNull(),
  contentEn: text('content_en').notNull(),
  contentRu: text('content_ru').notNull(),
  wordCount: integer('word_count').notNull().default(0),
  estimatedReadMinutes: integer('estimated_read_minutes').notNull().default(2),
  topic: text('topic'),
  xpReward: integer('xp_reward').notNull().default(15),
});

export const userStoryProgress = sqliteTable(
  'user_story_progress',
  {
    userId: integer('user_id').notNull().references(() => users.id),
    storyId: integer('story_id').notNull().references(() => stories.id),
    isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
    readAt: integer('read_at', { mode: 'timestamp' }),
    clickedWords: text('clicked_words'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.storyId] }),
  }),
);

export const achievements = sqliteTable('achievements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  iconName: text('icon_name'),
  xpReward: integer('xp_reward').notNull().default(0),
  gemsReward: integer('gems_reward').notNull().default(0),
  conditionType: text('condition_type').notNull(),
  conditionValue: integer('condition_value').notNull().default(1),
});

export const userAchievements = sqliteTable(
  'user_achievements',
  {
    userId: integer('user_id').notNull().references(() => users.id),
    achievementId: integer('achievement_id').notNull().references(() => achievements.id),
    unlockedAt: integer('unlocked_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.achievementId] }),
  }),
);

export const studySessions = sqliteTable('study_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  xpEarned: integer('xp_earned').notNull().default(0),
  wordsReviewed: integer('words_reviewed').notNull().default(0),
  exercisesCompleted: integer('exercises_completed').notNull().default(0),
  correctAnswers: integer('correct_answers').notNull().default(0),
  totalAnswers: integer('total_answers').notNull().default(0),
  activityType: text('activity_type').notNull(),
});

export const mistralCache = sqliteTable('mistral_cache', {
  cacheKey: text('cache_key').primaryKey(),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  model: text('model').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});
