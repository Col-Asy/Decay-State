/**
 * Manages Groq API key selection for dev/prod separation.
 * Helps optimize free tier by isolating development traffic.
 */

export function getGroqApiKey(): string {
  const isDev = process.env.NODE_ENV === "development";
  const devKey = process.env.GROQ_API_KEY_DEV;
  const prodKey = process.env.GROQ_API_KEY;

  // If in development and a dev key is configured, use it
  if (isDev && devKey) {
    return devKey;
  }

  // Otherwise use the production key
  if (!prodKey) {
    throw new Error(
      "GROQ_API_KEY is required. Set GROQ_API_KEY_DEV for development if using separate keys.",
    );
  }

  return prodKey;
}

/**
 * Gets the model ID for Groq API.
 */
export function getGroqModelId(): string {
  return process.env.GROQ_MODEL_ID || "openai/gpt-oss-120b";
}

/**
 * Determines if we're in development mode.
 * Useful for enabling/disabling features or logging.
 */
export function isDevMode(): boolean {
  return process.env.NODE_ENV === "development";
}
