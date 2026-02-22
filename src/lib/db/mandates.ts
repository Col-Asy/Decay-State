import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/types";

export type DbMandate = {
  id: string;
  user_id: string;
  mission_id: string | null;
  label: string;
  category: "physical" | "intellectual" | "spiritual";
  rationale: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Map DB row → app Task type
function toTask(row: DbMandate): Task {
  return {
    id: row.id,
    label: row.label,
    completed: row.completed,
    category: row.category,
    rationale: row.rationale ?? undefined,
  };
}

export async function getMandates(userId: string): Promise<Task[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mandates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as DbMandate[]).map(toTask);
}

export async function addMandate(
  userId: string,
  mandate: Omit<Task, "id">,
  missionId?: string,
): Promise<Task> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mandates")
    .insert({
      user_id: userId,
      mission_id: missionId ?? null,
      label: mandate.label,
      category: mandate.category,
      rationale: mandate.rationale ?? null,
      completed: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toTask(data as DbMandate);
}

export async function updateMandate(
  id: string,
  patch: Partial<
    Pick<DbMandate, "completed" | "completed_at" | "label" | "rationale">
  >,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("mandates").update(patch).eq("id", id);

  if (error) throw new Error(error.message);
}

export async function completeMandate(id: string): Promise<void> {
  return updateMandate(id, {
    completed: true,
    completed_at: new Date().toISOString(),
  });
}

export async function deleteMandate(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("mandates").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
