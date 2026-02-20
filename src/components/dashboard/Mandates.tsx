"use client";

import { useState, useEffect } from "react";
import { Task } from "@/types";
import { Plus, Dumbbell, Brain, Sparkles, Activity, ShieldCheck, ScanLine, Terminal, Trash2, ChevronDown, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logActivity } from "@/lib/activityLog";

export function Mandates() {
    const [tasks, setTasks] = useState<Task[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const saved = localStorage.getItem("switch_mandates");
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Error parsing mandates from localStorage:", e);
        }
        return [
            { id: "1", label: "Run 5km", completed: false, category: "physical", rationale: "Cardiovascular Optimization" },
            { id: "2", label: "Read 30 mins", completed: false, category: "intellectual", rationale: "Neural Plasticity Maintenance" },
            { id: "3", label: "Code 1 hour", completed: false, category: "intellectual", rationale: "Skill Acquisition: High Priority" },
            { id: "4", label: "Meditation", completed: false, category: "spiritual", rationale: "Cortisol Regulation" },
        ];
    });

    const [newTask, setNewTask] = useState("");
    const [activeCategory, setActiveCategory] = useState<Task["category"]>("physical");
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [pendingOpen, setPendingOpen] = useState(true);
    const [completedOpen, setCompletedOpen] = useState(true);
    const [mission, setMission] = useState<{ goal: string; timeframe: string; manifesto?: string } | null>(null);

    // Load mission from localStorage
    useEffect(() => {
        const loadMission = () => {
            try {
                const saved = localStorage.getItem("switch_mission");
                if (saved) setMission(JSON.parse(saved));
            } catch (e) {
                console.error("Error parsing mission from localStorage:", e);
            }
        };
        loadMission();
        const interval = setInterval(loadMission, 2000);
        return () => clearInterval(interval);
    }, []);

    // Persist tasks to localStorage
    useEffect(() => {
        localStorage.setItem("switch_mandates", JSON.stringify(tasks));
    }, [tasks]);

    const deleteTask = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) logActivity("mandate", `Directive removed: "${task.label}"`);
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const handleVerify = (id: string) => {
        setVerifyingId(id);
        setTimeout(() => {
            const task = tasks.find(t => t.id === id);
            if (task) logActivity("mandate", `"${task.label}" → VERIFIED`);
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
            setVerifyingId(null);
        }, 1500);
    };

    const addTask = () => {
        if (!newTask.trim()) return;
        const task: Task = {
            id: Date.now().toString(),
            label: newTask,
            completed: false,
            category: activeCategory,
            rationale: "User Override: Self-Imposed Directive",
        };
        setTasks([...tasks, task]);
        logActivity("mandate", `New directive added: "${newTask}" [${activeCategory}]`);
        setNewTask("");
    };

    const categories = [
        { id: "physical", icon: Dumbbell, label: "Physical Layer" },
        { id: "intellectual", icon: Brain, label: "Neural Layer" },
        { id: "spiritual", icon: Sparkles, label: "Abstract Layer" },
    ] as const;

    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-black/40 backdrop-blur-sm border border-white/5">
            {/* Background Grid - Tactical */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(212,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,255,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Header / AI HUD */}
            <div className="flex items-end justify-between border-b border-white/10 pb-4 mb-6 shrink-0 z-10 px-6 pt-6 bg-gradient-to-b from-black/50 to-transparent">
                <div className="space-y-1">
                    <div className="text-[10px] text-accent font-mono tracking-widest uppercase flex items-center gap-2">
                        <ScanLine className="w-3 h-3 animate-pulse" />
                        AI Overwatch :: Active
                    </div>
                    <div className="text-2xl font-display font-black text-white uppercase tracking-tighter flex items-center gap-2">
                        {activeCategory} DIRECTIVES
                    </div>
                </div>

                {/* Category tabs */}
                <div className="flex gap-1">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as Task["category"])}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider transition-all border ${activeCategory === cat.id
                                ? "border-accent/50 bg-accent/10 text-accent font-bold"
                                : "border-white/5 text-zinc-500 hover:text-white hover:border-white/20"
                                }`}
                        >
                            <cat.icon className="w-3 h-3" />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Active Goal Banner */}
            {mission?.goal && (
                <div className="mx-6 mb-4 p-4 border border-accent/20 bg-accent/5 relative overflow-hidden shrink-0 z-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
                    <div className="relative z-10 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] text-accent uppercase tracking-widest font-bold">
                                <Target className="w-4 h-4" />
                                Active Goal
                            </div>
                            {mission.timeframe && (
                                <span className="text-[10px] font-mono text-accent/70 bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                                    T-{mission.timeframe.toString().toUpperCase().replace(" DAYS", "D")}
                                </span>
                            )}
                        </div>
                        <div className="text-lg font-display font-black text-white uppercase tracking-tight leading-tight">
                            {mission.goal}
                        </div>
                        {mission.manifesto && (
                            <div className="text-[10px] text-zinc-400 font-mono leading-relaxed border-t border-white/5 pt-2 mt-1">
                                {mission.manifesto}
                            </div>
                        )}
                        <div className="text-[8px] text-zinc-600 uppercase tracking-widest font-mono pt-1">
                            ↳ These directives serve your goal
                        </div>
                    </div>
                </div>
            )}

            {/* Sector Integrity Bar */}
            {(() => {
                const filteredTasks = tasks.filter(t => t.category === activeCategory);
                const completedCount = filteredTasks.filter(t => t.completed).length;
                const totalCount = filteredTasks.length || 1;
                const percentage = Math.round((completedCount / totalCount) * 100);

                return (
                    <div className="mb-6 px-6 -mt-2">
                        <div className="flex justify-between text-[9px] uppercase tracking-widest text-zinc-500 mb-1">
                            <span>Sector Compliance</span>
                            <span className="text-accent font-mono">
                                {percentage}%
                            </span>
                        </div>
                        <div className="h-0.5 w-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full bg-accent box-glow transition-all duration-500 ease-out"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            })()}

            {/* Input - Command Line Style */}
            <div className="relative group mb-4 shrink-0 z-10 px-6">
                <div className="flex items-center gap-3 border-b border-white/10 focus-within:border-accent transition-colors pb-2">
                    <Terminal className="w-4 h-4 text-zinc-600 group-focus-within:text-accent" />
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTask()}
                        placeholder="INPUT_NEW_DIRECTIVE..."
                        className="w-full bg-transparent text-sm font-mono text-white placeholder:text-zinc-700 focus:outline-none uppercase tracking-wide"
                    />
                    <button
                        onClick={addTask}
                        className="text-zinc-600 hover:text-accent transition-colors opacity-0 group-focus-within:opacity-100"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Directives List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 z-10 custom-scrollbar">
                {/* Pending Section */}
                {tasks.filter(t => t.category === activeCategory && !t.completed).length > 0 && (
                    <div>
                        <button
                            onClick={() => setPendingOpen(!pendingOpen)}
                            className="w-full text-[9px] uppercase tracking-widest text-zinc-500 font-bold font-mono pt-2 pb-1 flex items-center gap-2 hover:text-white transition-colors"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                            Pending Directives ({tasks.filter(t => t.category === activeCategory && !t.completed).length})
                            <ChevronDown className={`w-3 h-3 ml-auto transition-transform duration-200 ${pendingOpen ? "" : "-rotate-90"}`} />
                        </button>
                        <AnimatePresence>
                            {pendingOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden space-y-2"
                                >
                                    {tasks.filter(t => t.category === activeCategory && !t.completed).map(task => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="group border-l-2 pl-4 py-2 transition-all relative overflow-hidden border-white/10 hover:border-white/30 hover:bg-white/5"
                                        >
                                            {verifyingId === task.id && (
                                                <motion.div
                                                    className="absolute inset-0 bg-accent/20 z-0"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 1.5, ease: "linear" }}
                                                />
                                            )}
                                            <div className="flex justify-between items-start relative z-10">
                                                <div className="space-y-1">
                                                    <div className="font-display text-sm uppercase tracking-wide text-white">
                                                        {task.label}
                                                    </div>
                                                    <div className="text-[9px] text-zinc-500 font-mono tracking-wider flex items-center gap-2">
                                                        <span className="text-accent/70">:: RATIONALE ::</span>
                                                        {task.rationale}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleVerify(task.id)}
                                                        disabled={verifyingId === task.id}
                                                        className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/50 px-3 py-1 transition-all disabled:opacity-50 disabled:cursor-wait"
                                                    >
                                                        {verifyingId === task.id ? "SCANNING..." : "VERIFY_COMPLIANCE"}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTask(task.id)}
                                                        className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                                        title="Delete mandate"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Completed Section */}
                {tasks.filter(t => t.category === activeCategory && t.completed).length > 0 && (
                    <div className="border-t border-white/5 mt-2">
                        <button
                            onClick={() => setCompletedOpen(!completedOpen)}
                            className="w-full text-[9px] uppercase tracking-widest text-zinc-500 font-bold font-mono pt-3 pb-1 flex items-center gap-2 hover:text-accent transition-colors"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                            Completed ({tasks.filter(t => t.category === activeCategory && t.completed).length})
                            <ChevronDown className={`w-3 h-3 ml-auto transition-transform duration-200 ${completedOpen ? "" : "-rotate-90"}`} />
                        </button>
                        <AnimatePresence>
                            {completedOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden space-y-2 mt-1"
                                >
                                    {tasks.filter(t => t.category === activeCategory && t.completed).map(task => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="group border-l-2 pl-4 py-2 transition-all relative overflow-hidden border-accent bg-accent/5 opacity-50"
                                        >
                                            <div className="flex justify-between items-start relative z-10">
                                                <div className="space-y-1">
                                                    <div className="font-display text-sm uppercase tracking-wide text-accent line-through opacity-70">
                                                        {task.label}
                                                    </div>
                                                    <div className="text-[9px] text-zinc-500 font-mono tracking-wider flex items-center gap-2">
                                                        <span className="text-accent/70">:: RATIONALE ::</span>
                                                        {task.rationale}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 text-[9px] text-accent uppercase tracking-widest font-bold border border-accent/20 px-2 py-1 bg-accent/10">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        Verified
                                                    </div>
                                                    <button
                                                        onClick={() => deleteTask(task.id)}
                                                        className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                                        title="Delete mandate"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {tasks.filter(t => t.category === activeCategory).length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-zinc-700 space-y-2 border border-dashed border-zinc-800/50 rounded">
                        <Activity className="w-6 h-6 opacity-20" />
                        <span className="text-[10px] uppercase tracking-widest font-mono">Awaiting Core Instructions</span>
                    </div>
                )}
            </div>
        </div>
    );
}
