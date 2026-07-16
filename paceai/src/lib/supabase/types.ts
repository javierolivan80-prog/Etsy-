import type { Split } from "@/lib/engine/types";

/** Row shapes of the Supabase schema (see supabase/schema.sql). */

export interface ProfileRow {
  id: string;
  name: string | null;
  max_hr: number;
  rest_hr: number;
  weight_kg: number | null;
}

export interface ActivityRow {
  id: string;
  user_id: string;
  date: string;
  name: string;
  sport: string;
  type: string;
  distance_km: number;
  duration_sec: number;
  avg_pace_sec_km: number;
  avg_hr: number | null;
  max_hr: number | null;
  elevation_gain_m: number | null;
  cadence_spm: number | null;
  stride_len_m: number | null;
  power_w: number | null;
  calories: number | null;
  splits: Split[];
  source: string;
  external_id: string | null;
  created_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  distance_km: number;
  target_seconds: number;
  created_at: string;
}

export interface ChatMessageRow {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
