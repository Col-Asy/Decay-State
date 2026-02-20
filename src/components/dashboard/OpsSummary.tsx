"use client";

import { useEffect, useState } from "react";
import { Task } from "@/types";
import { Dumbbell, Brain, Sparkles, Zap, TrendingUp } from "lucide-react";
import { getActivityLog } from "@/lib/activityLog";

const CATEGORIES = [
    { id: "physical", label: "PHYS", full: "Physical", icon: Dumbbell },
    { id: "intellectual", label: "NEUR", full: "Neural", icon: Brain },
    { id: "spiritual", label: "ABST", full: "Abstract", icon: Sparkles },
] as const;

export function OpsSummary() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [todayEvents, setTodayEvents] = useState(0);

    useEffect(() => {
        const load = () => {
            const saved = localStorage.getItem("switch_mandates");
            if (saved) setTasks(JSON.parse(saved));

            const events = getActivityLog();
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            setTodayEvents(events.filter(e => e.timestamp >= todayStart.getTime()).length);
        };
        load();
        const interval = setInterval(load, 3000);
        return () => clearInterval(interval);
    }, []);

    const getStats = (catId: string) => {
        const all = tasks.filter(t => t.category === catId);
        const done = all.filter(t => t.completed).length;
        return { done, total: all.length, pct: all.length > 0 ? Math.round((done / all.length) * 100) : 0 };
    };

    const totalDone = tasks.filter(t => t.completed).length;
    const totalAll = tasks.length;
    const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

    return (
        <div className="border border-white/10 bg-[#0a0a0a] p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-accent/30 transition-colors">
            {/* Subtle glow on hover */}
            <div className="absolute inset-0 bg-accent/3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Header row */}
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Sector Analysis</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-zinc-600 font-mono">
                    <TrendingUp className="w-3 h-3" />
                    {todayEvents} ops today
                </div>
            </div>

            {/* Category cards row */}
            <div className="grid grid-cols-3 gap-2 relative z-10">
                {CATEGORIES.map(cat => {
                    const stats = getStats(cat.id);
                    const Icon = cat.icon;
                    return (
                        <div
                            key={cat.id}
                            className="border border-white/5 bg-white/[0.02] p-3 flex flex-col gap-2 rounded-sm"
                        >
                            <div className="flex items-center justify-between">
                                <Icon className="w-3.5 h-3.5 text-white/60" />
                                <span className={`text-[9px] font-mono font-bold ${stats.pct === 100 ? "text-accent" : "text-white/70"}`}>
                                    {stats.pct}%
                                </span>
                            </div>
                            {/* Mini bar */}
                            <div className="h-1 w-full bg-white/5 overflow-hidden rounded-full">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${stats.pct === 100 ? "bg-accent" : "bg-white/40"}`}
                                    style={{
                                        width: `${stats.pct}%`,
                                        opacity: stats.pct > 0 ? 1 : 0,
                                    }}
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">{cat.label}</span>
                                <span className="text-[8px] font-mono text-zinc-600">{stats.done}/{stats.total}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Overall bar */}
            <div className="relative z-10 border-t border-white/5 pt-3 space-y-1.5">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Overall Compliance</span>
                    <span className={`text-base font-display font-black tracking-tight ${overallPct === 100 ? "text-accent" : "text-white"}`}>
                        {overallPct}%
                    </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 overflow-hidden rounded-full">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${overallPct === 100 ? "bg-accent box-glow" : "bg-white/50"}`}
                        style={{ width: `${overallPct}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
