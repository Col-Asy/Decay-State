import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { batchEmbedEntries } from "@/lib/rag/journal-rag";

export async function POST(req: NextRequest) {
  try {
    // Auth check: require service role key as secret header to prevent abuse
    const authHeader = req.headers.get("x-sync-secret");
    if (authHeader !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();

    // Use a direct Supabase client with service role (bypasses RLS, no cookies needed)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let query = supabase
      .from("journal_entries")
      .select("id, user_id, date, wins, failures, adjustments")
      .order("created_at", { ascending: true });

    // If userId provided, sync only that user. Otherwise sync all.
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: entries, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        message: "No entries to sync",
        success: 0,
        failed: 0,
      });
    }

    const result = await batchEmbedEntries(entries);

    return NextResponse.json({
      message: "Sync complete",
      total: entries.length,
      ...result,
    });
  } catch (error: any) {
    console.error("RAG sync error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Sync failed" },
      { status: 500 },
    );
  }
}
