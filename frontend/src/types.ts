export type Person = {
  id: string;
  name: string;
  created_at: string;
};

export type QuizEntry = {
  id: string;
  person_id: string;
  entry_date: string;
  correct_count: number;
  incorrect_count: number;
  note: string | null;
  created_at: string;
};

export type CreateEntryInput = {
  personId: string;
  entryDate: string;
  correctCount: number;
  incorrectCount: number;
  note?: string;
};

export type DataService = {
  listPeople: () => Promise<Person[]>;
  createPerson: (name: string) => Promise<Person>;
  listEntries: (filter?: { personId?: string; from?: string; to?: string }) => Promise<QuizEntry[]>;
  createEntry: (input: CreateEntryInput) => Promise<QuizEntry>;
};
