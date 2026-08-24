"use client";

import { useState, useEffect } from "react";
import { AIChat } from "@/components/dashboard/AIChat";
import { useAuth } from "@/context/AuthContext";
import { getMandates } from "@/lib/db/mandates";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const [integrity, setIntegrity] = useState(0);

  useEffect(() => {
    if (!user) return;
    getMandates(user.id).then((tasks) => {
      if (tasks.length > 0) {
        setIntegrity(
          Math.round(
            (tasks.filter((t) => t.completed).length / tasks.length) * 100,
          ),
        );
      }
    });
  }, [user]);

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen p-4 md:p-8 flex flex-col max-w-full mx-auto">
      <header className="mb-4 shrink-0 text-center">
        <h1 className="text-3xl font-display font-black tracking-tighter uppercase mb-2">
          Neural Link
        </h1>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
          Direct uplink to Protocol AI — Agent Mode Active
        </p>
      </header>

      <div className="flex-1 border border-zinc-800 overflow-hidden">
        <AIChat integrity={integrity} />
      </div>
    </div>
  );
}
