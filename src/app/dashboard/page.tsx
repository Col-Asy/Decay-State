"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserState, Task } from "@/types";
import { auth } from "@/lib/auth";
import { FutureSelfImage } from "@/components/dashboard/FutureSelfImage";
import { LogOut, ShieldAlert, ListTodo, BookOpen, TrendingDown } from "lucide-react";
import { logActivity } from "@/lib/activityLog";
import { MissionSelector } from "@/components/dashboard/MissionSelector";
import { LiveSystemLog } from "@/components/dashboard/LiveSystemLog";
import { OpsSummary } from "@/components/dashboard/OpsSummary";
import { motion } from "framer-motion";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserState | null>(null);

  // Live Tasks from localStorage (synced with Mandates page)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journalCount, setJournalCount] = useState(0);

  const [time, setTime] = useState<string>("");

  const handleMissionUpdate = (goal: string, timeframe: string) => {
    if (user) {
      // In a real app, this would be an API call
      setUser({ ...user, goal });
    }
  };

  useEffect(() => {
    const currentUser = auth.getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    if (!sessionStorage.getItem("switch_cc_init")) {
      logActivity("system", "Command Center initialized");
      sessionStorage.setItem("switch_cc_init", "1");
    }

    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000 * 60);

    // Load live data from localStorage
    const loadLiveData = () => {
      const savedMandates = localStorage.getItem("switch_mandates");
      if (savedMandates) {
        setTasks(JSON.parse(savedMandates));
      } else {
        // Default mandates if none saved
        const defaults: Task[] = [
          { id: "1", label: "Run 5km", completed: false, category: "physical", rationale: "Cardiovascular Optimization" },
          { id: "2", label: "Read 30 mins", completed: false, category: "intellectual", rationale: "Neural Plasticity Maintenance" },
          { id: "3", label: "Code 1 hour", completed: false, category: "intellectual", rationale: "Skill Acquisition: High Priority" },
          { id: "4", label: "Meditation", completed: false, category: "spiritual", rationale: "Cortisol Regulation" },
        ];
        setTasks(defaults);
      }
      const savedJournal = localStorage.getItem("switch_journal");
      setJournalCount(savedJournal ? JSON.parse(savedJournal).length : 0);
    };
    loadLiveData();

    // Poll for changes (covers cross-tab and AI-driven updates)
    const dataSync = setInterval(loadLiveData, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(dataSync);
    };
  }, [router]);

  // Mandate-driven integrity: auto-calculated from completion rate
  const displayIntegrity = tasks.length > 0
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : 0;

  if (!user) return <div className="bg-[#050505] h-screen"></div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 h-screen flex flex-col overflow-hidden">
      {/* HUD Header */}
      <header className="flex justify-between items-center border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border border-white/10 flex items-center justify-center bg-white/5 relative group">
            <div className="absolute inset-0 bg-accent/20 animate-pulse" />
            <ShieldAlert className="w-6 h-6 text-accent relative z-10" />
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-white/50" />
            <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-white/50" />
            <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-white/50" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-white/50" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black tracking-tighter uppercase text-white leading-none">
              DECAYSTATE COMMAND
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-400 font-mono tracking-wider">
                OP_ID: {user.name}
              </span>
              <span className="text-[10px] text-accent font-mono tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                SYSTEM_ONLINE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <MissionSelector initialGoal={user.goal} onUpdate={handleMissionUpdate} />

          <div className="text-right">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Local Time</div>
            <div className="text-xl font-display font-black text-white tracking-widest">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid - Fixed Layout */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">

        {/* LEFT COL: Biometrics & Visuals (6 cols) - FIXED Container */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-6 h-full overflow-hidden">
          {/* Main Visualizer Container */}
          <div className="flex-1 border border-white/10 bg-[#0a0a0a] relative group overflow-hidden cyber-border flex flex-col">
            {/* Scanline Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20" />

            {/* HUD Elements */}
            <div className="absolute top-4 left-4 z-30 flex flex-col gap-1 pointer-events-none">
              <span className="text-[9px] text-accent font-mono tracking-widest flex items-center gap-2">
                VISUAL_FEED :: LIVE
              </span>
              <div className="flex gap-0.5">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className={`w-1 h-3 ${i < displayIntegrity / 5 ? "bg-accent" : "bg-white/10"}`} />
                ))}
              </div>
            </div>

            <div className="absolute top-4 right-4 z-30 text-right pointer-events-none">
              <span className="text-[9px] text-red-500 font-mono tracking-widest animate-pulse">DECAY_PROBABILITY</span>
              <div className="text-2xl font-display font-black text-white leading-none mt-1">
                {Math.max(0, 100 - displayIntegrity)}%
              </div>
            </div>

            {/* Central Image - Interactive */}
            <div className="absolute inset-0 flex items-center justify-center p-12 z-10">
              <FutureSelfImage integrity={displayIntegrity} imageUrl={user.image_url} />
            </div>

            {/* Interactive Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-30 flex flex-col gap-4 border-t border-white/5">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    Integrity Status
                    <span className={`text-[8px] border px-1 rounded ${displayIntegrity < 30 ? "text-red-500 border-red-500/50 animate-pulse" : "text-accent border-accent/50"}`}>
                      {displayIntegrity < 30 ? "CRITICAL" : "STABLE"}
                    </span>
                  </div>
                  <div className="text-3xl font-display font-black text-white tracking-tighter">
                    {displayIntegrity}%
                  </div>
                </div>
              </div>

              {/* Integrity Progress Bar - Auto from mandates */}
              <div className="pt-2">
                <div className="relative w-full h-2 bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-accent box-glow transition-all duration-700 ease-out"
                    style={{ width: `${displayIntegrity}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] text-zinc-600 font-mono">MANDATE_COMPLETION_RATE</span>
                  <span className="text-[8px] text-zinc-600 font-mono">{tasks.filter(t => t.completed).length}/{tasks.length} VERIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: Status & Controls (6 cols) - INDEPENDENT SCROLL/CONTAINER */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 h-full overflow-hidden">

          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-4 h-32 shrink-0">
            <div className="border border-white/10 bg-[#0a0a0a] p-4 flex flex-col justify-between hover:border-accent/50 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-accent/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Mandates</span>
                <ListTodo className="w-4 h-4 text-zinc-600 group-hover:text-accent transition-colors" />
              </div>
              <div className="relative z-10">
                <div className="text-3xl font-display font-black text-white group-hover:text-accent transition-colors">
                  {tasks.filter(t => !t.completed).length}
                </div>
                <div className="text-[9px] text-zinc-500 uppercase mt-1">Pending Execution</div>
              </div>
            </div>

            <div className="border border-white/10 bg-[#0a0a0a] p-4 flex flex-col justify-between hover:border-accent/50 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-accent/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Journal</span>
                <BookOpen className="w-4 h-4 text-zinc-600 group-hover:text-accent transition-colors" />
              </div>
              <div className="relative z-10">
                <div className="text-3xl font-display font-black text-white group-hover:text-accent transition-colors">
                  {journalCount}
                </div>
                <div className="text-[9px] text-zinc-500 uppercase mt-1">Entries Logged</div>
              </div>
            </div>
          </div>

          {/* System Terminal - LIVE */}
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0">
              <LiveSystemLog userName={user.name} integrity={displayIntegrity} />
            </div>
          </div>

          {/* Bottom Row - Compact Actions & Skill Summary */}
          <div className="h-32 shrink-0 grid grid-cols-2 gap-4">
            {/* Compact Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push('/dashboard/mandates')}
                className="flex-1 border border-white/10 bg-white/5 hover:bg-accent hover:text-black transition-all group flex items-center justify-between px-6 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 relative z-10">
                  <ListTodo className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Update Mandates</span>
                </div>
                <div className="w-1.5 h-1.5 bg-current rounded-full opacity-50" />
              </button>

              <button
                onClick={() => router.push('/dashboard/journal')}
                className="flex-1 border border-white/10 bg-white/5 hover:bg-white hover:text-black transition-all group flex items-center justify-between px-6 relative overflow-hidden"
              >
                <div className="flex items-center gap-3 relative z-10">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Log Protocol</span>
                </div>
                <div className="w-1.5 h-1.5 bg-current rounded-full opacity-50" />
              </button>
            </div>

            {/* Ops Summary Widget */}
            <OpsSummary />

          </div>

        </div>
      </div>
    </div>
  );
}
