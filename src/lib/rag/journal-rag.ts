import { getJournalCollection } from "./chromadb";
import { generateEmbedding } from "./embeddings";

/**
 * Formats a journal entry into a single string for embedding.
 */
function formatEntryForEmbedding(entry: {
  date: string;
  wins?: string | null;
  failures?: string | null;
  adjustments?: string | null;
}): string {
  const parts: string[] = [`Date: ${entry.date}`];
  if (entry.wins) parts.push(`Wins: ${entry.wins}`);
  if (entry.failures) parts.push(`Failures: ${entry.failures}`);
  if (entry.adjustments) parts.push(`Adjustments: ${entry.adjustments}`);
  return parts.join("\n");
}

/**
 * Embeds a journal entry into ChromaDB.
 * Called after every journal creation (UI or agent tool).
 * Idempotent: uses entry ID as ChromaDB document ID (upsert).
 */
export async function embedJournalEntry(entry: {
  id: string;
  user_id: string;
  date: string;
  wins?: string | null;
  failures?: string | null;
  adjustments?: string | null;
}): Promise<void> {
  const text = formatEntryForEmbedding(entry);

  // Skip empty entries (no content to embed)
  if (text.trim() === `Date: ${entry.date}`) return;

  const embedding = await generateEmbedding(text);
  const collection = await getJournalCollection();

  await collection.upsert({
    ids: [entry.id],
    embeddings: [embedding],
    documents: [text],
    metadatas: [
      {
        user_id: entry.user_id,
        date: entry.date,
        has_wins: entry.wins ? "true" : "false",
        has_failures: entry.failures ? "true" : "false",
        has_adjustments: entry.adjustments ? "true" : "false",
      },
    ],
  });
}

/**
 * Retrieves journal entries semantically relevant to a query.
 * Returns a formatted context string ready for system prompt injection.
 * Returns null if no relevant entries found or on error.
 */
export async function retrieveRelevantEntries(
  userId: string,
  query: string,
  topK: number = 5,
): Promise<string | null> {
  const queryEmbedding = await generateEmbedding(query);
  const collection = await getJournalCollection();

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: { user_id: userId },
    include: ["documents", "distances"],
  });

  if (!results.documents?.[0]?.length) return null;

  const entries = results.documents[0]
    .map((doc, i) => {
      if (!doc) return null;
      const distance = results.distances?.[0]?.[i];
      // Filter out low-relevance results (cosine distance > 0.5)
      if (distance !== undefined && distance !== null && distance > 0.5)
        return null;
      return doc;
    })
    .filter((doc): doc is string => doc !== null);

  if (entries.length === 0) return null;

  return `RELEVANT PROTOCOL LOG CONTEXT (auto-retrieved from journal entries):
The following past journal entries are semantically related to what the user is discussing. Reference them naturally if relevant — do not list them unless asked.

${entries.map((entry, i) => `[Entry ${i + 1}]\n${entry}`).join("\n\n")}`;
}

/**
 * Batch sync: embeds multiple existing entries.
 * Used by the backfill API route.
 */
export async function batchEmbedEntries(
  entries: Array<{
    id: string;
    user_id: string;
    date: string;
    wins?: string | null;
    failures?: string | null;
    adjustments?: string | null;
  }>,
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Process in batches of 20 to avoid rate limits
  const batchSize = 20;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((entry) => embedJournalEntry(entry)),
    );
    for (const result of results) {
      if (result.status === "fulfilled") success++;
      else failed++;
    }
  }

  return { success, failed };
}
