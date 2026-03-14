/**
 * Cache key generators for Phase 2 optimization.
 * Centralized key management for consistent caching across the app.
 */

/**
 * Generate cache key for user context (mission + mandates + journal summary).
 * Invalidates when user data changes.
 */
export function getUserContextCacheKey(userId: string): string {
  return `user_context:${userId}`;
}

/**
 * Generate cache key for mandate retrieval.
 * Includes user ID and filter parameters.
 */
export function getMandatesCacheKey(
  userId: string,
  filter?: string,
): string {
  return `mandates:${userId}:${filter || "all"}`;
}

/**
 * Generate cache key for journal RAG retrieval.
 * Invalidates when journal entries change.
 */
export function getJournalCacheKey(userId: string, query: string): string {
  // Hash the query to avoid overly long keys
  const queryHash = Buffer.from(query).toString("base64").substring(0, 20);
  return `journal_rag:${userId}:${queryHash}`;
}

/**
 * Generate cache key for weekly review summary.
 * Includes week start date for weekly invalidation.
 */
export function getWeeklyReviewCacheKey(
  userId: string,
  weekStart: string,
): string {
  return `weekly_review:${userId}:${weekStart}`;
}

/**
 * Generate cache key for upcoming tasks list.
 */
export function getUpcomingTasksCacheKey(userId: string): string {
  return `upcoming_tasks:${userId}`;
}

/**
 * Generate cache key for active mission.
 */
export function getActiveMissionCacheKey(userId: string): string {
  return `active_mission:${userId}`;
}

/**
 * Cache durations (in seconds).
 */
export const CACHE_DURATIONS = {
  USER_CONTEXT: 2 * 60 * 60, // 2 hours
  MANDATES: 4 * 60 * 60, // 4 hours
  JOURNAL_RAG: 3 * 60 * 60, // 3 hours
  WEEKLY_REVIEW: 7 * 24 * 60 * 60, // 7 days
  UPCOMING_TASKS: 1 * 60 * 60, // 1 hour
  ACTIVE_MISSION: 6 * 60 * 60, // 6 hours
};
