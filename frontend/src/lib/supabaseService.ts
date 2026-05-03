import type { CreateEntryInput, DataService, GroupQuizSession, Person, QuizEntry, SubmitPersonEntriesInput } from "../types";
import { supabase } from "./supabase";

function requireClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

export const supabaseService: DataService = {
  async listPeople() {
    const client = requireClient();
    const { data, error } = await client.from("people").select("*").order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data as Person[];
  },

  async createPerson(name: string) {
    const client = requireClient();
    const { data, error } = await client.from("people").insert({ name: name.trim() }).select("*").single();
    if (error) throw new Error(error.message);
    return data as Person;
  },

  async listEntries(filter) {
    const client = requireClient();
    let query = client.from("quiz_entries").select("*").order("entry_date", { ascending: false });
    if (filter?.personId) query = query.eq("person_id", filter.personId);
    if (filter?.from) query = query.gte("entry_date", filter.from);
    if (filter?.to) query = query.lte("entry_date", filter.to);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as QuizEntry[];
  },

  async createEntry(input: CreateEntryInput) {
    const client = requireClient();
    const row = {
      person_id: input.personId,
      entry_date: input.entryDate,
      correct_count: input.correctCount,
      incorrect_count: input.incorrectCount,
      note: input.note?.trim() ? input.note.trim() : null
    };
    const { data, error } = await client.from("quiz_entries").insert(row).select("*").single();
    if (error) throw new Error(error.message);
    return data as QuizEntry;
  },

  async listGroupQuizSessions(filter) {
    const client = requireClient();
    let query = client.from("group_quiz_sessions").select("*");
    if (filter?.from) query = query.gte("quiz_date", filter.from);
    if (filter?.to) query = query.lte("quiz_date", filter.to);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as GroupQuizSession[];
    return rows.sort((a, b) => {
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
    const client = requireClient();
    const { data, error } = await client
      .from("group_quiz_sessions")
      .insert({ correct_count: c, quiz_date: input.quizDate.trim() })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as GroupQuizSession;
  },

  async submitPersonEntries(input: SubmitPersonEntriesInput) {
    const client = requireClient();
    const rows = input.rows.filter((r) => r.correctCount > 0 || r.incorrectCount > 0);
    for (const r of rows) {
      if (!Number.isInteger(r.correctCount) || r.correctCount < 0) throw new Error("Invalid correct count.");
      if (!Number.isInteger(r.incorrectCount) || r.incorrectCount < 0) throw new Error("Invalid incorrect count.");
    }
    if (rows.length === 0) return;
    const payload = rows.map((r) => ({
      person_id: r.personId,
      entry_date: input.entryDate,
      correct_count: r.correctCount,
      incorrect_count: r.incorrectCount,
      note: null as string | null
    }));
    const { error } = await client.from("quiz_entries").insert(payload);
    if (error) throw new Error(error.message);
  }
};
