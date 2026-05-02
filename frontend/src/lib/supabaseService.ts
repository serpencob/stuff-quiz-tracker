import type { CreateEntryInput, DataService, Person, QuizEntry } from "../types";
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
  }
};
