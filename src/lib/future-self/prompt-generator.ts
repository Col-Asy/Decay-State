import { ChatGroq } from "@langchain/groq";
import { getGroqApiKey, getGroqModelId } from "@/lib/groq-config";

const PROMPT_SYSTEM = `You are a visual prompt engineer. Given a person's goal, generate a short image editing instruction for an AI image editing model (FLUX Kontext).

The instruction must describe how to edit the person's photo to show them having achieved their goal. Focus on:
- Environment/setting changes (background)
- Clothing/attire changes
- Body language and posture
- Props or accessories that signal achievement
- Lighting and mood

CRITICAL RULES:
- Start with "Edit this photo to show the person"
- Keep it under 60 words
- Be specific and visual, not abstract
- Do NOT mention changing the face or facial features (the model preserves the face)
- Do NOT use words like "AI", "generate", "render"
- Focus on achievable, realistic visual changes

Examples:
- Goal "Run a marathon" → "Edit this photo to show the person at a marathon finish line, wearing running gear with a medal around their neck, crowd cheering in the background, golden hour lighting, triumphant pose."
- Goal "Launch SaaS MVP" → "Edit this photo to show the person in a modern tech office, wearing a professional blazer, standing confidently next to a large monitor displaying a product dashboard, warm ambient lighting."
- Goal "Become a full stack developer" → "Edit this photo to show the person at a developer workstation with multiple monitors displaying code, wearing a tech company hoodie, confident posture, modern office with plants and natural light."`;

export async function generateVisualPrompt(
  goal: string,
  manifesto?: string | null,
): Promise<string> {
  const model = new ChatGroq({
    apiKey: getGroqApiKey(),
    model: getGroqModelId(),
    temperature: 0.8,
    maxTokens: 200,
  });

  const context = manifesto
    ? `Goal: ${goal}\nPlan details: ${manifesto}`
    : `Goal: ${goal}`;

  const response = await model.invoke([
    { role: "system", content: PROMPT_SYSTEM },
    { role: "user", content: context },
  ]);

  const content =
    typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
        ? response.content
            .map((b: unknown) =>
              typeof b === "string"
                ? b
                : (b as { text?: string })?.text ?? "",
            )
            .join("")
        : String(response.content);

  return content.trim();
}
