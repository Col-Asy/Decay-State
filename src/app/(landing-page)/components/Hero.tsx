"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Share2, Twitter, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

const HeroFace = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 mix-blend-screen scale-75">
      <motion.div
        animate={{ rotateY: 360, rotateZ: 90 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="relative w-[500px] h-[500px] preserve-3d"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Spherical Grid Construction */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`ring-x-${i}`}
            className="absolute inset-0 border border-accent/20 rounded-full"
            style={{
              transform: `rotateX(${i * 30}deg)`,
            }}
          />
        ))}

        {[...Array(12)].map((_, i) => (
          <div
            key={`ring-y-${i}`}
            className="absolute inset-0 border border-accent/20 rounded-full"
            style={{
              transform: `rotateY(${i * 30}deg)`,
            }}
          />
        ))}

        {/* Core Glow */}
        <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full scale-50 animate-pulse" />
      </motion.div>
    </div>
  );
};

export const Hero = () => {
  // Scroll to section handler
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center p-4 overflow-hidden relative selection:bg-accent selection:text-black">
      {/* Outer Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[1440px] h-full max-h-[85vh] frame-border bg-[#050505] p-8 md:p-12 relative overflow-hidden flex flex-col justify-between"
      >
        {/* Frame Decorative Notches */}
        <div className="absolute top-0 right-10 w-40 h-6 border-x border-b border-white/10 rounded-b-xl px-4 flex items-center justify-between text-[6px] text-white/40 uppercase tracking-[0.3em]">
          <span>System: Active</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-white/20 rounded-full" />
          </div>
        </div>

        {/* Top Header / Navigation */}
        <div className="flex justify-between items-start z-20">
          <div className="flex items-center gap-1">
            <span className="font-display font-black text-2xl tracking-tighter">
              DECAYSTATE
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {/* Navigation Links */}
            <div className="flex gap-6 text-[9px] font-bold tracking-[0.2em] text-white/50 uppercase cursor-pointer">
              <a
                onClick={() => scrollTo("manifesto")}
                className="hover:text-accent transition-colors"
              >
                / Manifesto
              </a>
              <a
                onClick={() => scrollTo("features")}
                className="hover:text-accent transition-colors"
              >
                / Features
              </a>
              <a
                onClick={() => scrollTo("pricing")}
                className="hover:text-accent transition-colors"
              >
                / Pricing
              </a>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Left Sidebar Text */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 md:w-32 space-y-2 hidden md:block">
            <div className="w-[1px] h-20 bg-accent/30 mx-auto" />
            <div className="text-[10px] uppercase tracking-[0.5em] [writing-mode:vertical-lr] rotate-180 text-white mx-auto font-black">
              Visual Accountability
            </div>
            <div className="w-[1px] h-20 bg-white/10 mx-auto" />
          </div>

          {/* Rotating Grid Portrait Face Structure */}
          <HeroFace />

          {/* Huge Hero Typography */}
          <div className="z-10 text-center flex flex-col items-center mix-blend-difference">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-display font-black text-[70px] md:text-[100px] lg:text-[130px] leading-[0.85] tracking-tighter uppercase"
            >
              <span className="text-accent block">EXECUTE</span>
              <span className="text-outline block my-2">OR</span>
              <span className="text-accent block">DECAY</span>
            </motion.h1>

            {/* Center Bottom CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col md:flex-row gap-4 mt-8"
            >
              <Button
                className="h-10 px-6 bg-transparent text-accent border border-accent hover:bg-accent/10 font-bold text-[10px] tracking-widest"
                onClick={() => window.location.href = '/waitlist'}
              >
                Join Waitlist
              </Button>
            </motion.div>
          </div>

          {/* Right Side Description */}
          <div className="absolute right-0 top-1/3 text-right max-w-[200px] space-y-4 hidden md:block">
            <p className="text-[10px] text-white/60 font-medium uppercase tracking-[0.2em] leading-relaxed">
              Execute 80% of your daily protocol, or physically watch your
              ambition decay.
            </p>
            <p className="text-[10px] text-accent font-medium uppercase tracking-[0.2em] leading-relaxed">
              Strict AI. No Excuses.
            </p>
          </div>

          {/* Bottom Right CTA */}
          <div className="absolute right-0 bottom-0 text-right z-20">
            <div
              className="flex flex-col items-end gap-3 group cursor-pointer"
              onClick={() => scrollTo("pricing")}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-accent group-hover:scale-110 transition-transform"
              >
                <path d="M10 10L30 30" stroke="currentColor" strokeWidth="4" />
                <path d="M10 30L30 10" stroke="currentColor" strokeWidth="4" />
              </svg>
              <div className="text-accent font-black text-xl leading-tight uppercase tracking-widest text-right">
                Visualize <br /> Your Future
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Small Text */}
        <div className="mt-4 flex justify-center z-10">
          <div className="max-w-xs text-center space-y-2 opacity-50">
            <p className="text-[8px] uppercase tracking-[0.3em] leading-relaxed text-white">
              We visualize your goals. You execute the plan. The AI judges your
              progress cold and objectively.
            </p>
          </div>
        </div>

        {/* Scantron-like Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
      </motion.div>
    </div>
  );
};
