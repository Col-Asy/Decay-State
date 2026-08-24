"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Send, ShieldCheck, XCircle, Zap } from "lucide-react";

// Hand-drawn SVG card border — seed varies the wobble per card
const SketchyCard = ({
  children,
  className = "",
  strokeColor = "rgba(255,255,255,0.18)",
  seed = 0,
}: {
  children: React.ReactNode;
  className?: string;
  strokeColor?: string;
  seed?: number;
}) => {
  const s = seed;
  const path1 = `M ${2+s*0.3} ${3+s*0.15} Q 50 ${1+s*0.4}, ${98-s*0.2} ${3+s*0.1} Q 99 50, ${98-s*0.1} ${97-s*0.2} Q 50 ${99+s*0.1}, ${2+s*0.15} ${97} Q 1 50, ${2+s*0.3} ${3+s*0.15}`;
  const path2 = `M ${4+s*0.4} 5 Q 50 ${3+s*0.3}, ${96-s*0.3} 5 Q 97 50, 96 95 Q 50 ${97+s*0.15}, ${4+s*0.2} ${95+s*0.1} Q 3 50, ${4+s*0.4} 5`;
  const sw = 1.8 + s * 0.25;
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path d={path1} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <path d={path2} fill="none" stroke={strokeColor} strokeWidth={sw * 0.45} strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      </svg>
      <div className="relative z-10 p-5">
        {children}
      </div>
    </div>
  );
};

export const AIPrompt = () => {
  const [input, setInput] = useState("");

  const conversation = [
    {
      role: "ai",
      text: "State your vision. What must happen in the next 90 days?",
    },
    { role: "user", text: "I want to launch my startup and get fit." },
    {
      role: "ai",
      text: "Vague. Unacceptable. Define the MRR target. Define the body fat %. Define the daily hours of deep work.",
    },
    { role: "user", text: "$10k MRR, 12% body fat, 4 hours deep work daily." },
    {
      role: "ai",
      text: "Accepted. Generating visual trajectory... If you fail >20% of days, this vision will degrade.",
    },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center py-24 px-4 sm:px-6 bg-black relative overflow-hidden">
      <div className="w-full max-w-6xl mx-auto space-y-8 px-4 md:px-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="font-display font-black text-4xl uppercase tracking-tighter">
            Enter the Protocol
          </h2>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px]">
            AI-Vetted Commitments Only. No Excuses.
          </p>
        </div>

        {/* Terminal Container — sketchy border */}
        <SketchyCard
          strokeColor="rgba(255,255,255,0.12)"
          seed={1}
          className="bg-[#0a0a0a]"
        >
          {/* Terminal Header */}
          <div className="border-b border-white/5 -mx-5 px-4 pb-3 mb-4 flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Terminal className="w-3 h-3 text-accent" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">
                V0.9-BETA: ENCRYPTED_CHANNEL
              </span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-accent/50" />
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 font-mono text-sm space-y-5 overflow-y-auto">
            <AnimatePresence>
              {conversation.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={i}
                  className={`flex gap-4 ${msg.role === "ai" ? "text-accent" : "text-white"}`}
                >
                  <span className="opacity-40 shrink-0 text-[10px] pt-0.5">
                    [{msg.role.toUpperCase()}]
                  </span>
                  <span>{msg.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex gap-4 text-white animate-pulse">
              <span className="opacity-40 shrink-0 text-[10px] pt-0.5">[USER]</span>
              <span className="border-l-2 border-accent h-5 ml-1" />
            </div>
          </div>

          {/* Input Bar */}
          <div className="-mx-5 px-4 pt-3 mt-4 border-t border-white/8 flex gap-3 items-center bg-zinc-950/60">
            <input
              placeholder="PROMPT YOUR REALITY..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm uppercase tracking-widest text-white placeholder:text-white/20 font-mono"
            />
            <button className="bg-accent text-black p-2 hover:bg-accent/80 transition-colors shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </SketchyCard>

        {/* Feature Cards — all three with hand-drawn borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {[
            {
              icon: ShieldCheck,
              title: "AI Verdict",
              desc: "Our AI generates your \"Future Self\" based on strict inputs. If you can't verify progress, the image degrades.",
              color: "text-accent",
              strokeColor: "rgba(212,255,0,0.35)",
              seed: 0,
            },
            {
              icon: XCircle,
              title: "No Support",
              desc: "This isn't a cheerleader. It's a warden. It detects lies, excuses, and \"off-days\" instantly.",
              color: "text-red-500",
              strokeColor: "rgba(239,68,68,0.35)",
              seed: 1,
            },
            {
              icon: Zap,
              title: "Pulse Check",
              desc: "Daily verifiable check-ins. Miss 3 days and the \"Ruin Protocol\" initiates.",
              color: "text-white",
              strokeColor: "rgba(255,255,255,0.22)",
              seed: 2,
            },
          ].map((card, i) => (
            <SketchyCard
              key={i}
              strokeColor={card.strokeColor}
              seed={card.seed}
              className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className={`flex items-center gap-2 ${card.color} mb-3`}>
                <card.icon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
                  {card.title}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase leading-relaxed tracking-wider font-mono">
                {card.desc}
              </p>
            </SketchyCard>
          ))}
        </div>
      </div>
    </section>
  );
};
