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

export type GroupQuizSession = {
  id: string;
  correct_count: number;
  quiz_date: string;
  created_at: string;
};

export type CreateEntryInput = {
  personId: string;
  entryDate: string;
  correctCount: number;
  incorrectCount: number;
  note?: string;
};

export type SubmitPersonEntriesInput = {
  entryDate: string;
  rows: { personId: string; correctCount: number; incorrectCount: number }[];
};

export type DataService = {
  listPeople: () => Promise<Person[]>;
  createPerson: (name: string) => Promise<Person>;
  listEntries: (filter?: { personId?: string; from?: string; to?: string }) => Promise<QuizEntry[]>;
  createEntry: (input: CreateEntryInput) => Promise<QuizEntry>;
  listGroupQuizSessions: (filter?: { from?: string; to?: string }) => Promise<GroupQuizSession[]>;
  appendGroupQuizSession: (input: { correctCount: number; quizDate: string }) => Promise<GroupQuizSession>;
  submitPersonEntries: (input: SubmitPersonEntriesInput) => Promise<void>;
};
