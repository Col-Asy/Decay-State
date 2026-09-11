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
  collectionCache = await chroma.getOrCreateCollection({
    name: process.env.CHROMA_COLLECTION || "journal_entries",
    configuration: {
      hnsw: { space: "cosine" },
    },
  });
  return collectionCache;
}
