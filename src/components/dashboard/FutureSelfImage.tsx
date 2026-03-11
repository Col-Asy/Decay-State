"use client";

import { Shield, Target } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface FutureSelfImageProps {
  integrity: number;
  shields: number; // 0–3, drives image visual degradation
  imageUrl: string | null;
}

// Noise texture as inline SVG data URI — no external assets needed
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`;

// Shield count → CSS filter + noise overlay values
const SHIELD_FILTERS = {
  3: { blur: "0px",  grayscale: "0%",   brightness: "100%", noiseOpacity: 0    },
  2: { blur: "0px",  grayscale: "15%",  brightness: "90%",  noiseOpacity: 0.07 },
  1: { blur: "3px",  grayscale: "60%",  brightness: "72%",  noiseOpacity: 0.14 },
  0: { blur: "8px",  grayscale: "100%", brightness: "50%",  noiseOpacity: 0.22 },
} as const;

export function FutureSelfImage({
  integrity,
  shields,
  imageUrl,
}: FutureSelfImageProps) {
  const clampedShields = Math.max(0, Math.min(3, shields)) as 0 | 1 | 2 | 3;
  const f = SHIELD_FILTERS[clampedShields];
  const filterString = imageUrl
    ? `blur(${f.blur}) grayscale(${f.grayscale}) brightness(${f.brightness})`
    : "none";

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto overflow-hidden border-2 border-zinc-800">
      <motion.div
        className="w-full h-full"
        animate={{ filter: filterString }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Future Self"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-accent/5 border border-accent/20 flex flex-col items-center justify-center p-8 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2 text-[10px] text-accent uppercase tracking-widest font-bold">
                <Target className="w-4 h-4" />
                Visual Feed
              </div>
              <div className="text-4xl font-display font-black text-white uppercase tracking-tight leading-tight opacity-50">
                NO IMAGE
              </div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
                ↳ Awaiting Initial Upload
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Noise overlay — opacity scales inversely with shield count */}
      {f.noiseOpacity > 0 && (
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: NOISE_SVG, backgroundSize: "256px 256px" }}
          animate={{ opacity: f.noiseOpacity }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      )}

      {/* Shield icons — bottom left */}
      <div className="absolute bottom-10 left-4 flex items-center gap-1 z-30">
        {[0, 1, 2].map((i) => (
          <Shield
            key={i}
            className={`w-4 h-4 transition-colors ${
              i < clampedShields ? "text-accent" : "text-white/20"
            }`}
            fill={i < clampedShields ? "currentColor" : "none"}
          />
        ))}
      </div>

      {/* Integrity label — bottom right */}
      <div className="absolute bottom-4 right-4 text-xs text-zinc-500 font-mono z-30">
        INTEGRITY: {integrity}%
      </div>

      {/* Visual artifact corner elements */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-600" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-600" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-zinc-600" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-zinc-600" />
    </div>
  );
}
