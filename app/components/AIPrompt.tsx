"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, ShieldCheck, XCircle, Zap } from 'lucide-react';

export const AIPrompt = () => {
    const [step, setStep] = useState(0);
    const [input, setInput] = useState('');

    const conversation = [
        { role: 'ai', text: 'State your vision. What must happen in the next 90 days?' },
        { role: 'user', text: 'I want to launch my startup and get fit.' },
        { role: 'ai', text: 'Vague. Unacceptable. Define the MRR target. Define the body fat %. Define the daily hours of deep work.' },
        { role: 'user', text: '$10k MRR, 12% body fat, 4 hours deep work daily.' },
        { role: 'ai', text: 'Accepted. Generating visual trajectory... If you fail >20% of days, this vision will degrade.' }
    ];

    return (
        <section className="min-h-screen flex items-center justify-center py-12 px-6 bg-black relative">
            <div className="w-full max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h2 className="font-display font-black text-4xl uppercase tracking-tighter">Enter the Protocol</h2>
                    <p className="text-muted-foreground uppercase tracking-widest text-[10px]">AI-Vetted Commitments Only. No Excuses.</p>
                </div>

                <div className="cyber-border bg-[#0a0a0a] min-h-[200px] flex flex-col">
                    {/* Terminal Header */}
                    <div className="border-b border-white/5 p-4 flex justify-between items-center">
                        <div className="flex gap-2 items-center">
                            <Terminal className="w-3 h-3 text-accent" />
                            <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground italic">V0.9-BETA: ENCRYPTED_CHANNEL</span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500/50" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                            <div className="w-2 h-2 rounded-full bg-accent/50" />
                        </div>
                    </div>

                    {/* Chat Body */}
                    <div className="flex-1 p-6 font-mono text-sm space-y-6 overflow-y-auto">
                        <AnimatePresence>
                            {conversation.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                    className={`flex gap-4 ${msg.role === 'ai' ? 'text-accent' : 'text-white'}`}
                                >
                                    <span className="opacity-50 shrink-0">[{msg.role.toUpperCase()}]</span>
                                    <span className={msg.role === 'ai' ? 'glow-text' : ''}>{msg.text}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <div className="flex gap-4 text-white animate-pulse">
                            <span className="opacity-50 shrink-0">[USER]</span>
                            <span className="border-l-2 border-accent h-5 ml-1" />
                        </div>
                    </div>

                    {/* Input Bar */}
                    <div className="p-4 border-t border-white/10 flex gap-4 bg-zinc-950/50">
                        <input
                            placeholder="PROMPT YOUR REALITY..."
                            className="flex-1 bg-transparent border-none outline-none text-sm uppercase tracking-widest text-white placeholder:text-white/20"
                        />
                        <button className="bg-accent text-black p-2 cyber-border flex items-center justify-center">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                    <div className="p-4 border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-accent">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">AI Verdict</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase leading-relaxed tracking-wider">
                            Our AI generates your "Future Self" based on strict inputs. If you can't verify progress, the image degrades.
                        </p>
                    </div>

                    <div className="p-4 border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-red-500">
                            <XCircle className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">No Support</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase leading-relaxed tracking-wider">
                            This isn't a cheerleader. It's a warden. It detects lies, excuses, and "off-days" instantly.
                        </p>
                    </div>

                    <div className="p-4 border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-white">
                            <Zap className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Pulse Check</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase leading-relaxed tracking-wider">
                            Daily verifiable check-ins. Miss 3 days and the "Ruin Protocol" initiates.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
