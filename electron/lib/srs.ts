import { createEmptyCard, FSRS, Rating, generatorParameters, Card, State } from 'ts-fsrs';
import { getSettings } from './settings';

export type RatingValue = 1 | 2 | 3 | 4;

export function fsrsInstance(): FSRS {
  const settings = getSettings();
  const params = generatorParameters({
    enable_fuzz: true,
    request_retention: settings.fsrsRetention ?? 0.9,
  });
  return new FSRS(params);
}

export function schedulingFromState(row: any): Card {
  const card = createEmptyCard();
  card.stability = row.stability ?? 0;
  card.difficulty = row.difficulty ?? 0;
  card.elapsed_days = row.elapsed_days ?? 0;
  card.scheduled_days = row.scheduled_days ?? 0;
  card.reps = row.reps ?? 0;
  card.lapses = row.lapses ?? 0;
  card.state = (row.state ?? 0) as State;
  card.last_review = row.last_review ? new Date(row.last_review * 1000) : undefined;
  card.due = row.due_date ? new Date(row.due_date * 1000) : new Date();
  return card;
}

export function reviewCard(card: Card, rating: RatingValue) {
  const f = fsrsInstance();
  const scheduling = f.repeat(card, new Date());
  const mapped: Record<RatingValue, Rating> = {
    1: Rating.Again,
    2: Rating.Hard,
    3: Rating.Good,
    4: Rating.Easy,
  };
  const r = mapped[rating];
  return scheduling[r];
}
