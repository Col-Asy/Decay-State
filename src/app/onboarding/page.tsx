"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Upload } from "lucide-react";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setIsGenerating(true);
      // Simulate generation delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Save "user" state to local storage (mock persistence)
      localStorage.setItem(
        "switch_user",
        JSON.stringify({
          name,
          goal,
          integrity: 50,
          // High quality splash image for the success state
          image_url:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2787&auto=format&fit=crop",
        }),
      );

      router.push("/dashboard");
    }
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-8">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-8"
          >
            <h2 className="text-3xl font-bold uppercase tracking-widest text-white">
              Identity Verification
            </h2>
            <div className="border-2 border-dashed border-zinc-700 h-64 flex flex-col items-center justify-center text-zinc-500 hover:border-white hover:text-white transition-colors cursor-pointer group">
              <Upload
                size={48}
                className="mb-4 group-hover:scale-110 transition-transform"
              />
              <span className="font-mono text-xs uppercase">
                Upload Source Image
              </span>
              <span className="text-[10px] text-zinc-600 mt-2">
                (MOCK: CLICK SKIP)
              </span>
            </div>
            <Button onClick={() => setStep(2)} className="w-full">
              Confirm Upload
            </Button>
          </motion.div>
        )}

        {step === 2 && !isGenerating && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-8"
          >
            <h2 className="text-3xl font-bold uppercase tracking-widest text-white">
              Define Target State
            </h2>
            <div className="space-y-4">
              <label className="block text-xs uppercase text-zinc-500 font-mono">
                Who are you in 365 days?
              </label>
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. A marathon runner"
                autoFocus
              />
            </div>
            <Button onClick={handleNext} className="w-full" disabled={!goal}>
              Initialize Projection
            </Button>
          </motion.div>
        )}

        {isGenerating && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-mono text-sm uppercase animate-pulse">
              Constructing Future Self...
            </p>
            <p className="font-mono text-xs text-zinc-600">
              Aligning probability vectors.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 text-zinc-800 font-mono text-xs">
        SCENARIO: {step}/2
      </div>
    </div>
  );
}
