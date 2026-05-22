import type { Word } from '@/types';

export interface ExerciseProps {
  word: Word;
  pool: Word[];
  onResult: (correct: boolean, userAnswer?: string) => void;
  onContinue: () => void;
}

export type ExerciseKind =
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
  | 'Cloze';

export interface ExerciseStepBase {
  kind: ExerciseKind;
  word: Word;
  pool: Word[];
}
