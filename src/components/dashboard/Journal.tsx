"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { logActivity } from "@/lib/activityLog";

interface LogEntry {
    id: string;
    date: string;
    wins: string;
    failures: string;
    adjustments: string;
}

export function Journal() {
    const [entries, setEntries] = useState<LogEntry[]>(() => {
        if (typeof window === "undefined") return [];
        const saved = localStorage.getItem("switch_journal");
        return saved ? JSON.parse(saved) : [];
    });
    const [wins, setWins] = useState("");
    const [failures, setFailures] = useState("");
    const [adjustments, setAdjustments] = useState("");

    const [isSaving, setIsSaving] = useState(false);

    // Persist journal to localStorage
    useEffect(() => {
        localStorage.setItem("switch_journal", JSON.stringify(entries));
    }, [entries]);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            const newEntry: LogEntry = {
                id: Date.now().toString(),
                date: new Date().toLocaleDateString(),
                wins,
                failures,
                adjustments
            };
            setEntries([newEntry, ...entries]);
            logActivity("journal", `Entry logged — ${wins ? "wins recorded" : "no wins"}, ${failures ? "failures noted" : "no failures"}`);
            setWins("");
            setFailures("");
            setAdjustments("");
            setIsSaving(false);
        }, 1500); // Fake encryption delay
    };

    return (
        <div className="grid lg:grid-cols-2 gap-12 h-full">
            {/* Entry Form - Terminal Input */}
            <div className="flex flex-col gap-6 h-full relative">
                {isSaving && (
                    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center flex-col cyber-border">
                        <div className="w-16 h-16 border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4" />
                        <div className="text-accent font-mono animate-pulse uppercase tracking-widest text-xs">Encrypting Data Packets...</div>
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 border-b border-white/10 pb-2">
                    <span className="animate-pulse text-accent">●</span>
                    New Entry Log
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                    <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-green-500 font-bold block bg-green-500/10 inline-block px-2 py-1 rounded border border-green-500/20">
                            Critical Wins [SUCCESS]
                        </label>
                        <textarea
                            value={wins}
                            onChange={(e) => setWins(e.target.value)}
                            className="w-full bg-black border border-white/10 p-4 text-sm font-mono h-32 focus:outline-none focus:border-green-500/50 resize-none text-zinc-300 placeholder:text-zinc-800"
                            placeholder="> LOG_OPTIMAL_EXECUTION..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-red-500 font-bold block bg-red-500/10 inline-block px-2 py-1 rounded border border-red-500/20">
                            Protocol Failures [ERROR]
                        </label>
                        <textarea
                            value={failures}
                            onChange={(e) => setFailures(e.target.value)}
                            className="w-full bg-black border border-white/10 p-4 text-sm font-mono h-32 focus:outline-none focus:border-red-500/50 resize-none text-zinc-300 placeholder:text-zinc-800"
                            placeholder="> LOG_SYSTEM_DEVIATION..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-accent font-bold block bg-accent/10 inline-block px-2 py-1 rounded border border-accent/20">
                            Tactical Adjustments [PATCH]
                        </label>
                        <textarea
                            value={adjustments}
                            onChange={(e) => setAdjustments(e.target.value)}
                            className="w-full bg-black border border-white/10 p-4 text-sm font-mono h-32 focus:outline-none focus:border-accent/50 resize-none text-zinc-300 placeholder:text-zinc-800"
                            placeholder="> LOG_CORRECTIVE_ACTION..."
                        />
                    </div>
                </div>

                {/* Hold to Commit Button */}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="relative group h-16 w-full overflow-hidden border border-white/10 bg-black hover:border-accent/50 transition-all"
                >
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]" />

                    <div className="absolute inset-0 flex items-center justify-center gap-3 relative z-10">
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                <span className="text-accent font-bold tracking-widest uppercase text-sm">Encrypting...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 text-zinc-400 group-hover:text-accent transition-colors" />
                                <span className="font-bold tracking-[0.2em] text-zinc-300 group-hover:text-white transition-colors uppercase text-sm">
                                    INITIATE_UPLOAD
                                </span>
                            </>
                        )}
                    </div>

                    {/* Hover Fill Effect */}
                    <div className="absolute inset-0 bg-accent/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />

                    {/* Bottom Progress Line */}
                    <div className="absolute bottom-0 left-0 h-1 bg-accent w-0 group-hover:w-full transition-all duration-700 ease-in-out" />
                </button>
            </div>

            {/* History - Timeline View */}
            <div className="flex flex-col gap-6 h-full border-l border-white/5 pl-12 relative">
                <div className="absolute left-[24px] top-12 bottom-0 w-[1px] bg-white/10" /> {/* Timeline line */}

                <div className="flex items-center justify-between text-xs uppercase tracking-widest text-zinc-500 border-b border-white/10 pb-2">
                    <span>Archive_DB :: READ_ONLY</span>
                    <span className="font-mono">{entries.length} RECORDS</span>
                </div>

                <div className="space-y-8 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 py-4">
                    {entries.length === 0 && (
                        <div className="text-zinc-800 text-xs font-mono border border-dashed border-white/5 p-12 text-center uppercase tracking-widest bg-black/50">
                            [NO_DATA_FOUND]
                            <br />
                            Initializing new archive protocol...
                        </div>
                    )}
                    {entries.map((entry, i) => (
                        <div key={entry.id} className="relative pl-8 group">
                            {/* Timeline Node */}
                            <div className="absolute -left-[30px] top-4 w-3 h-3 bg-black border border-white/20 rounded-full group-hover:border-accent group-hover:bg-accent group-hover:scale-125 transition-all z-10" />

                            <div className="p-6 border border-white/10 bg-black/50 space-y-4 hover:border-white/20 transition-colors relative group cyber-border">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 group-hover:bg-accent transition-colors" />
                                <div className="flex justify-between items-start">
                                    <div className="text-xs font-mono text-accent bg-accent/5 px-2 py-1 border border-accent/20">
                                        LOG_ID: {entry.id.slice(-6)}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-mono">
                                        {entry.date}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 pt-2">
                                    {entry.wins && (
                                        <div className="space-y-1">
                                            <div className="text-[9px] uppercase text-green-500/70 font-bold tracking-wider">&gt;&gt; Wins</div>
                                            <p className="text-sm text-zinc-400 font-mono pl-2 border-l border-white/10">{entry.wins}</p>
                                        </div>
                                    )}
                                    {entry.failures && (
                                        <div className="space-y-1">
                                            <div className="text-[9px] uppercase text-red-500/70 font-bold tracking-wider">&gt;&gt; Failures</div>
                                            <p className="text-sm text-zinc-400 font-mono pl-2 border-l border-white/10">{entry.failures}</p>
                                        </div>
                                    )}
                                    {entry.adjustments && (
                                        <div className="space-y-1">
                                            <div className="text-[9px] uppercase text-accent/70 font-bold tracking-wider">&gt;&gt; Adjustments</div>
                                            <p className="text-sm text-zinc-400 font-mono pl-2 border-l border-white/10">{entry.adjustments}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
