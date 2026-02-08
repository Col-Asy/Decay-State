"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* Background Oscillation */}
      <motion.div
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2864&auto=format&fit=crop')] bg-cover bg-center opacity-30"
        animate={{
          filter: ["blur(0px)", "blur(10px)", "blur(0px)"],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="z-10 text-center space-y-8 p-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-6xl md:text-9xl font-bold tracking-tighter text-white uppercase text-glow"
        >
          Manifest
          <span className="block text-zinc-500 text-4xl md:text-6xl mt-2">
            Or Fade
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-zinc-400 font-mono text-sm md:text-base max-w-md mx-auto"
        >
          A visual feedback loop where your actions dictate your reality.
          Entropy is waiting.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <Link href="/onboarding">
            <Button className="border-white text-white hover:bg-white hover:text-black">
              Begin Protocol
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none"></div>
    </div>
  );
}
