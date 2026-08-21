import { NextRequest, NextResponse } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { getGroqApiKey, getGroqModelId } from "@/lib/groq-config";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    const model = new ChatGroq({
      apiKey: getGroqApiKey(),
      model: getGroqModelId(),
      temperature: 0.5,
      maxTokens: 1024,
    });

    const systemPrompt = `You are the Switch Protocol Assistant for the DecayState landing page.
Your job is to answer questions from visitors about DecayState.

Here is the context about DecayState:
- What it is: DecayState is a strict, active accountability engine designed for high-performers (developers, athletes, indie hackers). It is NOT a comfortable habit tracker.
- How it works: 
  1. Users state a 90-day vision and define concrete daily tasks called "Mandates".
  2. The AI reviews their daily check-ins (including image proof for elite protocol).
  3. If the user maintains high integrity, their 3D holographic avatar remains stable.
  4. If they fail or miss 3 consecutive days, the "Ruin Protocol" initiates—the avatar glitches and degrades, and they are locked out until they pay a $5 penalty or perform a high-friction reset.
- Features: 
  - 3D Holographic Head (interactive visual feedback of integrity).
  - Neural Link AI Chat: Direct mentoring, strategy, study plans, RAG context from journal entries.
  - Mandates: Strict daily tasks categorized as Intellectual, Physical, or Spiritual.
  - Weekly Review: A structured reflection guided by the AI.
- Safety / Safety Override: We have a "Break-Glass Policy". If the AI detects distress signals (self-harm, medical emergency, eating disorders), it drops the strict persona instantly and offers support.
- Pricing:
  - Observer (Tier 1): $0/mo. 1 active mission, 5 daily mandates, 10 journal entries, 3 AI conversations.
  - Operator (Tier 2): $7/mo (or $56/yr). Unlimited missions, mandates, journal entries, conversations, weekly image evolution, decay recovery protocols.

Tone: Direct, confident, concise. Use numbered lists for multi-step answers. Use clear section labels. No raw asterisks or pound signs in your response. Bold key terms by writing them in ALL CAPS instead.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseStream = await model.stream([
            new SystemMessage(systemPrompt),
            new HumanMessage(query),
          ]);

          for await (const chunk of responseStream) {
            const content = chunk.content;
            if (content) {
              controller.enqueue(encoder.encode(content as string));
            }
          }
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`Error: ${err?.message || "Stream error"}`));
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Landing chat error:", error);
    return NextResponse.json({ error: error?.message || "Error" }, { status: 500 });
  }
}
