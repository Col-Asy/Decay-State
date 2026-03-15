import { NextRequest } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { getGroqApiKey, getGroqModelId } from "@/lib/groq-config";
import { buildOnboardingPrompt } from "@/lib/agent/onboarding-prompts";

export const maxDuration = 60; // Allow longer generation

export async function POST(req: NextRequest) {
  try {
    const { message, history, goal, manifesto, timeframe } = await req.json();

    if (!message || !goal || !timeframe) {
      return new Response("Missing required fields", { status: 400 });
    }

    const systemPrompt = buildOnboardingPrompt(goal, manifesto, timeframe);
    const messages: any[] = [new SystemMessage(systemPrompt)];

    for (const msg of history) {
      if (msg.sender === "user") {
        messages.push(new HumanMessage(msg.text));
      } else {
        messages.push(new AIMessage(msg.text));
      }
    }
    messages.push(new HumanMessage(message));

    const model = new ChatGroq({
      apiKey: getGroqApiKey(),
      model: getGroqModelId(),
      temperature: 0.7,
      maxTokens: 2048,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, content: any) => {
          const data = JSON.stringify({ type, ...content });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        try {
          // Stream the response from the model
          const responseStream = await model.stream(messages);
          let fullContent = "";

          for await (const chunk of responseStream) {
            const content = chunk.content;
            if (content) {
              fullContent += content;
              sendEvent("text", { content: content });
            }
          }

          // Check if completion signal exists
          if (fullContent.includes("ONBOARDING_COMPLETE")) {
            try {
              // Extract the JSON block
              const match = fullContent.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
              if (match && match[1]) {
                const parsed = JSON.parse(match[1]);
                if (parsed.mandates && Array.isArray(parsed.mandates)) {
                  sendEvent("mandates_generated", { mandates: parsed.mandates });
                }
              }
            } catch {
              sendEvent("error", { content: "Failed to parse final mandates." });
            }
          }
        } catch {
          sendEvent("error", { content: "Connection disrupted." });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Onboarding chat API error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
