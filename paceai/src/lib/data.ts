import { cache } from "react";
import type { Activity, AthleteProfile } from "@/lib/engine/types";
import { analyzeAll } from "@/lib/engine";
import { DEMO_PROFILE, generateDemoActivities } from "@/lib/demo/generate";

/**
 * Data access layer.
 *
 * Today it serves the deterministic demo athlete (plus any activities the
 * user uploads in-session). When DATABASE_URL is configured and the Prisma
 * schema is migrated, swap the internals for Prisma queries — the rest of
 * the app only ever talks to these functions.
 */

// In-memory store for uploads during a server session (replaced by Postgres
// via Prisma in production — see prisma/schema.prisma). Kept on globalThis
// because route handlers and pages are bundled separately and must share it.
const store = globalThis as unknown as { __paceaiUploads?: Activity[] };
const uploaded: Activity[] = (store.__paceaiUploads ??= []);

export function addUploadedActivity(activity: Activity) {
  uploaded.push(activity);
}

export const getProfile = cache(async (): Promise<AthleteProfile> => {
  return DEMO_PROFILE;
});

export const getActivities = cache(async (): Promise<Activity[]> => {
  const demo = generateDemoActivities();
  return [...demo, ...uploaded].sort((a, b) => a.date.localeCompare(b.date));
});

export const getAnalysis = cache(async () => {
  const [activities, profile] = await Promise.all([getActivities(), getProfile()]);
  return { activities, profile, analysis: analyzeAll(activities, profile) };
});

export async function getActivity(id: string): Promise<Activity | undefined> {
  const activities = await getActivities();
  return activities.find((a) => a.id === id);
}
