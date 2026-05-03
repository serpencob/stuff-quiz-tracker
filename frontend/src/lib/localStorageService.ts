import type {
  CreateEntryInput,
  DataService,
  GroupQuizSession,
  Person,
  QuizEntry,
  SubmitPersonEntriesInput
} from "../types";

const PEOPLE_KEY = "quiz-tracker-people";
const ENTRIES_KEY = "quiz-tracker-entries";
const GROUP_SESSIONS_KEY = "quiz-tracker-group-sessions";

function randomId() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function read<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const localStorageService: DataService = {
  async listPeople() {
    const people = read<Person>(PEOPLE_KEY);
    return people.sort((a, b) => a.name.localeCompare(b.name));
  },

  async createPerson(name: string) {
    const people = read<Person>(PEOPLE_KEY);
    const person: Person = { id: randomId(), name: name.trim(), created_at: nowIso() };
    people.push(person);
    write(PEOPLE_KEY, people);
    return person;
  },

  async listEntries(filter) {
    const entries = read<QuizEntry>(ENTRIES_KEY);
    return entries
      .filter((entry) => {
        if (filter?.personId && entry.person_id !== filter.personId) return false;
        if (filter?.from && entry.entry_date < filter.from) return false;
        if (filter?.to && entry.entry_date > filter.to) return false;
        return true;
      })
      .sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  },

  async createEntry(input: CreateEntryInput) {
    const entries = read<QuizEntry>(ENTRIES_KEY);
    const entry: QuizEntry = {
      id: randomId(),
      person_id: input.personId,
      entry_date: input.entryDate,
      correct_count: input.correctCount,
      incorrect_count: input.incorrectCount,
      note: input.note?.trim() ? input.note.trim() : null,
      created_at: nowIso()
    };
    entries.push(entry);
    write(ENTRIES_KEY, entries);
    return entry;
  },

  async listGroupQuizSessions(filter) {
    let sessions = read<GroupQuizSession>(GROUP_SESSIONS_KEY);
    if (filter?.from) sessions = sessions.filter((s) => s.quiz_date >= filter.from!);
    if (filter?.to) sessions = sessions.filter((s) => s.quiz_date <= filter.to!);
    return sessions.sort((a, b) => {
      const d = a.quiz_date.localeCompare(b.quiz_date);
      if (d !== 0) return d;
      return a.created_at.localeCompare(b.created_at);
    });
  },

  async appendGroupQuizSession(input: { correctCount: number; quizDate: string }) {
    const c = input.correctCount;
    if (!Number.isInteger(c) || c < 0 || c > 15) {
      throw new Error("Group quiz score must be an integer from 0 to 15.");
    }
    const sessions = read<GroupQuizSession>(GROUP_SESSIONS_KEY);
    const session: GroupQuizSession = {
      id: randomId(),
      correct_count: c,
      quiz_date: input.quizDate.trim(),
      created_at: nowIso()
    };
    sessions.push(session);
    write(GROUP_SESSIONS_KEY, sessions);
    return session;
  },

  async submitPersonEntries(input: SubmitPersonEntriesInput) {
    const rows = input.rows.filter((r) => r.correctCount > 0 || r.incorrectCount > 0);
    for (const r of rows) {
      if (!Number.isInteger(r.correctCount) || r.correctCount < 0) throw new Error("Invalid correct count.");
      if (!Number.isInteger(r.incorrectCount) || r.incorrectCount < 0) throw new Error("Invalid incorrect count.");
    }
    if (rows.length === 0) return;
    const entries = read<QuizEntry>(ENTRIES_KEY);
    for (const r of rows) {
      entries.push({
        id: randomId(),
        person_id: r.personId,
        entry_date: input.entryDate,
        correct_count: r.correctCount,
        incorrect_count: r.incorrectCount,
        note: null,
        created_at: nowIso()
      });
    }
    write(ENTRIES_KEY, entries);
  }
};
