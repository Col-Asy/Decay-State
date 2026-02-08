"use client";

import { Button } from "@/components/ui/Button";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold uppercase tracking-widest mb-12 text-glow">
        Contract Selection
      </h1>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* TIER 1 */}
        <div className="border border-zinc-700 p-8 flex flex-col hover:border-zinc-500 transition-colors bg-zinc-900/20">
          <h2 className="text-xl font-bold mb-2">THE TOURIST</h2>
          <div className="text-3xl font-mono mb-6">
            $0<span className="text-sm text-zinc-500">/mo</span>
          </div>
          <ul className="space-y-3 font-mono text-sm text-zinc-400 mb-8 flex-1">
            <li>- Basic Visualization</li>
            <li>- High Decay Rate</li>
            <li>- Standard Entropy</li>
          </ul>
          <Button variant="secondary" className="w-full">
            INITIATE FREE
          </Button>
        </div>

        {/* TIER 2 */}
        <div className="border-2 border-white p-8 flex flex-col bg-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-white text-black text-[10px] font-bold px-2 py-1 uppercase">
            Recommended
          </div>
          <h2 className="text-xl font-bold mb-2">THE PROTAGONIST</h2>
          <div className="text-3xl font-mono mb-6">
            $15<span className="text-sm text-zinc-500">/mo</span>
          </div>
          <ul className="space-y-3 font-mono text-sm text-zinc-300 mb-8 flex-1">
            <li>- Weekly Evolution</li>
            <li>- AI Verification</li>
            <li>- Data Immunity</li>
            <li>- Priority Processing</li>
          </ul>
          <Button className="w-full bg-white text-black hover:bg-zinc-200">
            SIGN CONTRACT
          </Button>
        </div>
      </div>

      <button className="mt-12 text-zinc-600 text-xs hover:text-zinc-400 uppercase tracking-widest">
        Return to Dashboard
      </button>
    </div>
  );
}
