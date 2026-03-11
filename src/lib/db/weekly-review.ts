import { createClient } from "@/lib/supabase/client";

const WEEKLY_REVIEW_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Returns true if the user has not completed a weekly review in the last 7 days,
 * or has never completed one.
 */
export async function shouldShowWeeklyReview(userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to check weekly review status:", error.message);
    return false;
  }

  if (!data) return true; // No review yet

  return Date.now() - new Date(data.created_at).getTime() >= WEEKLY_REVIEW_COOLDOWN_MS;
}

/**
 * Saves a completed weekly review summary to the database.
 */
export async function saveWeeklySummary(
  userId: string,
  conversationId: string | null,
  summary: string,
  weekStart: Date,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("weekly_reviews").insert({
    user_id: userId,
    conversation_id: conversationId,
    summary,
    week_start: weekStart.toISOString(),
  });

  if (error) throw new Error(`Failed to save weekly summary: ${error.message}`);
}

/**
 * Fetches the most recent weekly review summary for a user.
 * Returns null if none exists.
 */
export async function getLatestWeeklyReview(
  userId: string,
): Promise<{ summary: string; created_at: string } | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("summary, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch weekly review:", error.message);
    return null;
  }

  return data ?? null;
}
