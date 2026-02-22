import { createClient } from "@/lib/supabase/client";
import type { ActivityEvent } from "@/lib/activityLog";

/** Write an activity event to Supabase. Falls back silently if user is not authenticated. */
export async function logActivityDB(
  userId: string,
  type: ActivityEvent["type"],
  message: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("activity_log").insert({
    user_id: userId,
    type,
    message,
  });
  if (error) console.error("[activityLog] DB write failed:", error.message);
}

/** Fetch activity log for a user, newest first. `hours` limits how far back to look. */
export async function getActivityLog(
  userId: string,
  hours = 24,
): Promise<ActivityEvent[]> {
  const supabase = createClient();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return (
    data as {
      id: string;
      type: ActivityEvent["type"];
      message: string;
      created_at: string;
    }[]
  ).map((row) => ({
    id: row.id,
    type: row.type,
    message: row.message,
    timestamp: new Date(row.created_at).getTime(),
  }));
}
