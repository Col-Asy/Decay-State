import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedJournalEntry } from "@/lib/rag/journal-rag";

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entry = await req.json();

    // Ensure the entry belongs to the authenticated user
    if (entry.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await embedJournalEntry(entry);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Non-critical: don't fail the user experience if embedding fails
    console.warn("Embedding failed:", error?.message);
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}
