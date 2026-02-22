"use client";

import { useEffect, useRef, useState } from "react";
import { logActivity, getActivityLog, ActivityEvent } from "@/lib/activityLog";
import { getActivityLog as getActivityLogDB } from "@/lib/db/activity";
import { useAuth } from "@/context/AuthContext";
import { getSubscription } from "@/lib/db/subscriptions";
import { getFeatureConfig } from "@/lib/featureGate";

const TYPE_COLORS: Record<string, string> = {
  mandate: "text-blue-400",
  journal: "text-purple-400",
  mission: "text-yellow-400",
  ai: "text-cyan-400",
  system: "text-green-400",
};

const TYPE_LABELS: Record<string, string> = {
  mandate: "MANDATE",
  journal: "JOURNAL",
  mission: "MISSION",
  ai: "AI_LINK",
  system: "SYSTEM",
};

export function LiveSystemLog({
  userName,
  integrity,
}: {
  userName: string;
  integrity: number;
}) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityEvent[]>([]);
  const [dbSeeded, setDbSeeded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevIntegrityRef = useRef(integrity);
  // After seeding from DB, only show localStorage events newer than this timestamp
  const dbCutoffRef = useRef<number>(0);

  // On mount: load history from Supabase (tier-gated)
  useEffect(() => {
    if (!user || dbSeeded) return;

    async function seedFromDB() {
      try {
        const sub = await getSubscription(user!.id);
        const config = getFeatureConfig(sub?.tier ?? "observer");
        const dbEvents = await getActivityLogDB(
          user!.id,
          config.activityLogHours,
        );
        const sorted = [...dbEvents].sort((a, b) => a.timestamp - b.timestamp);
        setLogs(sorted);
        // Record the timestamp of the latest DB event so the localStorage
        // poller only appends events that arrived AFTER this point
        dbCutoffRef.current =
          sorted.length > 0 ? sorted[sorted.length - 1].timestamp : Date.now();
      } catch {
        // DB unavailable — fall back to localStorage snapshot
        const local = getActivityLog().sort(
          (a, b) => a.timestamp - b.timestamp,
        );
        setLogs(local);
        dbCutoffRef.current = 0;
      } finally {
        setDbSeeded(true);
      }
    }

    seedFromDB();
  }, [user, dbSeeded]);

  // Poll localStorage every 2s for truly NEW in-session events (after DB cutoff)
  useEffect(() => {
    if (!dbSeeded) return;

    const interval = setInterval(() => {
      const cutoff = dbCutoffRef.current;
      const newLocal = getActivityLog().filter((e) => e.timestamp > cutoff);
      if (newLocal.length === 0) return;

      setLogs((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const fresh = newLocal.filter((e) => !existingIds.has(e.id));
        if (fresh.length === 0) return prev;
        return [...prev, ...fresh].sort((a, b) => a.timestamp - b.timestamp);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [dbSeeded]);

  // Log session start once per session
  useEffect(() => {
    if (!sessionStorage.getItem("switch_log_init") && userName) {
      logActivity("system", "SESSION_INITIALIZED: Protocol Active");
      logActivity("system", `User '${userName}' authenticated`);
      sessionStorage.setItem("switch_log_init", "1");
    }
  }, [userName]);

  // Track integrity changes
  useEffect(() => {
    if (prevIntegrityRef.current !== integrity) {
      const direction = integrity > prevIntegrityRef.current ? "↑" : "↓";
      logActivity(
        "system",
        `Integrity ${direction} ${integrity}% (was ${prevIntegrityRef.current}%)`,
      );
      prevIntegrityRef.current = integrity;
    }
  }, [integrity]);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <div className="flex-1 border border-white/10 bg-black p-4 font-mono text-xs overflow-hidden flex flex-col relative h-full">
      <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2 text-[9px] text-zinc-500 uppercase tracking-widest shrink-0">
        <span>ACTIVITY_LOG</span>
        <span className="animate-pulse text-green-500 flex items-center gap-2">
          ● LIVE_FEED
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 text-zinc-400 font-mono text-[10px] leading-relaxed pr-2"
      >
        {logs.length === 0 ? (
          <div className="text-zinc-600 italic">Awaiting system events...</div>
        ) : (
          logs.map((event) => (
            <div
              key={event.id}
              className="animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <span className="text-zinc-600 mr-1">
                [{formatTime(event.timestamp)}]
              </span>
              <span
                className={`${TYPE_COLORS[event.type] || "text-zinc-400"} mr-1`}
              >
                [{TYPE_LABELS[event.type] || event.type.toUpperCase()}]
              </span>
              <span className="text-zinc-300">{event.message}</span>
            </div>
          ))
        )}
        <div className="animate-pulse text-accent">_</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}
