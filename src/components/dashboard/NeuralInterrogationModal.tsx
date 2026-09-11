"use client";

import React, { useState } from "react";
import { ShieldAlert, CheckCircle2, Lock, Terminal, Loader2 } from "lucide-react";
import { Task } from "@/types";

interface NeuralInterrogationModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (taskId: string, verificationNote: string) => Promise<void>;
}

export function NeuralInterrogationModal({
  task,
  isOpen,
  onClose,
  onConfirm,
}: NeuralInterrogationModalProps) {
  const [verificationNote, setVerificationNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationNote.trim()) {
      setError("Verification input required. State concrete proof of execution.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(task.id, verificationNote.trim());
      setVerificationNote("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg border border-red-900/50 bg-[#070707] p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Scanline */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 animate-pulse" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-red-900/40 bg-red-950/30">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg uppercase tracking-wider text-white">
                Neural Interrogation
              </h3>
              <p className="text-[9px] font-mono text-red-400/80 uppercase tracking-widest">
                Verification Protocol Active :: Task #{task.id.slice(0, 6)}
              </p>
            </div>
          </div>
          <span className="text-[8px] font-mono border border-red-900/40 text-red-400 px-2 py-1 uppercase">
            Strict Mode
          </span>
        </div>

        {/* Question Prompt */}
        <div className="space-y-3 bg-red-950/10 border border-red-900/20 p-4">
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
            <Terminal className="w-3.5 h-3.5 text-red-500" />
            Mandate Under Audit:
          </div>
          <div className="text-sm font-bold font-display uppercase tracking-wide text-white">
            &quot;{task.label}&quot;
          </div>
          {task.rationale && (
            <p className="text-xs text-zinc-400 font-mono italic">
              Rationale: {task.rationale}
            </p>
          )}
          <p className="text-xs font-mono text-red-300/90 pt-2 border-t border-red-900/20 leading-relaxed">
            AI Agent Inquiry: State specifically what obstacle you overcame or what metric was achieved to complete this mandate. No generic claims.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Lock className="w-3 h-3 text-red-500" />
              Proof of Execution Context
            </label>
            <textarea
              value={verificationNote}
              onChange={(e) => setVerificationNote(e.target.value)}
              placeholder="e.g. Completed 45 mins of HIIT at 160bpm max HR; pushed 3 commits to feature branch..."
              rows={3}
              className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-red-500/80 transition-colors"
            />
          </div>

          {error && (
            <div className="text-xs font-mono text-red-400 border border-red-900/40 bg-red-950/30 p-2.5">
              ⚠️ {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white border border-transparent hover:border-white/10 transition-all"
            >
              Abort Completion
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-mono uppercase tracking-widest font-black bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auditing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit & Complete
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
