import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/types";

export type DbChatMessage = {
  id: string;
  user_id: string;
  conversation_id: string;
  sender: "user" | "ai";
  text: string;
  created_at: string;
};

function toChatMessage(row: DbChatMessage): ChatMessage {
  return {
    id: row.id,
    sender: row.sender,
    text: row.text,
    timestamp: new Date(row.created_at).getTime(),
  };
}

/** Load all messages in a conversation, oldest first */
export async function getChatHistory(
  conversationId: string,
): Promise<ChatMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_chats")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as DbChatMessage[]).map(toChatMessage);
}

/** Persist a single message to the DB */
export async function saveChatMessage(
  userId: string,
  conversationId: string,
  sender: "user" | "ai",
  text: string,
): Promise<ChatMessage> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_chats")
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      sender,
      text,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toChatMessage(data as DbChatMessage);
}

/** Count messages sent by the user in the last 24h (for daily quota) */
export async function countTodayMessages(userId: string): Promise<number> {
  const supabase = createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("ai_chats")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("sender", "user")
    .gte("created_at", since);

  if (error) return 0;
  return count ?? 0;
}
