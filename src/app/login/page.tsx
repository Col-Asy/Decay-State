"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldAlert, Terminal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Simulate network delay for effect
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (auth.login(username, password)) {
            router.push("/dashboard");
        } else {
            setError("ACCESS DENIED: Invalid Credentials");
            setLoading(false);
        }
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
                    <div className="absolute top-0 right-0 w-20 h-20 border-t border-r border-accent/20 -translate-y-10 translate-x-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500" />

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-accent text-xs tracking-[0.2em] mb-4">
                                <Terminal className="w-4 h-4" />
                                <span>SYSTEM: RE-ENTRY</span>
                            </div>
                            <h1 className="font-display font-black text-4xl uppercase tracking-tighter">
                                Resume <br /> Protocol
                            </h1>
                            <p className="text-white/40 text-xs tracking-wide">
                                Verify retention. Log your daily execution.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-4">
                                {error && (
                                    <div className="text-red-500 text-[10px] uppercase tracking-widest bg-red-500/10 p-2 border border-red-500/20">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/60">Identity Name</label>
                                    <Input
                                        type="text"
                                        placeholder="USER_ID"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-accent/50 h-11 font-mono text-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/60">Passcode</label>
                                    <Input
                                        type="password"
                                        placeholder="PASSCODE"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-accent/50 h-11 font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    className="w-full bg-accent text-black hover:bg-accent/90 border-accent h-12 text-xs tracking-[0.2em] font-black"
                                    disabled={loading}
                                >
                                    {loading ? "AUTHENTICATING..." : "INITIATE SESSION"}
                                </Button>
                            </div>

                            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-white/40 pt-4 border-t border-white/5">
                                <Link href="/signup" className="hover:text-white transition-colors">
                                    Initialize New Protocol
                                </Link>
                                <div className="text-[8px]">
                                    Use: admin / password
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="mt-4 flex items-center justify-between text-[8px] uppercase tracking-[0.2em] text-white/20">
                    <span>Encrypted Connection</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span>Online</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
