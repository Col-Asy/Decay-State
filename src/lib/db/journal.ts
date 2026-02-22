import { createClient } from "@/lib/supabase/client";

export type JournalEntry = {
  id: string;
  user_id: string;
  mission_id: string | null;
  mandate_id: string | null;
  date: string;
  wins: string | null;
  failures: string | null;
  adjustments: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export async function getJournalEntries(
  userId: string,
): Promise<JournalEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as JournalEntry[];
}

export async function addJournalEntry(
  userId: string,
  entry: {
    wins: string;
    failures: string;
    adjustments: string;
    missionId?: string;
    mandateId?: string;
    imageUrl?: string;
  },
): Promise<JournalEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: userId,
      mission_id: entry.missionId ?? null,
      mandate_id: entry.mandateId ?? null,
      date: new Date().toISOString().split("T")[0],
      wins: entry.wins || null,
      failures: entry.failures || null,
      adjustments: entry.adjustments || null,
      image_url: entry.imageUrl ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as JournalEntry;
}
