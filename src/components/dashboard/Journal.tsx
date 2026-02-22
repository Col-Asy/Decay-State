"use client";

import { useState, useEffect, useRef } from "react";
import { Save, ImageIcon, X, Link2, Target } from "lucide-react";
import { logActivity } from "@/lib/activityLog";
import { useAuth } from "@/context/AuthContext";
import { getJournalEntries, addJournalEntry } from "@/lib/db/journal";
import type { JournalEntry } from "@/lib/db/journal";
import { getMandates } from "@/lib/db/mandates";
import { getMissions } from "@/lib/db/mission";
import type { Mission } from "@/lib/db/mission";
import { uploadFile } from "@/lib/storage";
import Image from "next/image";

interface MandateOption {
  id: string;
  label: string;
}

export function Journal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [wins, setWins] = useState("");
  const [failures, setFailures] = useState("");
  const [adjustments, setAdjustments] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // New fields
  const [selectedMandateId, setSelectedMandateId] = useState<string>("");
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [mandateOptions, setMandateOptions] = useState<MandateOption[]>([]);
  const [missionOptions, setMissionOptions] = useState<Mission[]>([]);

  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    getJournalEntries(user.id).then(setEntries).catch(console.error);
    getMandates(user.id)
      .then((tasks) =>
        setMandateOptions(tasks.map((t) => ({ id: t.id, label: t.label }))),
      )
      .catch(console.error);
    getMissions(user.id).then(setMissionOptions).catch(console.error);
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imgInputRef.current) imgInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!user || isSaving) return;
    setIsSaving(true);

    await new Promise((r) => setTimeout(r, 1500));

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadFile("journal-images", user.id, imageFile);
      }

      const entry = await addJournalEntry(user.id, {
        wins,
        failures,
        adjustments,
        missionId: selectedMissionId || undefined,
        mandateId: selectedMandateId || undefined,
        imageUrl,
      });
      setEntries((prev) => [entry, ...prev]);
      logActivity(
        "journal",
        `Entry logged — ${wins ? "wins recorded" : "no wins"}, ${failures ? "failures noted" : "no failures"}`,
        user.id,
      );
      setWins("");
      setFailures("");
      setAdjustments("");
      setSelectedMandateId("");
      setSelectedMissionId("");
      clearImage();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-12 h-full">
      {/* Entry Form - Terminal Input */}
      <div className="flex flex-col gap-6 h-full relative">
        {isSaving && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center flex-col cyber-border">
            <div className="w-16 h-16 border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4" />
            <div className="text-accent font-mono animate-pulse uppercase tracking-widest text-xs">
              Encrypting Data Packets...
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 border-b border-white/10 pb-2">
          <span className="animate-pulse text-accent">●</span>
          New Entry Log
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {/* Text fields */}
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest text-green-500 font-bold block bg-green-500/10 inline-block px-2 py-1 rounded border border-green-500/20">
              Critical Wins [SUCCESS]
            </label>
            <textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              className="w-full bg-black border border-white/10 p-4 text-sm font-mono h-28 focus:outline-none focus:border-green-500/50 resize-none text-zinc-300 placeholder:text-zinc-800"
              placeholder="> LOG_OPTIMAL_EXECUTION..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest text-red-500 font-bold block bg-red-500/10 inline-block px-2 py-1 rounded border border-red-500/20">
              Protocol Failures [ERROR]
            </label>
            <textarea
              value={failures}
              onChange={(e) => setFailures(e.target.value)}
              className="w-full bg-black border border-white/10 p-4 text-sm font-mono h-28 focus:outline-none focus:border-red-500/50 resize-none text-zinc-300 placeholder:text-zinc-800"
              placeholder="> LOG_SYSTEM_DEVIATION..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest text-accent font-bold block bg-accent/10 inline-block px-2 py-1 rounded border border-accent/20">
              Tactical Adjustments [PATCH]
            </label>
            <textarea
              value={adjustments}
              onChange={(e) => setAdjustments(e.target.value)}
              className="w-full bg-black border border-white/10 p-4 text-sm font-mono h-28 focus:outline-none focus:border-accent/50 resize-none text-zinc-300 placeholder:text-zinc-800"
              placeholder="> LOG_CORRECTIVE_ACTION..."
            />
          </div>

          {/* Link row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Mandate selector */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Link Mandate
              </label>
              <select
                value={selectedMandateId}
                onChange={(e) => setSelectedMandateId(e.target.value)}
                className="w-full bg-black border border-white/10 py-2 px-3 text-xs font-mono text-zinc-300 focus:outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="">[NONE]</option>
                {mandateOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mission selector */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1">
                <Target className="w-3 h-3" /> Link Mission
              </label>
              <select
                value={selectedMissionId}
                onChange={(e) => setSelectedMissionId(e.target.value)}
                className="w-full bg-black border border-white/10 py-2 px-3 text-xs font-mono text-zinc-300 focus:outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="">[NONE]</option>
                {missionOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.goal}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Attach Image
            </label>
            <input
              ref={imgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            {imagePreview ? (
              <div className="relative group w-full">
                <div className="relative w-full h-40 border border-white/10 overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-black/80 border border-white/20 text-white p-1 hover:border-red-500/50 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => imgInputRef.current?.click()}
                className="w-full border border-dashed border-white/10 hover:border-accent/30 py-4 text-zinc-600 hover:text-accent text-xs font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Click to attach image
              </button>
            )}
          </div>
        </div>

        {/* INITIATE_UPLOAD Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="relative group h-16 w-full overflow-hidden border border-white/10 bg-black hover:border-accent/50 transition-all"
        >
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]" />
          <div className="absolute inset-0 flex items-center justify-center gap-3 relative z-10">
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-accent font-bold tracking-widest uppercase text-sm">
                  Encrypting...
                </span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5 text-zinc-400 group-hover:text-accent transition-colors" />
                <span className="font-bold tracking-[0.2em] text-zinc-300 group-hover:text-white transition-colors uppercase text-sm">
                  INITIATE_UPLOAD
                </span>
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-accent/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <div className="absolute bottom-0 left-0 h-1 bg-accent w-0 group-hover:w-full transition-all duration-700 ease-in-out" />
        </button>
      </div>

      {/* History - Timeline View */}
      <div className="flex flex-col gap-6 h-full border-l border-white/5 pl-12 relative">
        <div className="absolute left-[24px] top-12 bottom-0 w-px bg-white/10" />

        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-zinc-500 border-b border-white/10 pb-2">
          <span>Archive_DB :: READ_ONLY</span>
          <span className="font-mono">{entries.length} RECORDS</span>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 py-4">
          {entries.length === 0 && (
            <div className="text-zinc-800 text-xs font-mono border border-dashed border-white/5 p-12 text-center uppercase tracking-widest bg-black/50">
              [NO_DATA_FOUND]
              <br />
              Initializing new archive protocol...
            </div>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="relative pl-8 group">
              {/* Timeline Node */}
              <div className="absolute -left-[30px] top-4 w-3 h-3 bg-black border border-white/20 rounded-full group-hover:border-accent group-hover:bg-accent group-hover:scale-125 transition-all z-10" />

              <div className="p-6 border border-white/10 bg-black/50 space-y-4 hover:border-white/20 transition-colors relative group cyber-border">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 group-hover:bg-accent transition-colors" />
                <div className="flex justify-between items-start">
                  <div className="text-xs font-mono text-accent bg-accent/5 px-2 py-1 border border-accent/20">
                    LOG_ID: {entry.id.slice(-6)}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Linked meta tags */}
                {(entry.mandate_id || entry.mission_id) && (
                  <div className="flex gap-2 flex-wrap">
                    {entry.mandate_id && (
                      <span className="text-[9px] font-mono border border-white/10 text-zinc-500 px-2 py-0.5 flex items-center gap-1">
                        <Link2 className="w-2.5 h-2.5" /> MANDATE
                      </span>
                    )}
                    {entry.mission_id && (
                      <span className="text-[9px] font-mono border border-accent/20 text-accent/70 px-2 py-0.5 flex items-center gap-1">
                        <Target className="w-2.5 h-2.5" /> MISSION
                      </span>
                    )}
                  </div>
                )}

                {/* Attached image */}
                {entry.image_url && (
                  <div className="relative w-full h-32 border border-white/10 overflow-hidden">
                    <Image
                      src={entry.image_url}
                      alt="Entry attachment"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 pt-2">
                  {entry.wins && (
                    <div className="space-y-1">
                      <div className="text-[9px] uppercase text-green-500/70 font-bold tracking-wider">
                        &gt;&gt; Wins
                      </div>
                      <p className="text-sm text-zinc-400 font-mono pl-2 border-l border-white/10">
                        {entry.wins}
                      </p>
                    </div>
                  )}
                  {entry.failures && (
                    <div className="space-y-1">
                      <div className="text-[9px] uppercase text-red-500/70 font-bold tracking-wider">
                        &gt;&gt; Failures
                      </div>
                      <p className="text-sm text-zinc-400 font-mono pl-2 border-l border-white/10">
                        {entry.failures}
                      </p>
                    </div>
                  )}
                  {entry.adjustments && (
                    <div className="space-y-1">
                      <div className="text-[9px] uppercase text-accent/70 font-bold tracking-wider">
                        &gt;&gt; Adjustments
                      </div>
                      <p className="text-sm text-zinc-400 font-mono pl-2 border-l border-white/10">
                        {entry.adjustments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
