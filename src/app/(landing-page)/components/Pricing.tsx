"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export const Pricing = () => {
  return (
    <section className="min-h-screen flex items-center justify-center py-32 px-6 bg-black">
      <div className="w-full max-w-[1200px] mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="font-display font-black text-5xl md:text-7xl uppercase tracking-tighter">
            CHOOSE YOUR <br />
            DESTINY
          </h2>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.4em]">
            Investment in your higher self.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 border border-white/5 bg-zinc-950/50 flex flex-col gap-8 cyber-border">
            <div className="space-y-2">
              <h3 className="font-bold text-2xl uppercase tracking-widest">
                Protocol FREE
              </h3>
              <p className="text-muted-foreground text-xs uppercase tracking-widest leading-relaxed">
                Basic accountability for the uncommitted.
              </p>
            </div>

            <div className="font-display text-4xl font-black text-white">
              $0 <span className="text-xs text-muted-foreground">/ MO</span>
            </div>

            <ul className="space-y-4 flex-1">
              {[
                "Single High-Stakes Goal",
                "Text-only daily check-ins",
                "Visual Decay Simulation",
                "Integrity Score Tracking",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  <Check className="w-4 h-4 text-accent" /> {item}
                </li>
              ))}
            </ul>

            <button className="w-full py-4 border border-white/20 uppercase font-black text-[10px] tracking-widest hover:border-white transition-colors">
              Begin Trial
            </button>
          </div>

          {/* Paid Tier */}
          <div className="p-8 border border-accent bg-accent/5 flex flex-col gap-8 relative overflow-hidden cyber-border">
            <div className="absolute top-0 right-0 bg-accent text-black px-4 py-1 text-[8px] font-black uppercase tracking-widest">
              High Achiever
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-2xl uppercase tracking-widest text-accent">
                PROTOCOL ELITE
              </h3>
              <p className="text-accent/60 text-xs uppercase tracking-widest leading-relaxed">
                For those who view failure as non-existent.
              </p>
            </div>

            <div className="font-display text-4xl font-black text-accent">
              $15 <span className="text-xs text-accent/50">/ MO</span>
            </div>

            <ul className="space-y-4 flex-1">
              {[
                "Unlimited Goals",
                "AI Vision Verification (1.5)",
                "Weekly Image Evolution",
                "Hard Friction Recovery Protocol",
                "Direct AI Logic Updates",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-[10px] uppercase tracking-widest text-white"
                >
                  <Check className="w-4 h-4 text-accent font-bold" /> {item}
                </li>
              ))}
            </ul>

            <button className="w-full py-4 bg-accent text-black uppercase font-black text-[10px] tracking-widest hover:scale-[1.02] transition-transform">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
