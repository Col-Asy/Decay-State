"use client";

import { Mandates } from "@/components/dashboard/Mandates";

export default function MandatesPage() {
    return (
        <div className="h-[calc(100vh-4rem)] md:h-screen p-4 md:p-8 flex flex-col w-full space-y-6">
            <header className="shrink-0 text-center">
                <h1 className="text-3xl font-display font-black tracking-tighter uppercase mb-1">
                    Daily Tasks
                </h1>
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                    Define and execute your daily protocol.
                </p>
            </header>

            <div className="flex-1 overflow-hidden">
                <Mandates />
            </div>
        </div>
    );
}
