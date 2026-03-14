import { createClient } from "@/lib/supabase/client";

export async function addOnboardingMandates(userId: string, mandates: { label: string, category: "physical" | "intellectual" | "spiritual", rationale: string }[], missionId: string) {
  const supabase = createClient();
  
  const mandatesToInsert = mandates.map(m => ({
    user_id: userId,
    mission_id: missionId,
    label: m.label,
    category: m.category,
    rationale: m.rationale,
    completed: false
  }));

  const { data, error } = await supabase
    .from("mandates")
    .insert(mandatesToInsert)
    .select("id");

  if (error) {
    console.error("Error saving onboarding mandates:", error);
    throw new Error(error.message);
  }

  // Register these as the "daily generation" for day 1 so they don't count
  // against the AI chat's 3-per-day manual creation limit, and to trigger the 24h cooldown.
  if (data && data.length > 0) {
    const mandateIds = data.map(m => m.id);
    await supabase.from("daily_mandate_generations").insert({
      user_id: userId,
      mission_id: missionId,
      mandate_ids: mandateIds
    });
  }
}
