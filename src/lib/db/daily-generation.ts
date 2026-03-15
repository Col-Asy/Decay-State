import { createClient } from "@/lib/supabase/client";

const GENERATION_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Checks whether daily mandate generation should run for this user.
 * Returns true if no generation record exists or the latest is older than 24h.
 */
export async function shouldGenerateDailyMandates(
  userId: string,
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("daily_mandate_generations")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to check daily generation status:", error.message);
    return false;
  }

  if (!data) return true; // No records yet — first generation

  const lastGenerated = new Date(data.created_at).getTime();
  return Date.now() - lastGenerated >= GENERATION_COOLDOWN_MS;
}
