"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Upload, X, ImageIcon, Target, FileText, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { upsertActiveMission } from "@/lib/db/mission";
import { uploadFile } from "@/lib/storage";
import { logActivity } from "@/lib/activityLog";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { OnboardingChat } from "@/components/onboarding/OnboardingChat";
import { addOnboardingMandates } from "@/lib/db/onboarding";

export default function Onboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [timeframe, setTimeframe] = useState("365 days");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationState, setGenerationState] = useState<
    "idle" | "uploading" | "saving" | "chat" | "generating" | "complete" | "error"
  >("idle");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null,
  );
  const [savedMissionId, setSavedMissionId] = useState<string | null>(null);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/jpeg" && file.type !== "image/jpg") {
      alert("Only JPG/JPEG images are allowed.");
      e.target.value = "";
      return;
    }
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

    let avatarUrl: string | undefined;

    // Upload the image to avatars bucket (public, permanent URL)
    if (selectedFile && user) {
      setGenerationState("uploading");
      try {
        avatarUrl = await uploadFile("avatars", user.id, selectedFile);

        // Update user profile with the avatar
        const supabase = createClient();
        
        // Update both profiles table and auth metadata (like accounts page does)
        await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
        
        await supabase
          .from("profiles")
          .update({ avatar_url: avatarUrl })
          .eq("id", user.id);
          
        setAvatarUrlState(avatarUrl);
      } catch (err) {
        console.error("Image upload failed:", err);
        // Non-blocking — proceed without image
      }
    }

    // Save mission to database
    setGenerationState("saving");
    let savedMission;
    if (user) {
      savedMission = await upsertActiveMission(user.id, {
        goal,
        timeframe,
        manifesto,
      });
      setSavedMissionId(savedMission.id);
      logActivity("mission", `Mission initialized: "${goal}"`, user.id);
    }
    
    // Transition to Neural Link Chat Step
    setGenerationState("chat");
    setStep(3);
  };

  const handleChatComplete = async (mandates: any[]) => {
    // Save to DB
    if (user && savedMissionId && mandates.length > 0) {
      try {
        await addOnboardingMandates(user.id, mandates, savedMissionId);
      } catch (err) {
        console.error("Failed to save onboarding mandates:", err);
      }
    }
    
    // Continue to generation
    await proceedToGeneration();
  };

  const handleChatSkip = async () => {
    await proceedToGeneration();
  };

  const proceedToGeneration = async () => {
    // Trigger future self generation if we have a source image and mission
    if (avatarUrlState && savedMissionId) {
      setGenerationState("generating");
      try {
        const res = await fetch("/api/generate-future-self", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionId: savedMissionId }),
        });
        const data = await res.json();
        if (data.success) {
          setGeneratedImageUrl(data.image.imageUrl);
          setGenerationState("complete");
          return; // Don't auto-redirect, wait for user action
        } else {
          console.error("Generation failed:", data.error);
          setGenerationState("error");
          return;
        }
      } catch (err) {
        console.error("Generation request failed:", err);
        setGenerationState("error");
        return;
      }
    }

    // No image uploaded — skip generation, go to dashboard
    router.push("/dashboard");
  };

  // We need to keep track of avatarUrl across async boundaries
  const [avatarUrlState, setAvatarUrlState] = useState<string | null>(null);

  const totalSteps =
    generationState === "generating" ||
    generationState === "complete" ||
    generationState === "error"
      ? 4
      : 3;
  const displayStep =
    generationState === "generating" ||
    generationState === "complete" ||
    generationState === "error"
      ? 4
      : step;

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-8">
      <AnimatePresence mode="wait">
        {/* Step 1: Image upload */}
        {step === 1 && !isGenerating && (
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
              accept="image/jpeg,image/jpg"
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
                  JPG / JPEG ONLY
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

        {/* Step 3: Neural Link Chat */}
        {step === 3 && generationState === "chat" && (
          <OnboardingChat
            goal={goal}
            manifesto={manifesto}
            timeframe={timeframe}
            onComplete={handleChatComplete}
            onSkip={handleChatSkip}
          />
        )}

        {/* Generating screen */}
        {isGenerating &&
          (generationState === "uploading" ||
            generationState === "saving" ||
            generationState === "generating" ||
            generationState === "idle") && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-sm uppercase animate-pulse">
                {generationState === "uploading"
                  ? "Uploading Source Image..."
                  : generationState === "saving"
                    ? "Saving Mission Parameters..."
                    : "Constructing Future Self..."}
              </p>
              <p className="font-mono text-xs text-zinc-600">
                {generationState === "generating"
                  ? "AI is projecting your target state. This may take 15-30 seconds."
                  : "Aligning probability vectors."}
              </p>
              {generationState === "generating" && (
                <div className="flex justify-center gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-accent/30 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 200}ms` }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

        {/* Generation complete - reveal */}
        {generationState === "complete" && generatedImageUrl && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-md"
          >
            <div className="text-accent text-[10px] tracking-[0.3em] uppercase font-bold">
              Projection Complete
            </div>
            <div className="relative w-64 h-64 mx-auto border-2 border-accent/50 overflow-hidden">
              <Image
                src={generatedImageUrl}
                alt="Your Future Self"
                fill
                className="object-cover"
              />
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent" />
            </div>
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-wider">
              This is the version of you that completes the mission.
            </p>
            <p className="font-mono text-[10px] text-zinc-600">
              You can regenerate up to 2 more times from the dashboard.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-accent text-black px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              Enter Command Center
            </button>
          </motion.div>
        )}

        {/* Generation error - proceed anyway */}
        {generationState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4 max-w-md"
          >
            <div className="text-zinc-500 text-[10px] tracking-[0.3em] uppercase font-bold">
              Projection Failed
            </div>
            <p className="font-mono text-sm text-zinc-400 uppercase">
              Future self projection could not be generated at this time.
            </p>
            <p className="font-mono text-[10px] text-zinc-600">
              You can retry from the dashboard using the Projections panel.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-white text-black px-6 py-2 font-bold uppercase tracking-widest text-xs hover:bg-accent transition-colors"
            >
              Continue to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 text-zinc-800 font-mono text-xs">
        SCENARIO: {displayStep}/{totalSteps}
      </div>
    </div>
  );
}
