"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Task } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { FutureSelfImage } from "@/components/dashboard/FutureSelfImage";
import { LogOut, ShieldAlert, ListTodo, BookOpen, RefreshCw } from "lucide-react";
import { logActivity } from "@/lib/activityLog";
import { MissionSelector } from "@/components/dashboard/MissionSelector";
import { LiveSystemLog } from "@/components/dashboard/LiveSystemLog";
import { OpsSummary } from "@/components/dashboard/OpsSummary";
import { getMandates } from "@/lib/db/mandates";
import { getJournalEntries } from "@/lib/db/journal";
import { getActiveMission } from "@/lib/db/mission";
import { getSubscription } from "@/lib/db/subscriptions";
import type { Mission } from "@/lib/db/mission";
import type { Subscription } from "@/lib/db/subscriptions";
import { FutureSelfGallery } from "@/components/dashboard/FutureSelfGallery";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [journalCount, setJournalCount] = useState(0);
  const [mission, setMission] = useState<Mission | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load dashboard data from Supabase
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const [fetchedTasks, fetchedEntries, activeMission, sub] =
          await Promise.all([
            getMandates(user!.id),
            getJournalEntries(user!.id),
            getActiveMission(user!.id),
            getSubscription(user!.id),
          ]);
        setTasks(fetchedTasks);
        setJournalCount(fetchedEntries.length);
        setMission(activeMission);
        setSubscription(sub);

        if (!sessionStorage.getItem("switch_cc_init")) {
          logActivity("system", "Command Center initialized", user!.id);
          sessionStorage.setItem("switch_cc_init", "1");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleMissionUpdate = (goal: string, timeframe: string) => {
    if (mission) {
      setMission({ ...mission, goal, timeframe });
    }
  };

  const refreshMission = async () => {
    if (!user) return;
    const activeMission = await getActiveMission(user.id);
    setMission(activeMission);
  };

  const handleCardNavigation = (route: string) => {
    setNavigatingTo(route);
    setTimeout(() => {
      router.push(route);
    }, 500);
  };

  // Integrity = mandate completion rate
  const displayIntegrity =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.completed).length / tasks.length) * 100,
        )
      : 0;

  // Show loading state while auth is resolving
  if (authLoading || dataLoading) {
    return (
      <div className="bg-[#050505] h-screen flex items-center justify-center">
        <div className="text-accent/40 font-mono text-xs uppercase tracking-widest animate-pulse">
          Initializing Command Center...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userName =
    user.user_metadata?.name ?? user.email?.split("@")[0] ?? "OPERATIVE";
  const avatarUrl = user.user_metadata?.avatar_url ?? null;
  const currentGoal = mission?.goal ?? "No active mission";

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 h-screen flex flex-col overflow-hidden">
      {/* HUD Header */}
      <header className="flex justify-between items-center border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border border-white/10 flex items-center justify-center bg-white/5 relative group">
            <div className="absolute inset-0 bg-accent/20 animate-pulse" />
            <ShieldAlert className="w-6 h-6 text-accent relative z-10" />
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
                OP_ID: {userName}
              </span>
              <span className="text-[10px] text-accent font-mono tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                SYSTEM_ONLINE
              </span>
              {subscription && (
                <span className="text-[9px] border border-accent/30 px-1.5 py-0.5 text-accent/70 uppercase tracking-widest">
                  {subscription.tier}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <MissionSelector
            initialGoal={currentGoal}
            initialTimeframe={mission?.timeframe}
            initialManifesto={mission?.manifesto ?? undefined}
            onUpdate={handleMissionUpdate}
          />

          <div className="text-right">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
              Local Time
            </div>
            <div className="text-xl font-display font-black text-white tracking-widest">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="border border-white/10 p-2 hover:border-red-500/40 hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* LEFT COL: Biometrics & Visuals (6 cols) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-6 h-full overflow-hidden">
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
                  <div
                    key={i}
                    className={`w-1 h-3 ${i < displayIntegrity / 5 ? "bg-accent" : "bg-white/10"}`}
                  />
                ))}
              </div>
            </div>

            <div className="absolute top-4 right-4 z-30 text-right pointer-events-none">
              <span className="text-[9px] text-red-500 font-mono tracking-widest animate-pulse">
                DECAY_PROBABILITY
              </span>
              <div className="text-2xl font-display font-black text-white leading-none mt-1">
                {Math.max(0, 100 - displayIntegrity)}%
              </div>
            </div>

            {/* Central Image */}
            <div className="absolute inset-0 flex items-center justify-center p-12 z-10">
              <FutureSelfImage
                integrity={displayIntegrity}
                imageUrl={mission?.image_url ?? avatarUrl}
              />
            </div>

            {/* Projections Gallery Button */}
            {mission?.id && (
              <button
                onClick={() => setGalleryOpen(true)}
                className="absolute top-14 left-4 z-30 text-[9px] text-zinc-500 hover:text-accent font-mono tracking-widest uppercase border border-white/10 hover:border-accent/30 px-2 py-1 bg-black/50 backdrop-blur-sm transition-all flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Projections
              </button>
            )}

            {/* Integrity Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-30 flex flex-col gap-4 border-t border-white/5">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    Integrity Status
                    <span
                      className={`text-[8px] border px-1 rounded ${displayIntegrity < 30 ? "text-red-500 border-red-500/50 animate-pulse" : "text-accent border-accent/50"}`}
                    >
                      {displayIntegrity < 30 ? "CRITICAL" : "STABLE"}
                    </span>
                  </div>
                  <div className="text-3xl font-display font-black text-white tracking-tighter">
                    {displayIntegrity}%
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <div className="relative w-full h-2 bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-accent box-glow transition-all duration-700 ease-out"
                    style={{ width: `${displayIntegrity}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] text-zinc-600 font-mono">
                    MANDATE_COMPLETION_RATE
                  </span>
                  <span className="text-[8px] text-zinc-600 font-mono">
                    {tasks.filter((t) => t.completed).length}/{tasks.length}{" "}
                    VERIFIED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: Status & Controls (6 cols) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 h-full overflow-hidden">
          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-4 h-32 shrink-0">
            <button
              onClick={() => handleCardNavigation("/dashboard/mandates")}
              disabled={!!navigatingTo}
              className="border border-white/10 bg-[#0a0a0a] p-4 flex flex-col justify-between hover:border-accent/50 transition-colors group relative overflow-hidden text-left"
            >
              <div className="absolute inset-0 bg-accent/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              <div className="flex justify-between items-start relative z-10 w-full">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
                  Mandates
                </span>
                <ListTodo className="w-4 h-4 text-zinc-600 group-hover:text-accent transition-colors" />
              </div>
              <div className="relative z-10 w-full">
                {navigatingTo === "/dashboard/mandates" ? (
                  <div className="h-[36px] flex items-center">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="text-3xl font-display font-black text-white group-hover:text-accent transition-colors">
                    {tasks.filter((t) => !t.completed).length}
                  </div>
                )}
                <div className="text-[9px] text-zinc-500 uppercase mt-1">
                  Pending Execution
                </div>
              </div>
            </button>

            <button
              onClick={() => handleCardNavigation("/dashboard/journal")}
              disabled={!!navigatingTo}
              className="border border-white/10 bg-[#0a0a0a] p-4 flex flex-col justify-between hover:border-accent/50 transition-colors group relative overflow-hidden text-left"
            >
              <div className="absolute inset-0 bg-accent/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              <div className="flex justify-between items-start relative z-10 w-full">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
                  Journal
                </span>
                <BookOpen className="w-4 h-4 text-zinc-600 group-hover:text-accent transition-colors" />
              </div>
              <div className="relative z-10 w-full">
                {navigatingTo === "/dashboard/journal" ? (
                  <div className="h-[36px] flex items-center">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="text-3xl font-display font-black text-white group-hover:text-accent transition-colors">
                    {journalCount}
                  </div>
                )}
                <div className="text-[9px] text-zinc-500 uppercase mt-1">
                  Entries Logged
                </div>
              </div>
            </button>
          </div>

          {/* System Terminal - LIVE */}
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0">
              <LiveSystemLog userName={userName} integrity={displayIntegrity} />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="h-32 shrink-0 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push("/dashboard/mandates")}
                className="flex-1 border border-white/10 bg-white/5 hover:bg-accent hover:text-black transition-all group flex items-center justify-between px-6 relative overflow-hidden"
              >
                <div className="flex items-center gap-3 relative z-10">
                  <ListTodo className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">
                    Update Mandates
                  </span>
                </div>
                <div className="w-1.5 h-1.5 bg-current rounded-full opacity-50" />
              </button>

              <button
                onClick={() => router.push("/dashboard/journal")}
                className="flex-1 border border-white/10 bg-white/5 hover:bg-white hover:text-black transition-all group flex items-center justify-between px-6 relative overflow-hidden"
              >
                <div className="flex items-center gap-3 relative z-10">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">
                    Log Protocol
                  </span>
                </div>
                <div className="w-1.5 h-1.5 bg-current rounded-full opacity-50" />
              </button>
            </div>

            <OpsSummary />
          </div>
        </div>
      </div>

      {/* Projections Gallery Modal */}
      {mission?.id && (
        <FutureSelfGallery
          missionId={mission.id}
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          onImageChange={() => {
            setGalleryOpen(false);
            refreshMission();
          }}
        />
      )}
    </div>
  );
}
