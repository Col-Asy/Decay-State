import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGroqApiKey, getGroqModelId } from "@/lib/groq-config";

const groq = new Groq({ apiKey: getGroqApiKey() });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, messages } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages to summarize" }, { status: 400 });
    }

    // Build a transcript from the conversation
    const transcript = messages
      .map((m: { sender: string; text: string }) => `${m.sender === "user" ? "USER" : "AI"}: ${m.text}`)
      .join("\n\n");

    // Ask Groq to extract a structured summary
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a weekly review summarizer for a personal accountability system. Given a weekly review conversation, extract a concise structured summary that captures the user's insights.

Extract and summarize:
- Consistency level (how well they kept up with mandates, scale hint)
- Biggest challenges faced this week
- Key wins and achievements
- What didn't go as planned
- Mental and physical state
- Key patterns or recurring themes
- Commitment level and intentions for next week
- Any specific areas needing improvement

Format: A dense but readable paragraph (3-5 sentences) that an AI can use to personalize future daily mandates. Focus on actionable insights. Be specific — include actual topics/tasks mentioned.

Respond with ONLY the summary paragraph. No preamble, no JSON, just the summary.`,
        },
        {
          role: "user",
          content: `Here is the weekly review conversation:\n\n${transcript}`,
        },
      ],
      model: getGroqModelId(),
      temperature: 0.3,
      max_tokens: 512,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || "";

    if (!summary) {
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }

    // Calculate the start of the current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Save to weekly_reviews table
    const { error: insertError } = await supabase.from("weekly_reviews").insert({
      user_id: user.id,
      conversation_id: conversationId || null,
      summary,
      week_start: weekStart.toISOString(),
    });

    if (insertError) {
      console.error("Failed to save weekly review:", insertError.message);
      return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
    }

    return NextResponse.json({ saved: true, summary });
  } catch (error: any) {
    console.error("Weekly review error:", error?.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
