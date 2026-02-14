"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShieldAlert } from 'lucide-react';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="border border-white/5 bg-zinc-950/30 hover:bg-zinc-950/50 transition-colors">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex justify-between items-center text-left px-6"
            >
                <span className="font-display font-medium uppercase tracking-widest text-sm text-white/80">{question}</span>
                {isOpen ? <Minus className="w-4 h-4 text-accent" /> : <Plus className="w-4 h-4 text-muted-foreground" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 text-[10px] uppercase tracking-wider text-muted-foreground leading-relaxed max-w-3xl border-t border-white/5 pt-4">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const FAQ = () => {
    const faqs = [
        {
            question: "Is the AI actually watching me?",
            answer: "In Protocol Elite, yes. You upload photo proof. The AI vision model analyzes it against your stated goal. If you say you went to the gym, it looks for gym equipment/environment. If you lie, it rejects it."
        },
        {
            question: "What happens if I miss 3 days?",
            answer: "Ruin State. Your avatar becomes fully corrupted. You cannot access normal features until you complete a 'Recovery Protocol'—usually a double-session of your core habit or a $5 penalty fee."
        },
        {
            question: "Is my data private?",
            answer: "We are strict on accountability, strict on privacy. Your photos are processed by the AI and immediately discarded. Only the generated 'Avatar' evolution is stored."
        },
        {
            question: "Can I use this for any goal?",
            answer: "No. The AI rejects vague goals like 'be happier.' It accepts only measurable, binary protocols. 'Code for 4 hours', 'Run 5km', 'Read 20 pages'."
        }
    ];

    return (
        <section className="min-h-screen flex items-center justify-center py-24 px-6 bg-black">
            <div className="w-full max-w-3xl mx-auto space-y-20">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h2 className="font-display font-black text-4xl uppercase tracking-tighter text-white/50">
                        Protocol Details
                    </h2>
                    <div className="w-12 h-1 bg-accent/20 mx-auto" />
                </div>

                <div className="grid grid-cols-1 gap-12">

                    {/* The Warning Section (Moved from Pricing) */}
                    <div className="bg-red-500/5 border border-red-500/20 p-8 cyber-border relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-50">
                            <ShieldAlert className="w-12 h-12 text-red-900/20 group-hover:text-red-500/20 transition-colors" />
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
                                <ShieldAlert className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-display font-black uppercase tracking-widest text-xl text-white">The Ruin Protocol Warning</h3>
                                <p className="text-xs text-red-500/70 uppercase leading-relaxed tracking-wider max-w-2xl">
                                    Failure to check in for 3 consecutive days triggers the "Ruin State".
                                    Recovery requires a $5 fee or executing a high-friction protocol.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FAQ List */}
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <FAQItem key={i} {...faq} />
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};
