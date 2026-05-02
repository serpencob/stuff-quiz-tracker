import { localStorageService } from "./localStorageService";
import { supabaseService } from "./supabaseService";
import type { DataService } from "../types";

export type DataMode = "supabase" | "local";

const rawMode = import.meta.env.VITE_DATA_MODE ?? "supabase";
const dataMode: DataMode = rawMode === "local" ? "local" : "supabase";

export const dataService: DataService =
  dataMode === "local" ? localStorageService : supabaseService;

export function getDataMode(): DataMode {
  return dataMode;
}
