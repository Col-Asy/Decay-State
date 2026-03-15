"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, Check, Loader2, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { FutureSelfImage } from "@/lib/db/future-self-images";

interface FutureSelfGalleryProps {
  missionId: string;
  isOpen: boolean;
  onClose: () => void;
  onImageChange: () => void;
}

export function FutureSelfGallery({
  missionId,
  isOpen,
  onClose,
  onImageChange,
}: FutureSelfGalleryProps) {
  const [images, setImages] = useState<FutureSelfImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!missionId) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("future_self_images")
        .select("*")
        .eq("mission_id", missionId)
        .order("generation_number", { ascending: true });
      setImages((data as FutureSelfImage[]) || []);
    } catch {
      console.error("Failed to fetch generated images");
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
      setError(null);
    }
  }, [isOpen, fetchImages]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-future-self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchImages();
        onImageChange();
      } else {
        setError(data.error || "Generation failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = async (imageId: string, imageUrl: string) => {
    try {
      const supabase = createClient();
      // Deselect all for this mission
      await supabase
        .from("future_self_images")
        .update({ is_selected: false })
        .eq("mission_id", missionId);
      // Select the chosen one
      await supabase
        .from("future_self_images")
        .update({ is_selected: true })
        .eq("id", imageId);
      // Update mission image_url
      await supabase
        .from("missions")
        .update({ image_url: imageUrl })
        .eq("id", missionId);

      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_selected: img.id === imageId,
        })),
      );
      onImageChange();
    } catch {
      console.error("Failed to select image");
    }
  };

  const remaining = 3 - images.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 relative overflow-hidden flex flex-col shadow-2xl shadow-accent/5"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-accent/5 blur-3xl rounded-full pointer-events-none" />

            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start">
              <div>
                <div className="text-accent text-[10px] tracking-[0.2em] uppercase font-bold flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  Projection Gallery
                </div>
                <h2 className="text-2xl font-display font-black text-white uppercase tracking-tighter">
                  Future Self Projections
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                </div>
              ) : (
                <>
                  {/* Image Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3].map((slot) => {
                      const image = images.find(
                        (img) => img.generation_number === slot,
                      );

                      if (image) {
                        return (
                          <button
                            key={slot}
                            onClick={() =>
                              handleSelect(image.id, image.image_url)
                            }
                            className={`relative aspect-square border-2 overflow-hidden transition-all group ${
                              image.is_selected
                                ? "border-accent shadow-lg shadow-accent/20"
                                : "border-white/10 hover:border-white/30"
                            }`}
                          >
                            <Image
                              src={image.image_url}
                              alt={`Projection ${slot}`}
                              fill
                              className="object-cover"
                            />
                            {/* Selection indicator */}
                            {image.is_selected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-accent flex items-center justify-center">
                                <Check className="w-4 h-4 text-black" />
                              </div>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              {!image.is_selected && (
                                <span className="text-[9px] text-white uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  Select
                                </span>
                              )}
                            </div>
                            {/* Label */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-1 px-2">
                              <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider">
                                V{slot}
                                {image.is_selected && (
                                  <span className="text-accent ml-1">
                                    :: ACTIVE
                                  </span>
                                )}
                              </span>
                            </div>
                          </button>
                        );
                      }

                      // Empty slot
                      return (
                        <div
                          key={slot}
                          className="relative aspect-square border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2"
                        >
                          {generating &&
                          slot === images.length + 1 ? (
                            <>
                              <Loader2 className="w-6 h-6 text-accent animate-spin" />
                              <span className="text-[9px] text-accent font-mono uppercase tracking-wider animate-pulse">
                                Generating...
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
                                V{slot}
                              </div>
                              <div className="text-[9px] text-zinc-700 font-mono">
                                Available
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Prompt info for selected image */}
                  {images.find((img) => img.is_selected)?.prompt_used && (
                    <div className="mb-6 p-3 bg-white/5 border border-white/5">
                      <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                        Active Projection Prompt
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                        {
                          images.find((img) => img.is_selected)
                            ?.prompt_used
                        }
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-white/5 flex justify-between items-center">
              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
                {remaining > 0
                  ? `${remaining} generation${remaining === 1 ? "" : "s"} remaining`
                  : "Generation limit reached"}
              </span>
              <button
                onClick={handleGenerate}
                disabled={generating || remaining <= 0}
                className="bg-white text-black hover:bg-accent transition-colors px-6 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Projecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    Generate Projection
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
