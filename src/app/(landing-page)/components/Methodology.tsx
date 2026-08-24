"use client";

import React from "react";
import { Brain, UserCheck, Activity } from "lucide-react";

export const Methodology = () => {
  return (
    <section className="min-h-screen flex items-center justify-center py-24 px-4 sm:px-6 bg-[#030303] border-t border-white/5 relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20 pointer-events-none" />

      <div className="w-full max-w-[1440px] mx-auto relative z-10 px-2 md:px-8">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20 space-y-6">
          <h2 className="font-display font-black text-5xl md:text-7xl uppercase tracking-tighter leading-none">
            Psychology of <span className="text-accent">Loss.</span>
          </h2>
          <p className="text-sm text-muted-foreground uppercase tracking-widest leading-relaxed max-w-xl mx-auto">
            Humans are wired to ignore abstract gains but violently reject
            visual loss.
            <br />
            <br />
            We don&apos;t give you a &quot;streak&quot; to maintain. We give
            you a &quot;living self&quot; that dies when you fail. It&apos;s
            not gamification. It&apos;s digital hostage-taking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Brain,
              title: "Loss Aversion",
              desc: "The pain of losing your avatar outweighs the pleasure of a checkmark.",
            },
            {
              icon: UserCheck,
              title: "Identity Mirror",
              desc: "You don't just 'miss a habit'. You physically see your identity degrade.",
            },
            {
              icon: Activity,
              title: "High Friction",
              desc: "Recovery is painful. $5 or 2x effort. The wall is high for a reason.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group relative bg-[#080808] p-8 border border-white/5 overflow-hidden hover:border-accent/30 transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity" />

              <item.icon className="w-8 h-8 text-white/20 group-hover:text-accent transition-colors mb-6" />

              <h3 className="font-display font-black text-2xl uppercase tracking-tighter mb-4 text-white group-hover:text-accent transition-colors">
                0{i + 1}. {item.title}
              </h3>

              <p className="text-[10px] uppercase tracking-widest text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
