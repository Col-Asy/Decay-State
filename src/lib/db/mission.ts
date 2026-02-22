import { createClient } from "@/lib/supabase/client";

export type Mission = {
  id: string;
  user_id: string;
  goal: string;
  manifesto: string | null;
  timeframe: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Get all missions for a user (most recent first) */
export async function getMissions(userId: string): Promise<Mission[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Mission[];
}

/** Get the currently active mission */
export async function getActiveMission(
  userId: string,
): Promise<Mission | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Mission | null;
}

/** Create a new mission and deactivate all others */
export async function createMission(
  userId: string,
  mission: {
    goal: string;
    manifesto?: string;
    timeframe: string;
    image_url?: string;
  },
): Promise<Mission> {
  const supabase = createClient();

  // Deactivate current active missions
  await supabase
    .from("missions")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  const { data, error } = await supabase
    .from("missions")
    .insert({
      user_id: userId,
      goal: mission.goal,
      manifesto: mission.manifesto ?? null,
      timeframe: mission.timeframe,
      image_url: mission.image_url ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Mission;
}

/** Update an existing mission */
export async function updateMission(
  id: string,
  patch: Partial<
    Pick<
      Mission,
      "goal" | "manifesto" | "timeframe" | "is_active" | "image_url"
    >
  >,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("missions").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Upsert: if user has no active mission, create one; otherwise update */
export async function upsertActiveMission(
  userId: string,
  data: {
    goal: string;
    manifesto?: string;
    timeframe: string;
    image_url?: string;
  },
): Promise<Mission> {
  const existing = await getActiveMission(userId);
  if (existing) {
    await updateMission(existing.id, data);
    return {
      ...existing,
      ...data,
      image_url: data.image_url ?? existing.image_url ?? null,
    };
  }
  return createMission(userId, data);
}
