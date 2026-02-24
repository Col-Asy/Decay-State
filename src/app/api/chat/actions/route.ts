import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { aiResponse, currentMandates } = await req.json();

    const mandateList =
      currentMandates && currentMandates.length > 0
        ? currentMandates.map((m: any) => `- ${m.label}`).join("\n")
        : "None";

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an action extractor. Given an AI mentor's response, extract any concrete, actionable tasks or mission updates.

CURRENT MANDATES (do NOT duplicate these):
${mandateList}

Respond ONLY with valid JSON in this exact format:
{
  "mandates": [
    { "label": "short task description (max 8 words)", "category": "physical|intellectual|spiritual", "rationale": "why this matters" }
  ],
  "mission": { "goal": "...", "timeframe": "..." } or null
}

Rules:
- Only extract CONCRETE, SPECIFIC tasks (not vague advice)
- Each mandate needs a category: physical, intellectual, or spiritual
- Do NOT duplicate existing mandates
- If no actionable tasks found, return {"mandates":[],"mission":null}
- If no mission update, set mission to null
- Maximum 5 mandates per extraction`,
        },
        {
          role: "user",
          content: `Extract actions from this AI response:\n\n${aiResponse}`,
        },
      ],
      model: process.env.GROQ_MODEL_ID || "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 512,
    });

    const content = completion.choices[0]?.message?.content || "{}";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
    } catch {
      parsed = { mandates: [], mission: null };
    }

    return NextResponse.json({
      mandates: parsed.mandates || [],
      mission: parsed.mission || null,
    });
  } catch (error: any) {
    console.error("Action extraction error:", error?.message || error);
    return NextResponse.json({ mandates: [], mission: null });
  }
}
