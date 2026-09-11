"use client";

import { useState, useEffect, useRef } from "react";
import { Task } from "@/types";
import {
  Plus,
  Dumbbell,
  Brain,
  Sparkles,
  Activity,
  ShieldCheck,
  ScanLine,
  Terminal,
  Trash2,
  ChevronDown,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logActivity } from "@/lib/activityLog";
import { useAuth } from "@/context/AuthContext";
import {
  getMandates,
  addMandate,
  updateMandate,
  deleteMandate,
  completeMandate,
} from "@/lib/db/mandates";
import { getActiveMission } from "@/lib/db/mission";
import { shouldGenerateDailyMandates } from "@/lib/db/daily-generation";
import { useToast } from "@/components/ui/CyberToast";
import type { Mission } from "@/lib/db/mission";
import { NeuralInterrogationModal } from "@/components/dashboard/NeuralInterrogationModal";

export function Mandates() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [mission, setMission] = useState<Mission | null>(null);
  const [newTask, setNewTask] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<Task["category"]>("physical");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(true);

  const generatingRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const [fetchedTasks, activeMission] = await Promise.all([
          getMandates(user!.id),
          getActiveMission(user!.id),
        ]);
        setTasks(fetchedTasks);
        setMission(activeMission);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    // Load data then check daily generation sequentially
    load().then(async () => {
      if (generatingRef.current) return;
      generatingRef.current = true;
      try {
        const shouldGenerate = await shouldGenerateDailyMandates(user!.id);
        if (!shouldGenerate) return;

        const res = await fetch("/api/mandates/generate", {
          method: "POST",
        });
        const data = await res.json();

        if (data.generated && data.mandates?.length > 0) {
          const refreshed = await getMandates(user!.id);
          setTasks(refreshed);
          showToast(`${data.mandates.length} new daily mandates generated`);
        }
      } catch (e) {
        console.error("Daily mandate generation failed:", e);
      }
    });

    // Re-fetch when Neural Link AI modifies data
    const handleDataChange = () => { load(); };
    window.addEventListener("neural-link-data-change", handleDataChange);
    return () => window.removeEventListener("neural-link-data-change", handleDataChange);
  }, [user]);

  const deleteTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task)
      logActivity("mandate", `Task removed: "${task.label}"`, user?.id);
    await deleteMandate(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const [interrogatingTask, setInterrogatingTask] = useState<Task | null>(null);

  const handleVerify = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setInterrogatingTask(task);
    }
  };

  const handleInterrogationConfirm = async (taskId: string, verificationNote: string) => {
    setVerifyingId(taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      logActivity("mandate", `"${task.label}" → COMPLETED [Verified: ${verificationNote.slice(0, 30)}...]`, user?.id);
    }
    await completeMandate(taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
    setVerifyingId(null);
    showToast("[MANDATE VERIFIED & COMPLETED]");
  };

  const addTask = async () => {
    if (!newTask.trim() || !user) return;
    const task = await addMandate(
      user.id,
      {
        label: newTask.trim(),
        category: activeCategory,
        rationale: "User Created Task",
        completed: false,
      },
      mission?.id ?? undefined,
    );
    setTasks((prev) => [...prev, task]);
    logActivity(
      "mandate",
      `New task added: "${newTask}" [${activeCategory}]`,
      user.id,
    );
    setNewTask("");
  };

  const categories = [
    { id: "physical", icon: Dumbbell, label: "Physical" },
    { id: "intellectual", icon: Brain, label: "Neural" },
    { id: "spiritual", icon: Sparkles, label: "Abstract" },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/30 font-mono text-xs tracking-widest uppercase animate-pulse">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-black/40 backdrop-blur-sm border border-white/5">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,255,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Header / AI HUD */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4 mb-6 shrink-0 z-10 px-4 sm:px-6 pt-4 sm:pt-6 bg-gradient-to-b from-black/50 to-transparent">
        <div className="space-y-1">
          <div className="text-[10px] text-accent font-mono tracking-widest uppercase flex items-center gap-2">
            <ScanLine className="w-3 h-3 animate-pulse" />
            AI Overwatch :: Active
          </div>
          <div className="text-2xl font-display font-black text-white uppercase tracking-tighter flex items-center gap-2">
            {categories.find((c) => c.id === activeCategory)?.label} Tasks
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as Task["category"])}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider transition-all border ${
                activeCategory === cat.id
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
        <div className="mx-4 sm:mx-6 mb-4 p-4 border border-accent/20 bg-accent/5 relative overflow-hidden shrink-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-accent uppercase tracking-widest font-bold">
                <Target className="w-4 h-4" />
                Active Goal
              </div>
              {mission.timeframe && (
                <span className="text-[10px] font-mono text-accent/70 bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  T-
                  {mission.timeframe
                    .toString()
                    .toUpperCase()
                    .replace(" DAYS", "D")}
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
              ↳ These tasks serve your goal
            </div>
          </div>
        </div>
      )}

      {/* Sector Integrity Bar */}
      {(() => {
        const filteredTasks = tasks.filter(
          (t) => t.category === activeCategory,
        );
        const completedCount = filteredTasks.filter((t) => t.completed).length;
        const totalCount = filteredTasks.length || 1;
        const percentage = Math.round((completedCount / totalCount) * 100);
        return (
          <div className="mb-6 px-4 sm:px-6 -mt-2">
            <div className="flex justify-between text-[9px] uppercase tracking-widest text-zinc-500 mb-1">
              <span>Sector Progress</span>
              <span className="text-accent font-mono">{percentage}%</span>
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
      <div className="relative group mb-4 shrink-0 z-10 px-4 sm:px-6">
        <div className="flex items-center gap-3 border-b border-white/10 focus-within:border-accent transition-colors pb-2">
          <Terminal className="w-4 h-4 text-zinc-600 group-focus-within:text-accent shrink-0" />
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="ADD NEW TASK..."
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
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 space-y-2 z-10 custom-scrollbar">
        {/* Pending Section */}
        {tasks.filter((t) => t.category === activeCategory && !t.completed)
          .length > 0 && (
          <div>
            <button
              onClick={() => setPendingOpen(!pendingOpen)}
              className="w-full text-[9px] uppercase tracking-widest text-zinc-500 font-bold font-mono pt-2 pb-1 flex items-center gap-2 hover:text-white transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
              Pending Tasks (
              {
                tasks.filter(
                  (t) => t.category === activeCategory && !t.completed,
                ).length
              }
              )
              <ChevronDown
                className={`w-3 h-3 ml-auto transition-transform duration-200 ${pendingOpen ? "" : "-rotate-90"}`}
              />
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
                  {tasks
                    .filter(
                      (t) => t.category === activeCategory && !t.completed,
                    )
                    .map((task) => (
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
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
                          <div className="space-y-1">
                            <div className="font-display text-sm uppercase tracking-wide text-white">
                              {task.label}
                            </div>
                            {task.rationale && (
                              <div className="text-[9px] text-zinc-500 font-mono tracking-wider leading-relaxed">
                                <span className="text-accent/70 mr-1.5 font-bold">
                                  :: WHY ::
                                </span>
                                {task.rationale}
                              </div>
                            )}
                          </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                              <button
                                onClick={() => handleVerify(task.id)}
                                disabled={verifyingId === task.id}
                                className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/50 px-3 py-1 transition-all disabled:opacity-50 disabled:cursor-wait"
                              >
                                {verifyingId === task.id
                                  ? "COMPLETING..."
                                  : "COMPLETE"}
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-zinc-500 hover:text-red-500 transition-colors opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1"
                                title="Delete task"
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
        {tasks.filter((t) => t.category === activeCategory && t.completed)
          .length > 0 && (
          <div className="border-t border-white/5 mt-2">
            <button
              onClick={() => setCompletedOpen(!completedOpen)}
              className="w-full text-[9px] uppercase tracking-widest text-zinc-500 font-bold font-mono pt-3 pb-1 flex items-center gap-2 hover:text-accent transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent/50" />
              Completed (
              {
                tasks.filter(
                  (t) => t.category === activeCategory && t.completed,
                ).length
              }
              )
              <ChevronDown
                className={`w-3 h-3 ml-auto transition-transform duration-200 ${completedOpen ? "" : "-rotate-90"}`}
              />
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
                  {tasks
                    .filter((t) => t.category === activeCategory && t.completed)
                    .map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="group border-l-2 pl-4 py-2 transition-all relative overflow-hidden border-accent bg-accent/5 opacity-50"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
                          <div className="space-y-1">
                            <div className="font-display text-sm uppercase tracking-wide text-accent line-through opacity-70">
                              {task.label}
                            </div>
                            {task.rationale && (
                              <div className="text-[9px] text-zinc-500 font-mono tracking-wider leading-relaxed">
                                <span className="text-accent/70 mr-1.5 font-bold">
                                  :: WHY ::
                                </span>
                                {task.rationale}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-1.5 text-[9px] text-accent uppercase tracking-widest font-bold border border-accent/20 px-2 py-1 bg-accent/10">
                              <ShieldCheck className="w-3 h-3" />
                              Completed
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-zinc-500 hover:text-red-500 transition-colors opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1"
                              title="Delete task"
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

        {tasks.filter((t) => t.category === activeCategory).length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center text-zinc-700 space-y-2 border border-dashed border-zinc-800/50 rounded">
            <Activity className="w-6 h-6 opacity-20" />
            <span className="text-[10px] uppercase tracking-widest font-mono">
              Awaiting Core Instructions
            </span>
          </div>
        )}
      </div>

      {/* Neural Interrogation Modal */}
      <NeuralInterrogationModal
        task={interrogatingTask}
        isOpen={!!interrogatingTask}
        onClose={() => setInterrogatingTask(null)}
        onConfirm={handleInterrogationConfirm}
      />
    </div>
  );
}
