"use client";

import { Journal } from "@/components/dashboard/Journal";

export default function JournalPage() {
    return (
        <div className="p-4 md:p-8 w-full space-y-8">
            <header className="text-center">
                <h1 className="text-3xl font-display font-black tracking-tighter uppercase mb-2">
                    Protocol Log
                </h1>
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                    Review performance. Honest assessment is the only path to optimization.
                </p>
            </header>

            <Journal />
        </div>
    );
}
