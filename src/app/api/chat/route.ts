import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { createNeuralLinkAgent, convertHistory } from "@/lib/agent/agent";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { message, history, integrity, userId, isWeeklyReview } = await req.json();

    // Create server-side Supabase client with request cookies for auth/RLS
    const supabase = await createClient();

    const { app, systemPrompt } = createNeuralLinkAgent(
      userId || "anonymous",
      integrity ?? 50,
      supabase,
      { isWeeklyReview: !!isWeeklyReview },
    );

    // --- RAG: Retrieve relevant journal context ---
    let enrichedPrompt = systemPrompt;
    if (userId && userId !== "anonymous") {
      try {
        const { retrieveRelevantEntries } = await import(
          "@/lib/rag/journal-rag"
        );
        const ragContext = await retrieveRelevantEntries(userId, message);
        if (ragContext) {
          enrichedPrompt = `${systemPrompt}\n\n${ragContext}`;
        }
      } catch (error) {
        // ChromaDB down or embedding failed — continue without RAG context
        console.warn(
          "RAG context retrieval failed, continuing without:",
          error,
        );
      }
    }

    // Convert chat history to LangChain message format
    const messages = convertHistory(history || [], enrichedPrompt);
    messages.push(new HumanMessage(message));

    // Stream the agent's response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const eventStream = app.streamEvents(
            { messages },
            { version: "v2", recursionLimit: 10 },
          );

          for await (const event of eventStream) {
            // Stream text tokens from the LLM
            if (
              event.event === "on_chat_model_stream" &&
              event.data?.chunk
            ) {
              const chunk = event.data.chunk;
              // Content can be string or array of content blocks
              let content = "";
              if (typeof chunk.content === "string") {
                content = chunk.content;
              } else if (Array.isArray(chunk.content)) {
                // Extract text from content blocks
                for (const block of chunk.content) {
                  if (typeof block === "string") content += block;
                  else if (block?.type === "text") content += block.text;
                }
              }

              if (content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                  ),
                );
              }
            }

            // Stream tool call results
            if (event.event === "on_tool_end" && event.data?.output) {
              const toolName = event.name;
              // LangGraph returns a ToolMessage object — extract.content
              let rawOutput = event.data.output;
              let toolResult: any;

              // ToolMessage has a .content property
              if (rawOutput && typeof rawOutput === "object" && "content" in rawOutput) {
                rawOutput = rawOutput.content;
              }

              // Try to parse as JSON for structured results
              try {
                if (typeof rawOutput === "string") {
                  toolResult = JSON.parse(rawOutput);
                } else {
                  toolResult = rawOutput;
                }
              } catch {
                toolResult = rawOutput;
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_result",
                    tool: toolName,
                    result: toolResult,
                  })}\n\n`,
                ),
              );
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
          );
          controller.close();
        } catch (error: any) {
          console.error("Agent streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                content: error?.message || "Agent error",
              })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error in chat route:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
