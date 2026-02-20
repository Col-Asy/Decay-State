import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { aiResponse, currentMandates } = await req.json();

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an action extractor. Given an AI mentor's response, extract any actionable items that should become tasks (mandates) or mission updates.

RULES:
- Only extract CONCRETE, SPECIFIC tasks — not vague ideas.
- Each task must have a clear label (what to do), a category (physical/intellectual/spiritual), and a brief rationale.
- If the AI suggested a mission goal or timeframe update, extract that too.
- If there are NO actionable items, return empty arrays.
- Do NOT duplicate tasks that already exist in the current mandates list.
- Keep task labels SHORT and actionable (max 6-8 words).

CURRENT MANDATES (do not duplicate): ${JSON.stringify(currentMandates?.map((t: any) => t.label) || [])}

Respond ONLY with valid JSON in this exact format, no other text:
{
  "mandates": [
    { "label": "Task description", "category": "intellectual", "rationale": "Why this matters" }
  ],
  "mission": null or { "goal": "Updated goal", "timeframe": "Updated timeframe" }
}`
                },
                {
                    role: "user",
                    content: `Extract actions from this AI response:\n\n${aiResponse}`
                }
            ],
            model: process.env.GROQ_MODEL_ID || "llama-3.1-8b-instant",
            temperature: 0.1,
            max_tokens: 500,
        });

        const content = completion.choices[0]?.message?.content || "{}";

        // Parse JSON from the response (handle potential markdown code blocks)
        let parsed;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
        } catch {
            parsed = { mandates: [], mission: null };
        }

        return NextResponse.json(parsed);
    } catch (error: any) {
        console.error("Action extraction error:", error?.message || error);
        return NextResponse.json({ mandates: [], mission: null });
    }
}
