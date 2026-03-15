import { createClient } from "@/lib/supabase/client";

export type ShieldState = {
  id: string;
  count: number;            // 0–3
  consecutive_days: number;
  last_evaluated_at: string | null;
};

/**
 * Fetch the user's shield row, or create one with defaults (3 shields, 0 streak).
 * Uses upsert to avoid duplicate key errors from concurrent calls (React Strict Mode, etc.)
 */
export async function getOrCreateShields(userId: string): Promise<ShieldState> {
  const supabase = createClient();

  // Upsert: insert defaults if the row doesn't exist, do nothing if it does.
  // Then always fetch the authoritative row.
  await supabase
    .from("shields")
    .upsert(
      { user_id: userId, count: 3, consecutive_days: 0, last_evaluated_at: null },
      { onConflict: "user_id", ignoreDuplicates: true },
    );

  const { data, error } = await supabase
    .from("shields")
    .select("id, count, consecutive_days, last_evaluated_at")
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(`Failed to load shields row: ${error.message}`);
  return data as ShieldState;
}

/**
 * Returns true if shields haven't been evaluated yet today (UTC date).
 */
export async function shouldEvaluateShields(userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data } = await supabase
    .from("shields")
    .select("last_evaluated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data || !data.last_evaluated_at) return true;

  const lastDate = new Date(data.last_evaluated_at).toISOString().slice(0, 10);
  const todayDate = new Date().toISOString().slice(0, 10);
  return lastDate < todayDate;
}

/**
 * Fetch the oldest unseen shield event for notification display.
 */
export async function getUnseenShieldEvent(
  userId: string,
): Promise<{ id: string; event_type: string; shields_after: number } | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from("shield_events")
    .select("id, event_type, shields_after")
    .eq("user_id", userId)
    .eq("seen", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

/**
 * Mark a shield event as seen so it won't show again.
 */
export async function markShieldEventSeen(eventId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("shield_events").update({ seen: true }).eq("id", eventId);
}
