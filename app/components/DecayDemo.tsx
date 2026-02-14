"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, TrendingDown, User } from 'lucide-react';

export const DecayDemo = () => {
    const [integrity, setIntegrity] = useState(80);

    return (
        <section className="min-h-screen flex items-center justify-center py-24 px-6 border-y border-white/5 bg-[#050505] relative overflow-hidden">
            <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row gap-24 items-center">

                <div className="flex-1 space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-accent/30 text-accent text-[10px] uppercase tracking-widest bg-accent/5">
                        <ShieldAlert className="w-3 h-3" /> Visual Accountability Engine
                    </div>

                    <h2 className="font-display font-black text-4xl md:text-6xl tracking-tighter leading-none">
                        WITNESS YOUR <br />
                        <span className="text-muted-foreground italic">AMBITION DECAY.</span>
                    </h2>

                    <p className="text-muted-foreground text-lg uppercase tracking-tight leading-relaxed max-w-md">
                        Execute <span className="text-white font-bold">80%+</span> of your daily protocol, or physically watch your ambition decay.
                        <br /><br />
                        Miss 3 days? <span className="text-red-500 font-bold">Ruin State</span> initiates. The image glitches out. Recovery requires a high-friction protocol or penalty.
                    </p>

                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-bold">
                            <span className="text-muted-foreground">Integrity Score</span>
                            <span className={integrity < 50 ? 'text-red-500' : 'text-accent'}>{integrity}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={integrity}
                            onChange={(e) => setIntegrity(parseInt(e.target.value))}
                            className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-accent"
                        />
                        <p className="text-[10px] text-muted-foreground uppercase flex gap-2 items-center">
                            <TrendingDown className="w-3 h-3" /> Drag slider to simulate missed days
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex justify-end relative">
                    <div className="relative aspect-square w-full max-w-md flex items-center justify-center">
                        {/* Character Visualization */}
                        <div className="relative w-72 h-72 bg-zinc-900 rounded-full flex items-center justify-center overflow-hidden border border-white/10 cyber-border">
                            <User className="w-48 h-48 text-white/10" />

                            {/* Visual Effects based on Integrity */}
                            <motion.div
                                animate={{
                                    opacity: (100 - integrity) / 100,
                                    scale: 1 + (100 - integrity) / 200,
                                }}
                                className="absolute inset-0 bg-red-500/20 mix-blend-overlay backdrop-blur-[2px]"
                                style={{
                                    filter: `grayscale(${100 - integrity}%) contrast(${100 + (100 - integrity)}%)`,
                                }}
                            />

                            {/* Glitch Overlay */}
                            {integrity < 40 && (
                                <div className="absolute inset-0 overflow-hidden opacity-50">
                                    <div className="glitch absolute inset-0 bg-red-500/20" />
                                </div>
                            )}
                        </div>

                        {/* UI Elements - Floating freely now */}
                        <div className="absolute top-0 -left-4 text-[8px] uppercase tracking-widest space-y-1">
                            <div className="text-accent">Protocol: ACTIVE</div>
                            <div className="text-muted-foreground">Target: 3:00 AM</div>
                        </div>

                        <div className="absolute bottom-0 -right-4 text-[8px] uppercase tracking-widest text-right space-y-1">
                            <div className={integrity < 30 ? 'text-red-500 font-bold' : 'text-muted-foreground'}>State: {integrity < 30 ? 'CRITICAL / RUIN' : 'STABLE'}</div>
                            <div className="text-white">NODE#8082</div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};
