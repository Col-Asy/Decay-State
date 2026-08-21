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

/**
 * Get today's existing conversation for a user, or create a new one.
 * Excludes weekly review sessions from the lookup.
 */
export async function getOrCreateConversation(
  userId: string,
  title?: string,
): Promise<Conversation> {
  const supabase = createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString())
    .not("title", "ilike", "Weekly Review%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as Conversation;

  const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return createConversation(userId, { title: title || `Session — ${dateLabel}` });
}

/**
 * Persist a single message to the ai_chats table.
 */
export async function saveMessage(
  conversationId: string,
  userId: string,
  sender: "user" | "ai",
  text: string,
  attachments?: any[],
): Promise<void> {
  const supabase = createClient();
  let dbText = text;
  if (attachments && attachments.length > 0) {
    dbText = `${text}\n\n[ATTACHMENTS_METADATA:${JSON.stringify(attachments)}]`;
  }
  await supabase.from("ai_chats").insert({
    conversation_id: conversationId,
    user_id: userId,
    sender,
    text: dbText,
  });
}

/**
 * Load all messages in a conversation ordered oldest-first.
 */
export async function getConversationMessages(
  conversationId: string,
): Promise<Array<{ id: string; sender: "user" | "ai"; text: string; created_at: string; attachments?: any[] }>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ai_chats")
    .select("id, sender, text, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  
  const parsedMessages = (data || []).map((m) => {
    let cleanText = m.text;
    let attachments: any[] | undefined = undefined;
    
    const match = m.text.match(/\n\n\[ATTACHMENTS_METADATA:([\s\S]*)\]$/);
    if (match) {
      try {
        attachments = JSON.parse(match[1]);
        cleanText = m.text.substring(0, match.index);
      } catch (e) {
        console.error("Failed to parse attachments metadata", e);
      }
    }
    
    return {
      ...m,
      text: cleanText,
      attachments,
    };
  });

  return parsedMessages;
}

/**
 * Get N most recent conversations for a user (for history navigation).
 */
export async function getRecentConversations(
  userId: string,
  limit = 10,
): Promise<Conversation[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load conversations: ${error.message}`);
  return (data || []) as Conversation[];
}
