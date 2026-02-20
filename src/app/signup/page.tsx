"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Cpu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        auth.signup(name, email);
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen w-full bg-black text-white flex items-center justify-center relative overflow-hidden p-6 font-mono">
            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>

            {/* Back Button */}
            <Link href="/" className="absolute top-8 left-8 text-white/50 hover:text-accent transition-colors flex items-center gap-2 text-xs tracking-widest uppercase z-20">
                <ArrowLeft className="w-4 h-4" />
                Return to Surface
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="border border-white/10 bg-[#050505] p-8 md:p-10 relative overflow-hidden group">
                    {/* Decorative Corner */}
                    <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-accent/20 -translate-y-10 -translate-x-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500" />

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-accent text-xs tracking-[0.2em] mb-4">
                                <Cpu className="w-4 h-4" />
                                <span>SYSTEM: NEW_REGISTRATION</span>
                            </div>
                            <h1 className="font-display font-black text-4xl uppercase tracking-tighter">
                                Join <br /> Protocol
                            </h1>
                            <p className="text-white/40 text-xs tracking-wide">
                                Commence your transformation. No looking back.
                            </p>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/60">Designation / Name</label>
                                    <Input
                                        type="text"
                                        placeholder="YOUR NAME"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-accent/50 h-11 font-mono text-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/60">Communication ID</label>
                                    <Input
                                        type="email"
                                        placeholder="EMAIL ADDRESS"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-accent/50 h-11 font-mono text-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/60">Set Security Key</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-accent/50 h-11 font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    className="w-full bg-accent text-black hover:bg-accent/90 border-accent h-12 text-xs tracking-[0.2em] font-black"
                                    disabled={loading}
                                >
                                    {loading ? "PROCESSING..." : "ACTIVATE PROTOCOL"}
                                </Button>
                            </div>

                            <div className="text-center text-[10px] uppercase tracking-wider text-white/40 pt-4 border-t border-white/5">
                                <span className="mr-2">Existing Entity?</span>
                                <Link href="/login" className="text-white hover:text-accent transition-colors underline decoration-white/30 underline-offset-4">
                                    Access Terminal
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="mt-4 flex items-center justify-between text-[8px] uppercase tracking-[0.2em] text-white/20">
                    <span>Registration Open</span>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Secure</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
