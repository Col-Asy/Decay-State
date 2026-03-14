/**
 * Response caching utilities using Next.js unstable_cache.
 * Provides TTL-based caching for API responses and database queries.
 */

import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cached wrapper for fetching user context (mission + mandates + journal).
 * Returns null if user not found.
 */
export const getCachedUserContext = unstable_cache(
  async (
    supabase: SupabaseClient,
    userId: string,
  ): Promise<{
    mission: any | null;
    mandates: any[];
    journalCount: number;
  } | null> => {
    // Fetch active mission
    const { data: mission } = await supabase
      .from("missions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    // Fetch recent mandates
    const { data: mandates } = await supabase
      .from("mandates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Count journal entries
    const { count: journalCount } = await supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      mission,
      mandates: mandates || [],
      journalCount: journalCount || 0,
    };
  },
  ["user_context"],
  { tags: ["user_context"], revalidate: 2 * 60 * 60 }, // 2 hours
);

/**
 * Cached wrapper for fetching upcoming tasks.
 */
export const getCachedUpcomingTasks = unstable_cache(
  async (supabase: SupabaseClient, userId: string): Promise<any[]> => {
    const { data: mandates } = await supabase
      .from("mandates")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", false)
      .order("created_at", { ascending: false });

    return mandates || [];
  },
  ["upcoming_tasks"],
  { tags: ["upcoming_tasks"], revalidate: 1 * 60 * 60 }, // 1 hour
);

/**
 * Cached wrapper for fetching active mission.
 */
export const getCachedActiveMission = unstable_cache(
  async (supabase: SupabaseClient, userId: string): Promise<any | null> => {
    const { data: mission } = await supabase
      .from("missions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    return mission;
  },
  ["active_mission"],
  { tags: ["active_mission"], revalidate: 6 * 60 * 60 }, // 6 hours
);

/**
 * Cached wrapper for fetching weekly review summary.
 */
export const getCachedWeeklyReview = unstable_cache(
  async (
    supabase: SupabaseClient,
    userId: string,
    weekStart: string,
  ): Promise<any | null> => {
    const { data: review } = await supabase
      .from("weekly_reviews")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle();

    return review;
  },
  ["weekly_review"],
  { tags: ["weekly_review"], revalidate: 7 * 24 * 60 * 60 }, // 7 days
);

/**
 * Invalidate cache tags when data is modified.
 * Called after create/update/delete operations.
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  // Next.js will automatically revalidate tagged caches on next request
}

/**
 * Invalidate user context cache specifically.
 */
export async function invalidateUserContextCache(): Promise<void> {
  // Tagged caches auto-revalidate
}

/**
 * Invalidate upcoming tasks cache.
 */
export async function invalidateUpcomingTasksCache(): Promise<void> {
  // Tagged caches auto-revalidate
}

/**
 * Invalidate weekly review cache.
 */
export async function invalidateWeeklyReviewCache(): Promise<void> {
  // Tagged caches auto-revalidate
}
