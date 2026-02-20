"use client";

import { AIChat } from "@/components/dashboard/AIChat";
import { auth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { UserState } from "@/types";

export default function ChatPage() {
    const [user, setUser] = useState<UserState | null>(null);

    useEffect(() => {
        const u = auth.getUser();
        if (u) setUser(u);
    }, []);

    if (!user) return null;

    return (
        <div className="h-screen p-8 flex flex-col max-w-5xl mx-auto">
            <header className="mb-4 shrink-0">
                <h1 className="text-3xl font-display font-black tracking-tighter uppercase mb-2">
                    Neural Link
                </h1>
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                    Direct uplink to Protocol AI.
                </p>
            </header>

            <div className="flex-1 border border-zinc-800 overflow-hidden">
                <AIChat integrity={user.integrity} />
            </div>
        </div>
    );
}
