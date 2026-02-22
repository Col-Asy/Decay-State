// Centralized activity log system for real-time event tracking
// Writes to DB (Supabase) when userId is available; localStorage is only used as a local cache
import { logActivityDB } from "@/lib/db/activity";

export interface ActivityEvent {
  id: string;
  timestamp: number;
  type: "mandate" | "journal" | "mission" | "ai" | "system";
  message: string;
}

const STORAGE_KEY = "switch_activity_log";
const MAX_EVENTS = 50;

export function logActivity(
  type: ActivityEvent["type"],
  message: string,
  userId?: string,
) {
  // Write to Supabase if we have a user
  if (userId) {
    logActivityDB(userId, type, message).catch(() => {});
  }

  // Also write to localStorage for the live terminal view (no DB latency)
  if (typeof window === "undefined") return;
  const events = getActivityLog();
  const newEvent: ActivityEvent = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    type,
    message,
  };
  events.push(newEvent);
  const trimmed = events.slice(-MAX_EVENTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function getActivityLog(): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}
