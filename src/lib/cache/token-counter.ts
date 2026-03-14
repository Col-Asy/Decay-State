/**
 * Token counter and estimator for Phase 2 visibility.
 * Tracks approximate token usage during chat and other operations.
 */

/**
 * Rough token estimate: ~1.3 tokens per word for English text.
 * This is a ballpark estimate - actual tokens may vary.
 */
const TOKENS_PER_WORD = 1.3;

/**
 * Estimate tokens in a string.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount * TOKENS_PER_WORD);
}

/**
 * Token tracker for monitoring usage during sessions.
 */
export class TokenTracker {
  private totalTokens = 0;
  private operations: Array<{
    name: string;
    tokens: number;
    timestamp: number;
  }> = [];

  /**
   * Add tokens from an operation.
   */
  addOperation(name: string, tokens: number): void {
    this.totalTokens += tokens;
    this.operations.push({
      name,
      tokens,
      timestamp: Date.now(),
    });
  }

  /**
   * Add tokens from text content.
   */
  addText(name: string, text: string): void {
    const tokens = estimateTokens(text);
    this.addOperation(name, tokens);
  }

  /**
   * Get total tokens used.
   */
  getTotal(): number {
    return this.totalTokens;
  }

  /**
   * Get operation breakdown.
   */
  getBreakdown(): Array<{ name: string; tokens: number }> {
    return this.operations.map((op) => ({
      name: op.name,
      tokens: op.tokens,
    }));
  }

  /**
   * Reset tracker.
   */
  reset(): void {
    this.totalTokens = 0;
    this.operations = [];
  }

  /**
   * Log summary of token usage.
   */
  logSummary(): void {
    // Silently track tokens - logging removed for production
  }
}

/**
 * Estimate tokens for common operations.
 */
export const tokenEstimates = {
  /**
   * System prompt tokens (after compression).
   */
  systemPrompt: (): number => estimateTokens(`You are Switch Protocol: an elite AI mentor for the DecayState...`),

  /**
   * Average user message.
   */
  userMessage: (messageLength: "short" | "medium" | "long" = "medium"): number => {
    const lengths = {
      short: "OK",
      medium: "I need help creating a task to run 5km because I want to improve my fitness.",
      long: "I've been struggling with my fitness goals this week...",
    };
    return estimateTokens(lengths[messageLength]);
  },

  /**
   * RAG context (summarized journal).
   */
  ragContext: (): number => estimateTokens(`KEY INSIGHTS:\n- Pattern 1\n- Pattern 2\n- Pattern 3`),

  /**
   * Tool call overhead.
   */
  toolCall: (): number => 50, // Rough estimate for one tool invocation
};
