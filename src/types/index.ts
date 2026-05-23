export type CefrLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface User {
  id: number;
  name: string;
  nativeLanguage: string;
  targetLanguage: string;
  currentLevel: CefrLevel;
  dailyGoalMinutes: number;
  preferredLearningTime: string | null;
  motivations: string | null;
  createdAt: number;
  lastActiveAt: number;
  onboardingCompleted: boolean | number;
}

export interface UserStats {
  userId: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
  hearts: number;
  heartsRefillAt: number | null;
  gems: number;
  streakFreezes: number;
  weeklyXp: number;
}

export interface Word {
  id: number;
  english: string;
  russian: string;
  partOfSpeech: string | null;
  cefrLevel: CefrLevel;
  ipa: string | null;
  frequencyRank: number | null;
  topic: string | null;
  exampleEn: string | null;
  exampleRu: string | null;
  imageUrl: string | null;
  synonyms: string | null;
  antonyms: string | null;
  collocations: string | null;
  notes: string | null;
}

export interface Unit {
  id: number;
  orderIdx: number;
  title: string;
  description: string | null;
  cefrLevel: CefrLevel;
  iconName: string | null;
  color: string | null;
  totalLessons?: number;
  completedLessons?: number;
}

export interface Lesson {
  id: number;
  unitId: number;
  orderIdx: number;
  title: string;
  description: string | null;
  type: 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'review' | 'story';
  cefrLevel: CefrLevel;
  estimatedMinutes: number;
  xpReward: number;
  wordIds: string | null;
  exercises: string | null;
  words?: Word[];
  progress?: { status: 'locked' | 'available' | 'in_progress' | 'completed'; score: number } | null;
}

export interface GrammarTopic {
  id: number;
  orderIdx: number;
  cefrLevel: CefrLevel;
  title: string;
  titleRu: string;
  explanation: string;
  examplesJson: string | null;
}

export interface Story {
  id: number;
  title: string;
  cefrLevel: CefrLevel;
  contentEn: string;
  contentRu: string;
  wordCount: number;
  estimatedReadMinutes: number;
  topic: string | null;
  xpReward: number;
}

export interface DueCard {
  id: number;
  word_id: number;
  english: string;
  russian: string;
  ipa: string | null;
  example_en: string | null;
  example_ru: string | null;
  image_url: string | null;
  state: number;
}

export interface ExerciseResult {
  correct: boolean;
  timeMs: number;
  attemptsCount: number;
  userAnswer: string;
}

export type ExerciseType =
  | 'TranslationMC'
  | 'ReverseTranslationMC'
  | 'WordBank'
  | 'Typing'
  | 'ListeningType'
  | 'ListeningMC'
  | 'Speak'
  | 'Matching'
  | 'FillBlank'
  | 'ImageWord'
  | 'TransformSentence'
  | 'Dictation'
  | 'FlashcardSRS'
  | 'Cloze'
  | 'FreeWriting'
  | 'AIConversation';
