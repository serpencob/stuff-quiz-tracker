import type { GroupQuizSession, QuizEntry } from "../types";

export type GroupChartPoint = { label: string; correct: number };

function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(parseLocalDate(date));
}

function formatShortTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date(iso));
}

function formatChartLabel(date: string, createdAt: string, includeTime: boolean) {
  const shortDate = formatShortDate(date);
  return includeTime ? `${shortDate} ${formatShortTime(createdAt)}` : shortDate;
}

export function groupSessionsToChartSeries(sessions: GroupQuizSession[]): GroupChartPoint[] {
  const sorted = [...sessions].sort((a, b) => {
    const d = a.quiz_date.localeCompare(b.quiz_date);
    if (d !== 0) return d;
    return a.created_at.localeCompare(b.created_at);
  });
  const countsByDate = sorted.reduce((counts, session) => {
    counts.set(session.quiz_date, (counts.get(session.quiz_date) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return sorted.map((session) => ({
    label: formatChartLabel(session.quiz_date, session.created_at, (countsByDate.get(session.quiz_date) ?? 0) > 1),
    correct: session.correct_count
  }));
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

export type SessionChartPoint = {
  sessionId: string;
  label: string;
  date: string;
  correct: number;
  incorrect: number;
  accuracy: number;
};

export function toSessionSeries(entries: QuizEntry[]): SessionChartPoint[] {
  const sessionMap = new Map<
    string,
    { sessionId: string; entryDate: string; createdAt: string; correct: number; incorrect: number; accuracy: number }
  >();
  for (const entry of entries) {
    const sessionId = entry.session_id || entry.id;
    const current = sessionMap.get(sessionId) ?? {
      sessionId,
      entryDate: entry.entry_date,
      createdAt: entry.created_at,
      correct: 0,
      incorrect: 0,
      accuracy: 0
    };
    if (
      entry.entry_date.localeCompare(current.entryDate) < 0 ||
      (entry.entry_date === current.entryDate && entry.created_at.localeCompare(current.createdAt) < 0)
    ) {
      current.entryDate = entry.entry_date;
      current.createdAt = entry.created_at;
    }
    current.correct += entry.correct_count;
    current.incorrect += entry.incorrect_count;
    const attempts = current.correct + current.incorrect;
    current.accuracy = attempts > 0 ? Number(((current.correct / attempts) * 100).toFixed(2)) : 0;
    sessionMap.set(sessionId, current);
  }

  const sessions = [...sessionMap.values()].sort((a, b) => {
    const d = a.entryDate.localeCompare(b.entryDate);
    if (d !== 0) return d;
    return a.createdAt.localeCompare(b.createdAt);
  });
  const countsByDate = sessions.reduce((counts, session) => {
    counts.set(session.entryDate, (counts.get(session.entryDate) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return sessions.map((session) => ({
    sessionId: session.sessionId,
    label: formatChartLabel(session.entryDate, session.createdAt, (countsByDate.get(session.entryDate) ?? 0) > 1),
    date: session.entryDate,
    correct: session.correct,
    incorrect: session.incorrect,
    accuracy: session.accuracy
  }));
}

export function filterEntriesByRange(entries: QuizEntry[], days: number | "all") {
  if (days === "all") return entries;
  const boundary = new Date();
  boundary.setDate(boundary.getDate() - days);
  const boundaryDate = boundary.toISOString().slice(0, 10);
  return entries.filter((entry) => entry.entry_date >= boundaryDate);
}
