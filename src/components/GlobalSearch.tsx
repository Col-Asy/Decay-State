"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, ArrowRight, CornerDownLeft, Sparkles } from "lucide-react";

export const GlobalSearch = () => {
    const [isFocused, setIsFocused] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle keyboard shortcut (Ctrl/Cmd + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const [isVisible, setIsVisible] = useState(false);
    // Use window.location.pathname check inside useEffect to avoid hydration mismatch if possible, 
    // or just assume client-side rendering is fine here given "use client"

    useEffect(() => {
        const handleScroll = () => {
            const pricingSection = document.getElementById("pricing");
            const scrollY = window.scrollY;
            const heroHeight = window.innerHeight; // Approximate Hero section height

            // Default to hidden
            let shouldBeVisible = false;

            // Rule 1: Must be past Hero section (scrolled more than 100vh)
            if (scrollY > heroHeight * 0.8) { // 0.8 buffer to show it as they leave hero
                shouldBeVisible = true;
            }

            // Rule 2: Must be before Pricing section ends
            if (pricingSection) {
                const rect = pricingSection.getBoundingClientRect();
                // If pricing section is scrolled past (bottom < 0), hide it
                if (rect.bottom < 0) {
                    shouldBeVisible = false;
                }
            }

            // Apply visibility
            setIsVisible(shouldBeVisible);
        };

        const checkPath = () => {
            const path = window.location.pathname;
            if (path === '/login' || path === '/signup') {
                setIsVisible(false);
            } else {
                // Initial check for scroll position will happen in handleScroll
            }
        };

        window.addEventListener("scroll", handleScroll);
        checkPath();
        handleScroll(); // Check on mount

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 pointer-events-none">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`
          relative flex items-center gap-4 px-6 py-4 
          bg-black border border-white/20 
          rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] pointer-events-auto
          transition-all duration-300 ease-out group
          ${isFocused ? "border-accent ring-1 ring-accent/60 shadow-[0_0_60px_-10px_rgba(var(--accent-rgb),0.6)] scale-[1.02]" : "hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"}
        `}
            >
                {/* Animated Glow Gradient */}
                <div className={`absolute -inset-[1px] rounded-full bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 transition-opacity duration-500 ${isFocused ? "opacity-100" : "group-hover:opacity-30"}`} />

                <Sparkles className={`w-5 h-5 relative z-10 ${isFocused ? "text-accent" : "text-white/40"} transition-colors duration-300`} />

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Ask the protocol anything..."
                    className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder:text-white/30 font-medium tracking-wide relative z-10"
                />

                <div className="flex items-center gap-2 relative z-10">
                    <AnimatePresence mode="wait">
                        {!isFocused && !query && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/40 font-mono tracking-wider"
                            >
                                <Command className="w-3 h-3" />
                                <span>K</span>
                            </motion.div>
                        )}

                        {(isFocused || query) && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="p-1.5 rounded-lg bg-accent text-black hover:bg-accent/90 transition-colors"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
