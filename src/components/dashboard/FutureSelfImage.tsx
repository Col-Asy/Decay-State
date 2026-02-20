"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface FutureSelfImageProps {
  integrity: number;
  imageUrl: string;
}

export function FutureSelfImage({ integrity, imageUrl }: FutureSelfImageProps) {
  // Calculate filter values based on integrity
  // Integrity 100 -> Blur 0px, Grayscale 0%, Brightness 100%
  // Integrity 0 -> Blur 10px, Grayscale 100%, Brightness 50%

  const blurAmount = (100 - integrity) / 10; // 0 to 10px
  const grayscaleAmount = 100 - integrity; // 0 to 100%
  const brightnessAmount = 50 + integrity / 2; // 50 to 100%

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto overflow-hidden border-2 border-zinc-800">
      <motion.div
        className="w-full h-full"
        animate={{
          filter: `blur(${blurAmount}px) grayscale(${grayscaleAmount}%) brightness(${brightnessAmount}%)`,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <Image
          src={imageUrl}
          alt="Future Self"
          fill
          className="object-cover"
          priority
        />
      </motion.div>

      {/* Glitch Overlay logic could go here later */}

      <div className="absolute bottom-4 right-4 text-xs text-zinc-500 font-mono">
        INTEGRITY: {integrity}%
      </div>

      {/* Visual artifact elements for "tech" feel */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-600"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-600"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-zinc-600"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-zinc-600"></div>
    </div>
  );
}
