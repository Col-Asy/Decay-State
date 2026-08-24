"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

const OBSERVER_FEATURES = [
  "1 Active Mission",
  "Up to 5 Daily Mandates",
  "10 Journal Entries",
  "3 AI Chat Conversations",
  "10 AI Messages / day",
  "AI Mandate Generation (3/day)",
  "Visual Decay Simulation",
  "Integrity Score Tracking",
];

const OBSERVER_LOCKED = [
  "Weekly Image Evolution",
  "Decay Recovery Protocols",
  "Unlimited Mandates & Journals",
];

const OPERATOR_FEATURES = [
  "Unlimited Missions",
  "Unlimited Daily Mandates",
  "Unlimited Journal Entries",
  "Unlimited AI Conversations",
  "Unlimited AI Messages",
  "AI Mandate Generation (20/day)",
  "Visual Decay Simulation",
  "Integrity Score Tracking",
  "Weekly Image Evolution",
  "Decay Recovery Protocols",
  "Full Activity Log History",
];

async function startCheckout(
  annual: boolean,
  router: ReturnType<typeof useRouter>,
) {
  const res = await fetch("/api/dodo/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ annual }),
  });
  const data = await res.json();
  if (data.payment_link) {
    window.location.href = data.payment_link;
  } else if (res.status === 401) {
    router.push("/signup");
  }
}

export const Pricing = () => {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    setLoading(true);
    await startCheckout(annual, router);
    setLoading(false);
  };

  return (
    <section className="min-h-screen flex items-center justify-center py-32 px-4 sm:px-6 bg-black">
      <div className="w-full max-w-[1440px] mx-auto space-y-16 px-2 md:px-8">
        <div className="text-center space-y-4">
          <h2 className="font-display font-black text-5xl md:text-7xl uppercase tracking-tighter">
            CHOOSE YOUR <br />
            PROTOCOL
          </h2>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.4em]">
            Invest in discipline. Not subscriptions.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span
              className={`text-[10px] uppercase tracking-widest transition-colors ${!annual ? "text-white" : "text-white/30"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-accent" : "bg-white/10"}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${annual ? "left-7" : "left-1"}`}
              />
            </button>
            <span
              className={`text-[10px] uppercase tracking-widest transition-colors ${annual ? "text-white" : "text-white/30"}`}
            >
              Annual
              <span className="ml-1 text-accent text-[8px]">2 months free</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[16rem] max-w-[1350px] mx-auto">
          {/* OBSERVER — Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 border border-white/5 bg-zinc-950/50 flex flex-col gap-8 cyber-border"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase tracking-[0.3em]">
                <Shield className="w-3 h-3" />
                <span>Tier 01</span>
              </div>
              <h3 className="font-bold text-2xl uppercase tracking-widest">
                OBSERVER
              </h3>
              <p className="text-muted-foreground text-xs uppercase tracking-widest leading-relaxed">
                Begin the protocol. No commitment required.
              </p>
            </div>

            <div className="font-display text-4xl font-black text-white">
              $0 <span className="text-xs text-muted-foreground">/ MO</span>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 flex-1">
              {OBSERVER_FEATURES.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  <Check className="w-4 h-4 text-accent shrink-0" /> {item}
                </li>
              ))}
              {OBSERVER_LOCKED.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-[10px] uppercase tracking-widest text-white/20 line-through"
                >
                  <Check className="w-4 h-4 text-white/10 shrink-0" /> {item}
                </li>
              ))}
            </ul>

            <a
              href="/signup"
              className="w-full py-4 border border-white/20 uppercase font-black text-[10px] tracking-widest hover:border-white transition-colors text-center block"
            >
              Begin Protocol
            </a>
          </motion.div>

          {/* OPERATOR — Paid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 border border-accent bg-accent/5 flex flex-col gap-8 relative overflow-hidden cyber-border"
          >
            <div className="absolute top-0 right-0 bg-accent text-black px-4 py-1 text-[8px] font-black uppercase tracking-widest">
              Recommended
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent/60 text-[9px] uppercase tracking-[0.3em]">
                <Zap className="w-3 h-3" />
                <span>Tier 02</span>
              </div>
              <h3 className="font-bold text-2xl uppercase tracking-widest text-accent">
                OPERATOR
              </h3>
              <p className="text-accent/60 text-xs uppercase tracking-widest leading-relaxed">
                For those who view failure as non-existent.
              </p>
            </div>

            <div className="font-display text-4xl font-black text-accent">
              {annual ? (
                <>
                  $56 <span className="text-xs text-accent/50">/ YR</span>
                </>
              ) : (
                <>
                  $7 <span className="text-xs text-accent/50">/ MO</span>
                </>
              )}
              {annual && (
                <div className="text-xs text-accent/50 font-mono font-normal mt-1">
                  ~$4.67/mo · save $28
                </div>
              )}
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 flex-1">
              {OPERATOR_FEATURES.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-[10px] uppercase tracking-widest text-white"
                >
                  <Check className="w-4 h-4 text-accent font-bold shrink-0" />{" "}
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-4 bg-accent text-black uppercase font-black text-[10px] tracking-widest hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {loading
                ? "PROCESSING..."
                : annual
                  ? "ACTIVATE OPERATOR (ANNUAL)"
                  : "ACTIVATE OPERATOR"}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
