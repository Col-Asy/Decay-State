import { createClient } from "@/lib/supabase/client";

export type Conversation = {
  id: string;
  user_id: string;
  mission_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
};

export async function getConversations(
  userId: string,
): Promise<Conversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Conversation[];
}

export async function createConversation(
  userId: string,
  options: { title?: string; missionId?: string } = {},
): Promise<Conversation> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      mission_id: options.missionId ?? null,
      title: options.title ?? "New Session",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Conversation;
}

export async function updateConversationTitle(
  id: string,
  title: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteConversation(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
