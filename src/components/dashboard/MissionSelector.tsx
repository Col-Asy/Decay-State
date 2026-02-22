"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Calendar,
  ChevronRight,
  X,
  ShieldAlert,
  FileText,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { upsertActiveMission } from "@/lib/db/mission";
import { logActivity } from "@/lib/activityLog";

interface MissionSelectorProps {
  initialGoal: string;
  initialTimeframe?: string;
  initialManifesto?: string;
  onUpdate: (goal: string, timeframe: string) => void;
}

export function MissionSelector({
  initialGoal,
  initialTimeframe,
  initialManifesto,
  onUpdate,
}: MissionSelectorProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [goal, setGoal] = useState(initialGoal);
  const [timeframe, setTimeframe] = useState(initialTimeframe ?? "30 Days");
  const [manifesto, setManifesto] = useState(initialManifesto ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      await upsertActiveMission(user.id, { goal, manifesto, timeframe });
      logActivity("mission", `Objective updated: "${goal}"`, user.id);
      onUpdate(goal, timeframe);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setIsOpen(false);
    }
  };

  const quickDurations = ["7 Days", "30 Days", "90 Days", "6 Months"];

  return (
    <>
      {/* Trigger Button - Always Visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-right group hover:bg-white/5 p-2 -mr-2 rounded transition-all"
      >
        <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold group-hover:text-accent transition-colors flex items-center justify-end gap-2">
          My Goal
          <Target className="w-3 h-3" />
        </div>
        <div className="flex items-center justify-end gap-2 mt-1">
          <span className="text-[9px] font-mono text-accent/70 bg-accent/10 px-1 rounded">
            T-{timeframe.toUpperCase().replace(" DAYS", "D")}
          </span>
          <div className="text-xs font-mono text-white border-b border-white/20 group-hover:border-accent pb-0.5 max-w-[200px] truncate">
            {goal || "SET YOUR GOAL..."}
          </div>
        </div>
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 relative overflow-hidden flex flex-col shadow-2xl shadow-accent/5"
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-accent/5 blur-3xl rounded-full pointer-events-none" />

              {/* Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-start">
                <div>
                  <div className="text-accent text-[10px] tracking-[0.2em] uppercase font-bold flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    Configuration Mode
                  </div>
                  <h2 className="text-2xl font-display font-black text-white uppercase tracking-tighter">
                    Set Your Goal
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Goal Input */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                    <Target className="w-3 h-3" /> What do you want to achieve?
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="E.g. Launch SaaS MVP, Run Marathon..."
                    className="w-full bg-black/50 border border-white/10 py-3 px-4 text-sm font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent/50 transition-colors uppercase"
                  />
                </div>

                {/* Detailed Manifesto */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                    <FileText className="w-3 h-3" /> How will you get there?
                  </label>
                  <textarea
                    value={manifesto}
                    onChange={(e) => setManifesto(e.target.value)}
                    rows={3}
                    placeholder="Break it down — what specifically will you do each day/week?"
                    className="w-full bg-black/50 border border-white/10 p-4 text-xs font-mono text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                  />
                </div>

                {/* Timeframe Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                    <Clock className="w-3 h-3" /> How long do you need?
                  </label>

                  <input
                    type="text"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    placeholder="Enter duration or target date..."
                    className="w-full bg-black/50 border border-white/10 py-2 px-4 text-xs font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent/50 transition-colors mb-2"
                  />

                  <div className="flex gap-2 flex-wrap">
                    {quickDurations.map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setTimeframe(dur)}
                        className="text-[10px] uppercase font-bold border border-white/5 bg-white/5 px-2 py-1 hover:border-accent/30 hover:text-accent transition-colors text-zinc-500"
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-white text-black hover:bg-accent transition-colors px-6 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  Lock In
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
