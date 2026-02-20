"use client";

import { Mandates } from "@/components/dashboard/Mandates";

export default function MandatesPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-display font-black tracking-tighter uppercase mb-2">
                    Daily Mandates
                </h1>
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                    Define and execute your daily protocol.
                </p>
            </header>

            <Mandates />
        </div>
    );
}
