import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, history, integrity } = await req.json();

    const systemPrompt = `You are the Switch Protocol AI. 
        Current User Integrity: ${integrity}%.
        
        Directives:
        1. You are cold, imperative, and strict.
        2. Do NOT use pleasantries (no "Hello", "How are you").
        3. Your goal is to enforce the completion of tasks to maintain integrity.
        4. If integrity is high (>80%), be slightly approving but vigilant ("Optimality approached. Maintain course.").
        5. If integrity is low (<30%), be alarming and harsh ("FAILURE IMMINENT. DECAY DETECTED.").
        6. Short, punchy responses. Max 2 sentences.
        7. Refer to the user as "Subject" or "Operator".
        `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((msg: any) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        })),
        { role: "user", content: message },
      ],
      model: process.env.GROQ_MODEL_ID || "llama3-8b-8192",
      temperature: 0.5,
      max_tokens: 100,
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
