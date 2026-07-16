import { cache } from "react";
import { redirect } from "next/navigation";
import type { Activity, AthleteProfile, Split, WorkoutType } from "@/lib/engine/types";
import { analyzeAll } from "@/lib/engine";
import { createClient } from "@/lib/supabase/server";
import type { ActivityRow, GoalRow, ProfileRow } from "@/lib/supabase/types";

/**
 * Data access layer, backed by Supabase (PostgreSQL + RLS).
 * Every query runs as the authenticated user, so Row Level Security
 * guarantees nobody can ever read another user's data.
 */

function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    sport: (row.sport as Activity["sport"]) ?? "running",
    type: row.type as WorkoutType,
    distanceKm: Number(row.distance_km),
    durationSec: row.duration_sec,
    avgPaceSecKm: Number(row.avg_pace_sec_km),
    avgHr: row.avg_hr ?? undefined,
    maxHr: row.max_hr ?? undefined,
    elevationGainM: row.elevation_gain_m ?? undefined,
    cadenceSpm: row.cadence_spm ?? undefined,
    strideLenM: row.stride_len_m != null ? Number(row.stride_len_m) : undefined,
    powerW: row.power_w ?? undefined,
    calories: row.calories ?? undefined,
    splits: (row.splits ?? []) as Split[],
    source: row.source as Activity["source"],
  };
}

/** Authenticated user or redirect to /login (belt-and-braces with the proxy). */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
});

export const getProfile = cache(async (): Promise<AthleteProfile & { id: string }> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, name, max_hr, rest_hr, weight_kg")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  return {
    id: user.id,
    name: data?.name ?? user.email?.split("@")[0] ?? "Atleta",
    maxHr: data?.max_hr ?? 190,
    restHr: data?.rest_hr ?? 55,
    weightKg: data?.weight_kg != null ? Number(data.weight_kg) : undefined,
  };
});

export const getActivities = cache(async (): Promise<Activity[]> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true })
    .limit(2000);
  if (error) throw new Error(`No se pudieron cargar las actividades: ${error.message}`);
  return (data as ActivityRow[]).map(rowToActivity);
});

export const getAnalysis = cache(async () => {
  const [activities, profile] = await Promise.all([getActivities(), getProfile()]);
  return { activities, profile, analysis: analyzeAll(activities, profile) };
});

export async function getActivity(id: string): Promise<Activity | undefined> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle<ActivityRow>();
  return data ? rowToActivity(data) : undefined;
}

/** Persist an imported activity for the current user. */
export async function insertActivity(activity: Activity): Promise<{ id: string }> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: user.id,
      date: activity.date,
      name: activity.name,
      sport: activity.sport,
      type: activity.type,
      distance_km: activity.distanceKm,
      duration_sec: activity.durationSec,
      avg_pace_sec_km: Math.round(activity.avgPaceSecKm * 100) / 100,
      avg_hr: activity.avgHr ?? null,
      max_hr: activity.maxHr ?? null,
      elevation_gain_m: activity.elevationGainM ?? null,
      cadence_spm: activity.cadenceSpm ?? null,
      stride_len_m: activity.strideLenM ?? null,
      power_w: activity.powerW ?? null,
      calories: activity.calories ?? null,
      splits: activity.splits,
      source: activity.source,
      external_id: activity.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Este entrenamiento ya estaba importado.");
    }
    throw new Error(`No se pudo guardar la actividad: ${error.message}`);
  }
  return data;
}

/** Latest goal defined by the user, if any. */
export const getCurrentGoal = cache(async (): Promise<GoalRow | null> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<GoalRow>();
  return data ?? null;
});
