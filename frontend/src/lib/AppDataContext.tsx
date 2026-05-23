import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { dataService } from "./dataService";
import type { GroupQuizSession, Person, QuizEntry } from "../types";

export type ScoreStrings = { correct: string; incorrect: string };

export type QuizFormDraft = {
  groupCorrect: string;
  personScores: Record<string, ScoreStrings>;
};

type SubmitQuizSessionInput = {
  groupCorrectCount: number;
  individualRows: { personId: string; correctCount: number; incorrectCount: number }[];
};

type AppDataContextValue = {
  people: Person[];
  entries: QuizEntry[];
  groupSessions: GroupQuizSession[];
  isLoading: boolean;
  error: string;
  clearError: () => void;
  refresh: () => Promise<void>;
  addPerson: (name: string) => Promise<Person>;
  submitQuizSession: (input: SubmitQuizSessionInput) => Promise<void>;
  quizFormDraft: QuizFormDraft;
  setQuizFormDraft: Dispatch<SetStateAction<QuizFormDraft>>;
  resetQuizFormDraft: () => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function emptyDraft(): QuizFormDraft {
  return { groupCorrect: "", personScores: {} };
}

function todayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sortPeople(people: Person[]) {
  return [...people].sort((a, b) => a.name.localeCompare(b.name));
}

function sortEntries(entries: QuizEntry[]) {
  return [...entries].sort((a, b) => {
    const d = b.entry_date.localeCompare(a.entry_date);
    if (d !== 0) return d;
    return b.created_at.localeCompare(a.created_at);
  });
}

function sortGroupSessions(sessions: GroupQuizSession[]) {
  return [...sessions].sort((a, b) => {
    const d = a.quiz_date.localeCompare(b.quiz_date);
    if (d !== 0) return d;
    return a.created_at.localeCompare(b.created_at);
  });
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [entries, setEntries] = useState<QuizEntry[]>([]);
  const [groupSessions, setGroupSessions] = useState<GroupQuizSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizFormDraft, setQuizFormDraft] = useState<QuizFormDraft>(() => emptyDraft());

  const loadData = useCallback(async (showLoading: boolean) => {
    try {
      if (showLoading) setIsLoading(true);
      setError("");
      const [loadedPeople, loadedEntries, loadedGroupSessions] = await Promise.all([
        dataService.listPeople(),
        dataService.listEntries(),
        dataService.listGroupQuizSessions()
      ]);
      setPeople(sortPeople(loadedPeople));
      setEntries(sortEntries(loadedEntries));
      setGroupSessions(sortGroupSessions(loadedGroupSessions));
    } catch (loadError) {
      setError(`Failed to load data: ${String(loadError)}`);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  useEffect(() => {
    setQuizFormDraft((prev) => {
      const nextScores: Record<string, ScoreStrings> = {};
      for (const person of people) {
        nextScores[person.id] = prev.personScores[person.id] ?? { correct: "", incorrect: "" };
      }
      return { ...prev, personScores: nextScores };
    });
  }, [people]);

  const refresh = useCallback(async () => {
    await loadData(false);
  }, [loadData]);

  const clearError = useCallback(() => setError(""), []);

  const addPerson = useCallback(async (name: string) => {
    const person = await dataService.createPerson(name);
    setPeople((current) => sortPeople([...current, person]));
    return person;
  }, []);

  const resetQuizFormDraft = useCallback(() => {
    setQuizFormDraft((prev) => {
      const personScores: Record<string, ScoreStrings> = {};
      for (const personId of Object.keys(prev.personScores)) {
        personScores[personId] = { correct: "", incorrect: "" };
      }
      return { groupCorrect: "", personScores };
    });
  }, []);

  const submitQuizSession = useCallback(
    async (input: SubmitQuizSessionInput) => {
      const quizDate = todayLocalDate();
      try {
        const groupSession = await dataService.appendGroupQuizSession({
          correctCount: input.groupCorrectCount,
          quizDate
        });
        const createdEntries = await dataService.submitPersonEntries({
          entryDate: quizDate,
          rows: input.individualRows
        });
        setGroupSessions((current) => sortGroupSessions([...current, groupSession]));
        if (createdEntries.length > 0) {
          setEntries((current) => sortEntries([...createdEntries, ...current]));
        }
        resetQuizFormDraft();
      } catch (submitError) {
        await refresh();
        throw submitError;
      }
    },
    [refresh, resetQuizFormDraft]
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      people,
      entries,
      groupSessions,
      isLoading,
      error,
      clearError,
      refresh,
      addPerson,
      submitQuizSession,
      quizFormDraft,
      setQuizFormDraft,
      resetQuizFormDraft
    }),
    [
      people,
      entries,
      groupSessions,
      isLoading,
      error,
      clearError,
      refresh,
      addPerson,
      submitQuizSession,
      quizFormDraft,
      resetQuizFormDraft
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider.");
  }
  return context;
}
