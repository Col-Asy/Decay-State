import {
  CloudClient,
  type Collection,
  type EmbeddingFunction,
} from "chromadb";
import { generateEmbedding } from "./embeddings";

let client: CloudClient | null = null;

function getChromaClient(): CloudClient {
  if (!client) {
    client = new CloudClient({
      apiKey: process.env.CHROMA_API_KEY,
      tenant: process.env.CHROMA_TENANT,
      database: process.env.CHROMA_DATABASE,
    });
  }
  return client;
}

const hfEmbeddingFunction: EmbeddingFunction = {
  name: "huggingface-minilm",
  async generate(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(generateEmbedding));
  },
  defaultSpace() {
    return "cosine";
  },
  supportedSpaces() {
    return ["cosine", "l2", "ip"];
  },
};

let collectionCache: Collection | null = null;

export async function getJournalCollection(): Promise<Collection> {
  if (collectionCache) return collectionCache;

  const chroma = getChromaClient();

  // Temporarily intercept console.warn to silence ChromaDB's deserialization warnings
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      (args[0].includes("embedding function") || args[0].includes("DefaultEmbeddingFunction"))
    ) {
      return;
    }
    originalWarn(...args);
  };

  try {
    collectionCache = await chroma.getOrCreateCollection({
      name: process.env.CHROMA_COLLECTION || "journal_entries",
      embeddingFunction: hfEmbeddingFunction,
      configuration: {
        hnsw: { space: "cosine" },
      },
    });
  } finally {
    console.warn = originalWarn;
  }

  return collectionCache;
}
