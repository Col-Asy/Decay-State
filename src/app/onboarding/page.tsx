"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Upload, X, ImageIcon, Target, FileText, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { upsertActiveMission } from "@/lib/db/mission";
import { uploadFile } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";
import Image from "next/image";

export default function Onboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [timeframe, setTimeframe] = useState("365 days");
  const [isGenerating, setIsGenerating] = useState(false);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }

    if (!goal.trim()) return;
    setIsGenerating(true);

    let imageUrl: string | undefined;

    // Upload the image if one was selected
    if (selectedFile && user) {
      setUploading(true);
      try {
        imageUrl = await uploadFile("mission-images", user.id, selectedFile);
      } catch (err) {
        console.error("Image upload failed:", err);
        // Non-blocking — proceed without image
      } finally {
        setUploading(false);
      }
    }

    // Simulate "projection generation" delay for UX
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (user) {
      await upsertActiveMission(user.id, {
        goal,
        timeframe,
        manifesto,
        image_url: imageUrl,
      });
      logActivity("mission", `Mission initialized: "${goal}"`, user.id);
    }

    router.push("/dashboard");
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-8">
      <AnimatePresence mode="wait">
        {/* Step 1: Image upload */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-widest text-white">
                Identity Verification
              </h2>
              <p className="text-zinc-500 text-xs font-mono mt-2">
                Upload a photo of yourself — this is your source state.
              </p>
            </div>

            {/* Drop zone / preview */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {preview && preview.length > 0 ? (
              <div className="relative h-64 w-full overflow-hidden border border-white/20">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-red-500/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] font-mono text-white/50 uppercase tracking-widest px-3 py-1.5">
                  Source image locked
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-zinc-700 h-64 flex flex-col items-center justify-center text-zinc-500 hover:border-white hover:text-white transition-colors cursor-pointer group"
              >
                <Upload
                  size={40}
                  className="mb-3 group-hover:scale-110 transition-transform"
                />
                <span className="font-mono text-xs uppercase">
                  Click to upload photo
                </span>
                <span className="text-[10px] text-zinc-600 mt-1">
                  JPG, PNG, WEBP
                </span>
              </button>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(2)}
                className="flex-1 bg-accent text-black hover:bg-white border-accent"
              >
                {preview ? "Confirm Image" : "Skip →"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Set goal */}
        {step === 2 && !isGenerating && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-widest text-white">
                Define Target State
              </h2>
              <p className="text-zinc-500 text-xs font-mono mt-2">
                Set the version of yourself you&apos;re becoming.
              </p>
            </div>

            {/* Image summary */}
            {preview && preview.length > 0 && (
              <div className="flex items-center gap-3 border border-white/10 p-3">
                <div className="relative w-10 h-10 shrink-0 overflow-hidden">
                  <Image
                    src={preview}
                    alt="Source"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                  <ImageIcon className="w-3 h-3 inline mr-1.5 text-accent" />
                  Source image attached
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                  <Target className="w-3 h-3" /> What do you want to achieve?
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="E.g. Launch SaaS MVP, Run Marathon..."
                  className="w-full bg-black/50 border border-white/10 py-3 px-4 text-sm font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent/50 transition-colors uppercase"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                  <FileText className="w-3 h-3" /> How will you get there?
                </label>
                <textarea
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  rows={3}
                  placeholder="Break it down — what specifically will you do each day/week?"
                  className="w-full bg-black/50 border border-white/10 p-4 text-xs font-mono text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                  <Clock className="w-3 h-3" /> How long do you need?
                </label>
                <input
                  type="text"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  placeholder="e.g. 30 Days, 6 Months..."
                  className="w-full bg-black/50 border border-white/10 py-3 px-4 text-sm font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent/50 transition-colors uppercase"
                />
                <div className="flex gap-2 pt-1">
                  {["7 Days", "30 Days", "90 Days", "6 Months"].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setTimeframe(dur)}
                      className={`text-[9px] font-mono px-2 py-1 uppercase tracking-wider border ${timeframe === dur ? "border-accent/50 text-accent bg-accent/10" : "border-white/10 text-zinc-500 hover:text-white"}`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="border border-white/10 text-white/40 hover:text-white"
              >
                ← Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-accent text-black hover:bg-white border-accent"
                disabled={!goal.trim() || uploading}
              >
                {uploading ? "Uploading..." : "Initialize Projection"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Generating screen */}
        {isGenerating && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
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
