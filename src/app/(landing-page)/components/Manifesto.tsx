"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, Skull, HeartPulse, Lock } from "lucide-react";

export const Manifesto = () => {
  return (
    <section className="min-h-screen flex items-center justify-center py-32 px-4 sm:px-6 bg-[#050505] relative overflow-hidden">
      {/* Background Noise */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('/noise.svg')] brightness-100 contrast-150"></div>

      <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 px-2 md:px-8">
        {/* Left: The Philosophy */}
        <div className="space-y-12 flex flex-col items-center md:items-start">
          <div className="space-y-4 flex flex-col items-center md:items-start text-center md:text-left w-full">
            <h2 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tighter leading-none text-center md:text-left">
              Planning is a <br />
              <span className="text-muted-foreground line-through decoration-red-900/50">
                Filing Cabinet.
              </span>
            </h2>
            <p className="text-xl font-display font-bold uppercase tracking-wide text-accent text-center md:text-left">
              We are an Active Accountability Engine.
            </p>
            <p className="text-muted-foreground text-sm uppercase tracking-widest leading-relaxed max-w-md mx-auto md:mx-0 text-center md:text-left">
              Passive tools let your dreams rot in a &quot;To-Do&quot; list. We
              physically show you the decay. We don&apos;t &quot;organize&quot;
              your life; we enforce your ambition.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="p-3 border border-white/10 bg-white/5">
                <Flame className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-widest text-sm text-white">
                  Target: Type-A Only
                </h4>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 leading-relaxed">
                  Built for indie hackers, developers, and elite athletes. If
                  you want a &quot;habit tracker&quot; for drinking water, go
                  elsewhere.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 border border-white/10 bg-white/5">
                <Skull className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-widest text-sm text-white">
                  The Ruin State
                </h4>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 leading-relaxed">
                  Miss 3 days and your avatar is destroyed. Recovery requires a
                  $5 penalty or a high-friction &quot;Protocol Reset&quot; task.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: The Safety Protocol (Break Glass) */}
        <div className="relative">
          {/* Darker styling: removed bright red gradients, used much darker reds/border interactions */}
          <div className="absolute -inset-1 bg-gradient-to-br from-red-900/10 to-transparent blur-xl" />
          <div className="relative h-full border border-red-900/20 bg-red-950/5 p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <Lock className="w-6 h-6 text-red-900" />
              <div className="text-[8px] uppercase tracking-[0.3em] text-red-900 border border-red-900/30 px-2 py-1">
                Override Protocol
              </div>
            </div>

            <div className="space-y-6 my-12">
              <h3 className="font-display font-black text-3xl uppercase tracking-tighter text-white/80">
                The Break-Glass Policy
              </h3>
              <p className="text-xs uppercase tracking-widest text-red-200/40 leading-relaxed">
                We are strict, not sadistic. If the AI detects specific keywords
                related to self-harm, medical emergencies, or eating disorders,
                the &quot;Strict Persona&quot; is instantly dropped.
              </p>
              <div className="flex gap-2 items-center text-red-900 text-[10px] uppercase tracking-widest font-bold">
                <HeartPulse className="w-4 h-4" />
                <span>Safety Protocols Active</span>
              </div>
            </div>

            <div className="border-t border-red-900/20 pt-6">
              <p className="text-[8px] uppercase tracking-[0.2em] text-red-900/40">
                System monitors inputs for distress signals 24/7.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
