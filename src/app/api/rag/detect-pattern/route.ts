import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantEntries } from "@/lib/rag/journal-rag";
import { getJournalEntries } from "@/lib/db/journal";

export async function POST(req: NextRequest) {
  try {
    const { userId, failureText } = await req.json();

    if (!userId || !failureText) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Try vector search via RAG first
    let matchingEntries: string[] = [];
    try {
      const ragResults = await retrieveRelevantEntries(userId, failureText, 5);
      if (ragResults && ragResults.trim() !== "No relevant journal entries found.") {
        matchingEntries = ragResults.split("\n\n").filter(Boolean);
      }
    } catch {
      // Fallback: search database directly
    }

    if (matchingEntries.length === 0) {
      const allEntries = await getJournalEntries(userId);
      const keywords = failureText.toLowerCase().split(" ").filter((w: string) => w.length > 3);
      const matches = allEntries.filter((e) => {
        if (!e.failures) return false;
        const text = e.failures.toLowerCase();
        return keywords.some((kw: string) => text.includes(kw));
      });
      matchingEntries = matches.map((m) => `Date: ${m.date} - ${m.failures}`);
    }

    const count = matchingEntries.length;
    let callout = "";

    if (count > 1) {
      callout = `RECURRENT EXCUSET DETECTED (${count} matches): You have cited similar setback rationale in past entries. Break this self-sabotage vector immediately.`;
    } else {
      callout = "First instance recorded of this failure vector.";
    }

    return NextResponse.json({
      count,
      similarEntries: matchingEntries.slice(0, 3),
      callout,
    });
  } catch (error: any) {
    console.error("Pattern detection error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
