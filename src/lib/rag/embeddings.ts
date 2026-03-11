import { InferenceClient } from "@huggingface/inference";

let hfClient: InferenceClient | null = null;

const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

function getHF(): InferenceClient {
  if (!hfClient) {
    hfClient = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
  }
  return hfClient;
}

/**
 * Generate an embedding vector for a text string.
 * Uses sentence-transformers/all-MiniLM-L6-v2 (384 dimensions, free via HuggingFace).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const hf = getHF();
  const output = await hf.featureExtraction({
    model: EMBEDDING_MODEL,
    inputs: text,
  });
  // featureExtraction returns number[] for a single string input
  return output as number[];
}
