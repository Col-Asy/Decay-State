"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Terminal, Zap, Lock } from "lucide-react";
import Link from "next/link";

const SLOT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*";

function useSlotMachine(target: string, active: boolean) {
  const [display, setDisplay] = useState(target);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) { setDisplay(target); return; }
    let iter = 0;
    const maxIter = target.length * 3;
    intervalRef.current = setInterval(() => {
      setDisplay(
        target
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < Math.floor(iter / 3)) return char;
            return SLOT_CHARS[Math.floor(Math.random() * SLOT_CHARS.length)];
          })
          .join("")
      );
      iter++;
      if (iter > maxIter) {
        clearInterval(intervalRef.current!);
        setDisplay(target);
      }
    }, 40);
    return () => clearInterval(intervalRef.current!);
  }, [active, target]);

  return display;
}



const tiers = [
  { id: "01", name: "DECAY OBSERVER", desc: "Basic access. Watch others execute." },
  { id: "02", name: "PROTOCOL RUNNER", desc: "Full dashboard. AI accountability engine." },
  { id: "03", name: "ARCHITECT", desc: "Early alpha. Direct line to founders." },
];

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTier, setSelectedTier] = useState("02");
  const [slotActive, setSlotActive] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  const headlineDisplay = useSlotMachine("ACCESS PENDING", slotActive);

  useEffect(() => {
    setSlotActive(true);
    const p = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
    }));
    setParticles(p);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Communication ID required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid communication channel format.");
      return;
    }
    setLoading(true);
    setError("");
    // Simulate submission (replace with actual API call)
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center relative overflow-hidden p-4 font-mono">

      {/* Animated Grid Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,255,0,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:6px_6px]" />
      </div>

      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#d4ff00] blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#d4ff00] blur-[100px]"
        />
      </div>

      {/* Floating Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-[2px] h-[2px] bg-[#d4ff00] rounded-full pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [-20, 20, -20], opacity: [0, 1, 0] }}
          transition={{ duration: 3 + p.delay, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 text-white/40 hover:text-[#d4ff00] transition-colors flex items-center gap-2 text-[10px] tracking-widest uppercase z-20 group"
      >
        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
        Return to Surface
      </Link>

      {/* Dev Access — Invisible ghost link, bottom-right */}
      <Link
        href="/sys-access"
        className="absolute bottom-6 right-6 text-white/5 hover:text-white/10 transition-colors text-[8px] tracking-[0.3em] uppercase z-20 select-none"
        tabIndex={-1}
        aria-hidden="true"
      >
        ·
      </Link>

      <div className="w-full max-w-2xl relative z-10">

        {/* Top Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 text-[9px] uppercase tracking-[0.3em] text-white/30"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3 h-3 text-[#d4ff00]" />
            <span>SYS: WAITLIST_PROTOCOL</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d4ff00] animate-pulse" />
            <span>QUEUE OPEN</span>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative border border-white/10 bg-[#030303] overflow-hidden"
        >
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#d4ff00]/40" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#d4ff00]/40" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#d4ff00]/10" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#d4ff00]/10" />

          {/* Horizontal scan line animation */}
          <motion.div
            className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#d4ff00]/30 to-transparent pointer-events-none z-0"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          <div className="p-8 md:p-12 relative z-10">

            {/* Headline */}
            <div className="mb-8">
              <div className="text-[#d4ff00] text-[9px] tracking-[0.4em] uppercase mb-3 font-mono">
                {headlineDisplay}
              </div>
              <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-tighter leading-[0.9] mb-4">
                <span className="text-white">Join the</span>
                <br />
                <span className="text-[#d4ff00]">Protocol</span>
                <br />
                <span className="text-white/30">Queue</span>
              </h1>
              <p className="text-white/40 text-[11px] tracking-[0.15em] uppercase leading-relaxed max-w-sm">
                DecayState is in closed alpha. Secure your position in the execution hierarchy before public launch.
              </p>
            </div>

            {/* Tier Selector */}
            <div className="mb-6">
              <div className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">Select Access Tier</div>
              <div className="grid grid-cols-1 gap-2">
                {tiers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTier(t.id)}
                    className={`flex items-center gap-4 p-3 border text-left transition-all duration-200 group ${
                      selectedTier === t.id
                        ? "border-[#d4ff00]/50 bg-[#d4ff00]/5"
                        : "border-white/5 hover:border-white/15 hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className={`font-display font-black text-sm ${selectedTier === t.id ? "text-[#d4ff00]" : "text-white/20"}`}>
                      {t.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedTier === t.id ? "text-white" : "text-white/40"}`}>
                        {t.name}
                      </div>
                      <div className="text-[9px] text-white/25 tracking-wide mt-0.5">{t.desc}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full border transition-all ${
                      selectedTier === t.id ? "bg-[#d4ff00] border-[#d4ff00]" : "border-white/20"
                    }`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {error && (
                    <div className="text-red-500 text-[9px] uppercase tracking-widest bg-red-500/10 p-2 border border-red-500/20">
                      ERROR: {error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        id="waitlist-email"
                        type="email"
                        placeholder="YOUR@EMAIL.COM"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#d4ff00]/40 focus:outline-none text-[11px] tracking-[0.15em] px-4 font-mono uppercase transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="h-12 px-6 bg-[#d4ff00] text-black font-black text-[10px] tracking-[0.2em] uppercase hover:bg-[#d4ff00]/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="w-3 h-3 border border-black border-t-transparent rounded-full"
                          />
                          QUEUING
                        </span>
                      ) : (
                        "QUEUE ME"
                      )}
                    </button>
                  </div>

                  <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] text-center pt-1">
                    No spam. Just your launch notification and nothing else.
                  </p>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-[#d4ff00]/30 bg-[#d4ff00]/5 p-6 text-center space-y-3"
                >
                  <div className="flex items-center justify-center gap-2 text-[#d4ff00]">
                    <Zap className="w-5 h-5" />
                    <span className="font-black text-sm tracking-[0.3em] uppercase">Protocol Queued</span>
                  </div>
                  <p className="text-[10px] text-white/50 uppercase tracking-[0.2em]">
                    You&apos;re in the queue. We&apos;ll notify you at <span className="text-white">{email}</span> when your slot opens.
                  </p>
                  <div className="text-[8px] text-[#d4ff00]/40 tracking-[0.3em] uppercase pt-2 border-t border-white/5">
                    TIER_SELECTED: {tiers.find(t => t.id === selectedTier)?.name}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>

        {/* Bottom Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 flex items-center justify-between text-[8px] uppercase tracking-[0.2em] text-white/15"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-2.5 h-2.5" />
            <span>Encrypted Channel</span>
          </div>
          <span>Closed Alpha — By Invite Only</span>
        </motion.div>
      </div>
    </div>
  );
}
