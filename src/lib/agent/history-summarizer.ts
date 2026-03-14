import type { ChatMessage } from "@/types";
import { ChatGroq } from "@langchain/groq";
import { getGroqApiKey, getGroqModelId } from "@/lib/groq-config";

/**
 * Summarizes older chat history to reduce token consumption while preserving context.
 * Keeps recent messages intact, summarizes older ones into key points.
 */
export async function summarizeChatHistory(
  history: ChatMessage[],
): Promise<ChatMessage[]> {
  // Keep the last 4 messages as-is (recent context)
  // Summarize everything before that
  const recentMessageCount = 4;

  if (history.length <= recentMessageCount) {
    return history; // Not enough history to summarize
  }

  const oldMessages = history.slice(0, -recentMessageCount);
  const recentMessages = history.slice(-recentMessageCount);

  // Summarize old messages using Groq
  try {
    const summaryPrompt = `Summarize this conversation in 2-3 bullet points. Extract ONLY:
- Goals/mandates mentioned
- Actions taken (tasks created, completed)
- Key decisions made
- Important context

Keep it extremely concise (under 100 words total). Format as bullet points.

CONVERSATION:
${oldMessages.map((m) => `${m.sender === "user" ? "User" : "AI"}: ${m.text}`).join("\n")}`;

    const groq = new ChatGroq({
      apiKey: getGroqApiKey(),
      model: getGroqModelId(),
      temperature: 0.3, // Low temp for focused extraction
      maxTokens: 150,
    });

    const summaryResponse = await groq.invoke(summaryPrompt);
    const summaryText =
      summaryResponse.content instanceof string
        ? summaryResponse.content
        : JSON.stringify(summaryResponse.content);

    // Create a synthetic summary message
    const summaryMessage: ChatMessage = {
      sender: "ai",
      text: `[CONVERSATION SUMMARY]\n${summaryText}`,
      timestamp: oldMessages[0]?.timestamp,
    };

    // Return: summary + recent messages
    return [summaryMessage, ...recentMessages];
  } catch (error) {
    console.error("Failed to summarize history, returning recent messages only:", error);
    // Fallback: return only recent messages if summarization fails
    return recentMessages;
  }
}

/**
 * Alternative: Simple token-based compression without LLM.
 * Removes old messages entirely after keeping recent ones.
 */
export function compressHistoryByRecency(
  history: ChatMessage[],
  keepCount: number = 6,
): ChatMessage[] {
  return history.slice(-keepCount);
}

/**
 * Counts approximate tokens in chat history.
 * Each word ≈ 1.3 tokens (rough estimate for English).
 */
export function estimateHistoryTokens(history: ChatMessage[]): number {
  const totalText = history.map((m) => m.text).join(" ");
  const wordCount = totalText.split(/\s+/).length;
  return Math.ceil(wordCount * 1.3); // Rough estimate
}
