"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, TrendingDown } from "lucide-react";
import { FutureSelfImage } from "@/components/dashboard/FutureSelfImage";

// Sketchy / Hand-Drawn Design Elements
const SketchyUnderline = ({ className = "" }: { className?: string }) => (
  <svg className={`absolute left-0 right-0 -bottom-2 h-3 w-full pointer-events-none ${className}`} viewBox="0 0 100 10" preserveAspectRatio="none">
    <path
      d="M 2 5 Q 30 2, 98 5 Q 50 8, 5 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const SketchyBadgeBorder = ({ className = "" }: { className?: string }) => (
  <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none">
    <path
      d="M 3 8 Q 50 4, 97 8 Q 98 50, 97 92 Q 50 96, 3 92 Q 1 50, 3 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const SketchyHUDBox = ({ children, className = "", strokeColor = "currentColor" }: { children: React.ReactNode, className?: string, strokeColor?: string }) => {
  const hasPosition = className.includes("absolute") || className.includes("relative") || className.includes("fixed");
  return (
    <div className={`${hasPosition ? "" : "relative"} ${className}`}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
        {/* Primary sketch stroke */}
        <path
          d="M 2 3 Q 50 1, 98 3 Q 99 50, 98 97 Q 50 99, 2 97 Q 1 50, 2 3"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Secondary overlapping offset stroke for sketchy feel */}
        <path
          d="M 4 5 Q 50 3, 96 4 Q 97 50, 96 95 Q 50 97, 4 96 Q 3 50, 4 5"
          fill="none"
          stroke={strokeColor}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-45"
        />
      </svg>
      <div className="relative z-10 p-2.5">
        {children}
      </div>
    </div>
  );
};

const SketchySliderTrack = ({ className = "" }: { className?: string }) => (
  <svg className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-4 w-full pointer-events-none ${className}`} viewBox="0 0 100 10" preserveAspectRatio="none">
    {/* Main track line */}
    <path
      d="M 1 5 Q 50 3, 99 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="opacity-20"
    />
    {/* Wobbly background double line */}
    <path
      d="M 2 6 Q 50 7, 98 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      className="opacity-15"
    />
  </svg>
);

export const DecayDemo = () => {
  const [integrity, setIntegrity] = useState(80);

  return (
    <section className="min-h-screen flex items-center justify-center py-24 px-4 sm:px-6 border-y border-white/5 bg-[#050505] relative overflow-x-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

      <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-4 md:px-8 relative z-10">
        
        {/* Left: The Controls */}
        <div className="space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left relative">
          <div className="relative inline-flex items-center gap-2 px-4 py-1.5 text-accent text-[10px] uppercase tracking-widest bg-accent/5 font-mono">
            <SketchyBadgeBorder className="text-accent/40" />
            <ShieldAlert className="w-3 h-3 text-accent animate-pulse" />
            Visual Accountability Engine
          </div>

          <h2 className="font-display font-black text-4xl md:text-5xl tracking-tighter leading-none relative pb-4">
            WITNESS YOUR <br />
            <span className="text-muted-foreground italic relative inline-block">
              AMBITION DECAY.
              <SketchyUnderline className="text-accent/60 animate-pulse" />
            </span>
          </h2>

          <p className="text-muted-foreground text-sm uppercase tracking-wider leading-relaxed max-w-md">
            Execute <span className="text-white font-bold">80%+</span> of your
            daily protocol, or physically watch your ambition decay.
            <br />
            <br />
            Miss 3 days?{" "}
            <span className="text-red-500 font-bold animate-pulse">Ruin State</span>{" "}
            initiates. The image glitches out. Recovery requires a high-friction
            protocol or penalty.
          </p>

          <div className="space-y-4 pt-4 w-full max-w-md relative">
            <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-bold">
              <span className="text-muted-foreground">Integrity Score</span>
              <span className={integrity < 50 ? "text-red-500 font-bold" : "text-accent font-bold"}>
                {integrity}%
              </span>
            </div>
            
            <div className="relative h-8 flex items-center">
              <SketchySliderTrack className={integrity < 50 ? "text-red-500" : "text-accent"} />
              <input
                type="range"
                min="0"
                max="100"
                value={integrity}
                onChange={(e) => setIntegrity(parseInt(e.target.value))}
                className="w-full h-8 appearance-none bg-transparent cursor-pointer accent-accent relative z-10 focus:outline-none"
              />
            </div>

            <p className="text-[10px] text-muted-foreground uppercase flex gap-2 items-center justify-center lg:justify-start">
              <TrendingDown className="w-3 h-3 animate-bounce" /> Drag slider to simulate
              missed days
            </p>

            {/* Handwritten Note for Slider */}
            <div className="hidden lg:block absolute -left-36 bottom-0 w-36 rotate-[-12deg] pointer-events-none font-handwritten text-accent text-[15px] opacity-80 leading-tight text-center">
              <span className="block mb-1">Drag this to test decay state</span>
              <svg className="w-8 h-8 text-accent/60 mx-auto mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M 4 12 Q 12 10, 20 14" />
                <path d="M 14 9 Q 18 13, 22 14 Q 17 15, 14 17" />
              </svg>
            </div>

            {/* Handwritten Note for Ruin Threshold */}
            {integrity < 50 && (
              <div className="hidden lg:block absolute -right-36 top-0 w-36 rotate-[15deg] pointer-events-none font-handwritten text-red-500/90 text-[15px] leading-tight text-center">
                <span className="block mb-1">Warning: Ruin state active!</span>
                <svg className="w-8 h-8 text-red-500/50 mx-auto mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M 20 12 Q 12 10, 4 14" />
                  <path d="M 10 9 Q 6 13, 2 14 Q 7 15, 10 17" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Right: Interactive 3D Future Self Viewport */}
        <div className="flex justify-center lg:justify-end relative w-full">
          <div className="relative w-full max-w-[340px] md:max-w-sm aspect-square">
            <FutureSelfImage integrity={integrity} shields={3} />

            {/* Visual Effects Overlay based on Integrity */}
            <motion.div
              animate={{
                opacity: (100 - integrity) / 100,
              }}
              className="absolute inset-0 bg-red-500/10 pointer-events-none mix-blend-overlay backdrop-blur-[0.5px]"
              style={{
                filter: `grayscale(${100 - integrity}%) contrast(${100 + (100 - integrity)}%)`,
              }}
            />

            {/* Glitch Overlay */}
            {integrity < 40 && (
              <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none">
                <div className="glitch absolute inset-0 bg-red-500/15" />
              </div>
            )}

            {/* High-tech HUD Readout Overlays */}
            <SketchyHUDBox 
              className="absolute top-3 left-3 text-[8px] uppercase tracking-widest bg-black/90 z-10 font-mono shadow-[0_0_15px_rgba(0,0,0,0.5)] w-28" 
              strokeColor="rgba(255,255,255,0.15)"
            >
              <div className="space-y-1">
                <div className="text-accent font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  Protocol: Active
                </div>
                <div className="text-white/60">Target: 3:00 AM</div>
              </div>
            </SketchyHUDBox>

            <SketchyHUDBox 
              className="absolute bottom-3 right-3 text-[8px] uppercase tracking-widest text-right bg-black/90 z-10 font-mono shadow-[0_0_15px_rgba(0,0,0,0.5)] w-32" 
              strokeColor="rgba(255,255,255,0.15)"
            >
              <div className="space-y-1">
                <div className={integrity < 30 ? "text-red-500 font-bold" : "text-white/60"}>
                  State: {integrity < 30 ? "CRITICAL / RUIN" : "STABLE"}
                </div>
                <div className="text-accent font-bold">NODE#8082</div>
              </div>
            </SketchyHUDBox>

            {/* Handwritten Note for 3D Interaction */}
            <div className="hidden lg:block absolute -left-36 top-20 w-36 rotate-[-8deg] pointer-events-none font-handwritten text-white/50 text-[15px] leading-tight text-center">
              <svg className="w-8 h-8 text-white/20 mx-auto mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M 4 12 Q 12 8, 20 14" />
                <path d="M 14 9 Q 18 13, 22 14 Q 17 15, 14 17" />
              </svg>
              <span className="block">Interactive: drag to rotate view</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
