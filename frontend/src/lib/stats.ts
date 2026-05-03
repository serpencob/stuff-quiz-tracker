import type { GroupQuizSession, QuizEntry } from "../types";

export type GroupChartPoint = { label: string; correct: number };

export function groupSessionsToChartSeries(sessions: GroupQuizSession[]): GroupChartPoint[] {
  const sorted = [...sessions].sort((a, b) => {
    const d = a.quiz_date.localeCompare(b.quiz_date);
    if (d !== 0) return d;
    return a.created_at.localeCompare(b.created_at);
  });
  const countsByDate = new Map<string, number>();
  const points: GroupChartPoint[] = [];
  for (const s of sorted) {
    const n = (countsByDate.get(s.quiz_date) ?? 0) + 1;
    countsByDate.set(s.quiz_date, n);
    const timeShort = new Date(s.created_at).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    });
    const label = n > 1 ? `${s.quiz_date} · ${timeShort}` : s.quiz_date;
    points.push({ label, correct: s.correct_count });
  }
  return points;
}

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
