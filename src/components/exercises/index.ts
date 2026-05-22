export { TranslationMC } from './TranslationMC';
export { ReverseTranslationMC } from './ReverseTranslationMC';
export { Typing } from './Typing';
export { WordBank } from './WordBank';
export { Matching } from './Matching';
export { ListeningType } from './ListeningType';
export { ListeningMC } from './ListeningMC';
export { ImageWord } from './ImageWord';
export { FillBlank } from './FillBlank';
export { Speak } from './Speak';

import { TranslationMC } from './TranslationMC';
import { ReverseTranslationMC } from './ReverseTranslationMC';
import { Typing } from './Typing';
import { WordBank } from './WordBank';
import { Matching } from './Matching';
import { ListeningType } from './ListeningType';
import { ListeningMC } from './ListeningMC';
import { ImageWord } from './ImageWord';
import { FillBlank } from './FillBlank';
import { Speak } from './Speak';
import type { ExerciseKind } from './types';
import type { ComponentType } from 'react';
import type { ExerciseProps } from './types';

export const EXERCISES: Record<ExerciseKind, ComponentType<ExerciseProps>> = {
  TranslationMC,
  ReverseTranslationMC,
  Typing,
  WordBank,
  Matching,
  ListeningType,
  ListeningMC,
  ImageWord,
  FillBlank,
  Speak,
  TransformSentence: Typing,
  Dictation: ListeningType,
  FlashcardSRS: TranslationMC,
  Cloze: FillBlank,
};
