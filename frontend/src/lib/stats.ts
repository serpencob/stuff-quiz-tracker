import type { QuizEntry } from "../types";

export type Totals = {
  correct: number;
  incorrect: number;
  attempts: number;
  accuracy: number;
};

export function computeTotals(entries: QuizEntry[]): Totals {
  const correct = entries.reduce((sum, entry) => sum + entry.correct_count, 0);
  const incorrect = entries.reduce((sum, entry) => sum + entry.incorrect_count, 0);
  const attempts = correct + incorrect;
  const accuracy = attempts === 0 ? 0 : (correct / attempts) * 100;
  return { correct, incorrect, attempts, accuracy };
}

export function toDailySeries(entries: QuizEntry[]) {
  const dailyMap = new Map<string, { date: string; correct: number; incorrect: number; accuracy: number }>();
  for (const entry of entries) {
    const current = dailyMap.get(entry.entry_date) ?? {
      date: entry.entry_date,
      correct: 0,
      incorrect: 0,
      accuracy: 0
    };
    current.correct += entry.correct_count;
    current.incorrect += entry.incorrect_count;
    const attempts = current.correct + current.incorrect;
    current.accuracy = attempts > 0 ? Number(((current.correct / attempts) * 100).toFixed(2)) : 0;
    dailyMap.set(entry.entry_date, current);
  }
  return [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function filterEntriesByRange(entries: QuizEntry[], days: number | "all") {
  if (days === "all") return entries;
  const boundary = new Date();
  boundary.setDate(boundary.getDate() - days);
  const boundaryDate = boundary.toISOString().slice(0, 10);
  return entries.filter((entry) => entry.entry_date >= boundaryDate);
}
