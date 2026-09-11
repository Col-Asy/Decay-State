"use client";

import React, { useState } from "react";
import { AlertCircle, Search, ShieldAlert, Loader2 } from "lucide-react";

interface AntiDelusionSpotterProps {
  userId: string;
  currentFailure: string;
}

export function AntiDelusionSpotter({ userId, currentFailure }: AntiDelusionSpotterProps) {
  const [scanning, setScanning] = useState(false);
  const [patternFound, setPatternFound] = useState<{
    count: number;
    similarEntries: string[];
    callout: string;
  } | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  const handleScanPattern = async () => {
    if (!currentFailure.trim()) return;
    try {
      setScanning(true);
      const res = await fetch("/api/rag/detect-pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, failureText: currentFailure }),
      });

      if (res.ok) {
        const data = await res.json();
        setPatternFound(data);
      }
    } catch (e) {
      console.error("Anti-delusion scan error:", e);
    } finally {
      setScanning(false);
      setHasScanned(true);
    }
  };

  if (!currentFailure.trim()) return null;

  return (
    <div className="mt-2 space-y-2">
      {!hasScanned && (
        <button
          type="button"
          onClick={handleScanPattern}
          disabled={scanning}
          className="text-[10px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-900/40 bg-red-950/20 px-3 py-1.5 flex items-center gap-2 transition-colors"
        >
          {scanning ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Scanning RAG Vault for Recurrent Excuses...
            </>
          ) : (
            <>
              <Search className="w-3 h-3" />
              Scan Excuses vs Historical Journal Memory
            </>
          )}
        </button>
      )}

      {hasScanned && patternFound && patternFound.count > 1 && (
        <div className="border border-red-600/60 bg-red-950/80 p-3 text-red-100 space-y-2 text-xs font-mono">
          <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-red-400">
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
            <span>Anti-Delusion Pattern Spotter Callout</span>
          </div>
          <p className="leading-relaxed text-red-200/90">
            ⚠️ <strong>{patternFound.callout}</strong>
          </p>
          <div className="text-[10px] text-red-300/60 uppercase">
            RAG Memory Vector Match Count: {patternFound.count} past instances found.
          </div>
        </div>
      )}

      {hasScanned && (!patternFound || patternFound.count <= 1) && (
        <div className="text-[10px] font-mono text-zinc-500 border border-white/10 bg-black/40 p-2">
          ✓ No recurrent excuse pattern detected in historical memory.
        </div>
      )}
    </div>
  );
}
