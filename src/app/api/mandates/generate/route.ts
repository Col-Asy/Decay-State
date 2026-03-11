import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // --- Authoritative 24h cooldown check (server-side) ---
    const { data: lastGen } = await supabase
      .from("daily_mandate_generations")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastGen) {
      const elapsed = Date.now() - new Date(lastGen.created_at).getTime();
      if (elapsed < COOLDOWN_MS) {
        return NextResponse.json({
          generated: false,
          reason: "too_recent",
        });
      }
    }

    // --- Fetch active mission ---
    const { data: mission } = await supabase
      .from("missions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!mission) {
      return NextResponse.json({
        generated: false,
        reason: "no_mission",
      });
    }

    // --- Fetch latest weekly review summary for personalization ---
    const { data: weeklyReview } = await supabase
      .from("weekly_reviews")
      .select("summary, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // --- Fetch shield count for difficulty penalty ---
    const { data: shieldRow } = await supabase
      .from("shields")
      .select("count")
      .eq("user_id", userId)
      .maybeSingle();

    const shieldCount = shieldRow?.count ?? 3;
    const shieldPenaltyBlock =
      shieldCount === 0
        ? `\n\nSHIELD PENALTY ACTIVE (0 shields remaining):\nThe user has lost all shields due to repeated protocol failures. As a consequence, all 5 mandates must be approximately 50% harder than you would normally generate.\n- Physical tasks: increase distance/reps/duration by ~50% (e.g. "run 5km" → "run 7.5km", "20 pushups" → "30 pushups")\n- Intellectual tasks: increase scope/depth (e.g. "read 10 pages" → "read 15 pages", "solve 5 problems" → "solve 8 problems")\n- Spiritual tasks: increase duration or intensity (e.g. "meditate 10 mins" → "meditate 15 mins")\nThis is the consequence of protocol failure. Difficulty resets when a shield is recovered.`
        : "";

    // --- Reserve generation slot BEFORE calling LLM (prevents race condition) ---
    const { data: reservation, error: reserveError } = await supabase
      .from("daily_mandate_generations")
      .insert({
        user_id: userId,
        mission_id: mission.id,
        mandate_ids: [],
      })
      .select("id")
      .single();

    if (reserveError || !reservation) {
      return NextResponse.json({
        generated: false,
        reason: "reserve_failed",
      });
    }

    // --- Fetch existing mandates + recent journal entries for context ---
    const [{ data: existingMandates }, { data: journalEntries }] =
      await Promise.all([
        supabase
          .from("mandates")
          .select("label, category, completed")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("journal_entries")
          .select("date, wins, failures, adjustments")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    const mandateList =
      existingMandates && existingMandates.length > 0
        ? existingMandates
            .map(
              (m: any) =>
                `- [${m.completed ? "x" : " "}] ${m.label} (${m.category})`,
            )
            .join("\n")
        : "None";

    const journalContext =
      journalEntries && journalEntries.length > 0
        ? journalEntries
            .map((e: any) => {
              let text = `--- ${e.date} ---`;
              if (e.wins) text += `\nWins: ${e.wins}`;
              if (e.failures) text += `\nFailures: ${e.failures}`;
              if (e.adjustments) text += `\nAdjustments: ${e.adjustments}`;
              return text;
            })
            .join("\n\n")
        : "No recent entries.";

    // --- Generate 5 daily mandates via Groq ---
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a daily mandate generator for a personal accountability system. Generate exactly 5 actionable daily mandates that are strictly aligned with the user's current active goal.

ACTIVE MISSION:
- Goal: ${mission.goal}
- Timeframe: ${mission.timeframe}
- Plan: ${mission.manifesto || "No detailed plan provided"}

EXISTING MANDATES (avoid duplicating these):
${mandateList}

RECENT JOURNAL ENTRIES (for context on progress):
${journalContext}

WEEKLY REVIEW INSIGHTS (from user's last 7-day check-in — use this to address recurring challenges and reinforce progress patterns):
${weeklyReview?.summary ?? "No weekly review available yet."}

Rules:
- Generate EXACTLY 5 mandates total as a JSON array
- Each mandate must have: label (max 8 words, actionable), category, rationale (1 sentence explaining why)
- ALL 5 mandates must be specific actionable steps toward achieving the goal — do NOT generate generic wellness, exercise, or meditation tasks unless the goal itself is about fitness or wellness
- For category, pick whichever fits the task best: "physical" (hands-on doing), "intellectual" (learning/thinking/planning), or "spiritual" (reflection/mindset/motivation)
- Tasks should be concrete and achievable within a single day
- Adapt to the user's recent journal entries — if they failed at something, create mandates that address that weakness
- Do NOT duplicate existing mandates
- Respond ONLY with valid JSON in this format:

{"mandates":[{"label":"...","category":"...","rationale":"..."},{"label":"...","category":"...","rationale":"..."},{"label":"...","category":"...","rationale":"..."},{"label":"...","category":"...","rationale":"..."},{"label":"...","category":"...","rationale":"..."}]}${shieldPenaltyBlock}`,
        },
        {
          role: "user",
          content:
            "Generate 5 daily mandates for today based on my mission and recent progress.",
        },
      ],
      model: process.env.GROQ_MODEL_ID || "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 768,
    });

    const content = completion.choices[0]?.message?.content || "{}";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
    } catch {
      parsed = { mandates: [] };
    }

    const generatedMandates = (parsed.mandates || []).slice(0, 5);

    if (generatedMandates.length === 0) {
      return NextResponse.json({
        generated: false,
        reason: "llm_empty",
      });
    }

    // --- Insert mandates into DB ---
    const mandateIds: string[] = [];
    const createdMandates: any[] = [];

    for (const m of generatedMandates) {
      const { data, error } = await supabase
        .from("mandates")
        .insert({
          user_id: userId,
          mission_id: mission.id,
          label: m.label,
          category: m.category || "intellectual",
          rationale: m.rationale || null,
          completed: false,
        })
        .select()
        .single();

      if (!error && data) {
        mandateIds.push(data.id);
        createdMandates.push({
          id: data.id,
          label: data.label,
          completed: false,
          category: data.category,
          rationale: data.rationale,
        });
      }
    }

    // --- Update reservation with actual mandate IDs ---
    await supabase
      .from("daily_mandate_generations")
      .update({ mandate_ids: mandateIds })
      .eq("id", reservation.id);

    // --- Log activity ---
    await supabase.from("activity_log").insert({
      user_id: userId,
      type: "system",
      message: `Daily mandates auto-generated: ${createdMandates.map((m) => m.label).join(", ")}`,
    });

    return NextResponse.json({
      generated: true,
      mandates: createdMandates,
    });
  } catch (error: any) {
    console.error("Daily mandate generation error:", error?.message || error);
    return NextResponse.json(
      { generated: false, reason: "error" },
      { status: 500 },
    );
  }
}
