import { createClient } from "@/lib/supabase/client";

export type FutureSelfImage = {
  id: string;
  user_id: string;
  mission_id: string;
  image_url: string;
  storage_path: string;
  prompt_used: string | null;
  is_selected: boolean;
  generation_number: number;
  created_at: string;
  updated_at: string;
};

/** Fetch all generated images for a mission (ordered by generation number) */
export async function getGenerations(
  missionId: string,
): Promise<FutureSelfImage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("future_self_images")
    .select("*")
    .eq("mission_id", missionId)
    .order("generation_number", { ascending: true });

  if (error) throw new Error(error.message);
  return data as FutureSelfImage[];
}

/** Get the number of generations for a mission */
export async function getGenerationCount(
  missionId: string,
): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("future_self_images")
    .select("*", { count: "exact", head: true })
    .eq("mission_id", missionId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Select an image: deselect all for the mission, select the chosen one, update missions.image_url */
export async function selectImage(
  imageId: string,
  missionId: string,
  imageUrl: string,
): Promise<void> {
  const supabase = createClient();

  // Deselect all for this mission
  const { error: deselectError } = await supabase
    .from("future_self_images")
    .update({ is_selected: false })
    .eq("mission_id", missionId);
  if (deselectError) throw new Error(deselectError.message);

  // Select the chosen one
  const { error: selectError } = await supabase
    .from("future_self_images")
    .update({ is_selected: true })
    .eq("id", imageId);
  if (selectError) throw new Error(selectError.message);

  // Update mission's display image
  const { error: missionError } = await supabase
    .from("missions")
    .update({ image_url: imageUrl })
    .eq("id", missionId);
  if (missionError) throw new Error(missionError.message);
}
