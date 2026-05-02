import type { CreateEntryInput, DataService, Person, QuizEntry } from "../types";

const PEOPLE_KEY = "quiz-tracker-people";
const ENTRIES_KEY = "quiz-tracker-entries";

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
      note: input.note?.trim() || null,
      created_at: nowIso()
    };
    entries.push(entry);
    write(ENTRIES_KEY, entries);
    return entry;
  }
};
