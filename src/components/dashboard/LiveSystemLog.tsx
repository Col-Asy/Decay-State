"use client";

import { useEffect, useRef, useState } from "react";
import { getActivityLog, logActivity, ActivityEvent } from "@/lib/activityLog";

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

export function LiveSystemLog({ userName, integrity }: { userName: string, integrity: number }) {
    const [logs, setLogs] = useState<ActivityEvent[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevIntegrityRef = useRef(integrity);

    // Load real activity log and poll for updates
    useEffect(() => {
        const loadLogs = () => {
            const events = getActivityLog();
            setLogs(events);
        };
        loadLogs();

        // Log session start once per session
        if (!sessionStorage.getItem("switch_log_init")) {
            logActivity("system", "SESSION_INITIALIZED: Protocol Active");
            logActivity("system", `User '${userName}' authenticated`);
            sessionStorage.setItem("switch_log_init", "1");
            loadLogs();
        }

        const interval = setInterval(loadLogs, 2000);
        return () => clearInterval(interval);
    }, [userName]);

    // Track integrity changes
    useEffect(() => {
        if (prevIntegrityRef.current !== integrity) {
            const direction = integrity > prevIntegrityRef.current ? "↑" : "↓";
            logActivity("system", `Integrity ${direction} ${integrity}% (was ${prevIntegrityRef.current}%)`);
            prevIntegrityRef.current = integrity;
        }
    }, [integrity]);

    // Auto-scroll 
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };

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
                        <div key={event.id} className="animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="text-zinc-600 mr-1">[{formatTime(event.timestamp)}]</span>
                            <span className={`${TYPE_COLORS[event.type] || "text-zinc-400"} mr-1`}>
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
