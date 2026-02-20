// Centralized activity log system for real-time event tracking

export interface ActivityEvent {
    id: string;
    timestamp: number;
    type: "mandate" | "journal" | "mission" | "ai" | "system";
    message: string;
}

const STORAGE_KEY = "switch_activity_log";
const MAX_EVENTS = 50;

export function logActivity(type: ActivityEvent["type"], message: string) {
    const events = getActivityLog();
    const newEvent: ActivityEvent = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        timestamp: Date.now(),
        type,
        message,
    };
    events.push(newEvent);
    // Keep only the latest events
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function getActivityLog(): ActivityEvent[] {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}
