"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, X } from "lucide-react";

// Lightweight markdown renderer for streamed AI responses
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // H2/H3 headers
    if (/^###\s/.test(line)) {
      return <div key={i} className="text-accent font-black text-[11px] tracking-[0.2em] uppercase mt-3 mb-1">{line.replace(/^###\s/, "")}</div>;
    }
    if (/^##\s/.test(line)) {
      return <div key={i} className="text-white font-black text-xs tracking-[0.15em] uppercase mt-4 mb-1 border-b border-white/10 pb-1">{line.replace(/^##\s/, "")}</div>;
    }
    // Bullet list
    if (/^[-*]\s/.test(line)) {
      const content = renderInline(line.replace(/^[-*]\s/, ""));
      return <div key={i} className="flex gap-2 items-start pl-2"><span className="text-accent mt-0.5 shrink-0">›</span><span>{content}</span></div>;
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)![1];
      const content = renderInline(line.replace(/^\d+\.\s/, ""));
      return <div key={i} className="flex gap-2 items-start pl-2"><span className="text-accent shrink-0 font-bold">{num}.</span><span>{content}</span></div>;
    }
    // Empty line → spacer
    if (line.trim() === "") return <div key={i} className="h-2" />;
    // Normal paragraph
    return <div key={i}>{renderInline(line)}</div>;
  });
}

function renderInline(text: string): React.ReactNode {
  // Process **bold** and *italic*
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[0].startsWith("**")) {
      parts.push(<strong key={match.index} className="text-white font-bold">{match[2]}</strong>);
    } else {
      parts.push(<em key={match.index} className="text-white/80 italic">{match[3]}</em>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

const RotatingPolygon = ({ className = "w-5 h-5" }: { className?: string }) => {
    return (
        <motion.svg
            viewBox="0 0 100 100"
            className={`${className} relative z-10`}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
            <polygon
                points="50,5 90,25 90,75 50,95 10,75 10,25"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinejoin="round"
            />
        </motion.svg>
    );
};

export const GlobalSearch = () => {
    const [isFocused, setIsFocused] = useState(false);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [answerText, setAnswerText] = useState("");
    const [showPanel, setShowPanel] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

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

    useEffect(() => {
        const handleScroll = () => {
            const pricingSection = document.getElementById("pricing");
            const scrollY = window.scrollY;
            const heroHeight = window.innerHeight; // Approximate Hero section height

            let shouldBeVisible = false;

            if (scrollY > heroHeight * 0.8) {
                shouldBeVisible = true;
            }

            if (pricingSection) {
                const rect = pricingSection.getBoundingClientRect();
                if (rect.bottom < 0) {
                    shouldBeVisible = false;
                }
            }

            setIsVisible(shouldBeVisible);
        };

        const checkPath = () => {
            const path = window.location.pathname;
            if (path === '/sys-access' || path === '/entity-init' || path === '/waitlist') {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        checkPath();
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        // Cancel previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        setShowPanel(true);
        setAnswerText("");

        try {
            const res = await fetch("/api/landing-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
                signal: controller.signal,
            });

            if (!res.ok) {
                throw new Error("Failed to fetch response");
            }

            const reader = res.body?.getReader();
            if (!reader) {
                setIsLoading(false);
                return;
            }

            const decoder = new TextDecoder();
            setIsLoading(false);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                setAnswerText((prev) => prev + chunk);
            }
        } catch (error: any) {
            if (error.name !== "AbortError") {
                console.error("Search query failed:", error);
                setAnswerText("ERROR: FAILED TO RETRIEVE DECISION MATRIX FROM SWITCH PROTOCOL.");
                setIsLoading(false);
            }
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 pointer-events-none">
            {/* Answer Panel Displayed Above Input */}
            <AnimatePresence>
                {showPanel && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="mb-4 p-6 bg-black/95 border border-white/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] pointer-events-auto backdrop-blur-md font-mono"
                    >
                        <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                            <span className="text-[10px] uppercase text-accent tracking-[0.2em] flex items-center gap-2">
                                <RotatingPolygon className="w-3.5 h-3.5 text-accent" /> SYSTEM INQUIRY RESPONSE
                            </span>
                            <button
                                onClick={() => {
                                    if (abortControllerRef.current) {
                                        abortControllerRef.current.abort();
                                    }
                                    setShowPanel(false);
                                    setAnswerText("");
                                }}
                                className="text-white/40 hover:text-white flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors"
                            >
                                <X className="w-3 h-3" /> [ Close ]
                            </button>
                        </div>
                        <div className="text-xs text-white/90 leading-relaxed max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 space-y-1">
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-white/40">
                                    <span className="animate-pulse">PROCESSING ENCRYPTED DATAFEED...</span>
                                </div>
                            ) : (
                                renderMarkdown(answerText)
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSearchSubmit} className="pointer-events-auto">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`
              relative flex items-center gap-4 px-6 py-4 
              bg-black border border-white/20 
              rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)]
              transition-all duration-300 ease-out group
              ${isFocused ? "border-accent ring-1 ring-accent/60 shadow-[0_0_60px_-10px_rgba(163,230,53,0.6)] scale-[1.02]" : "hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"}
            `}
                >
                    {/* Animated Glow Gradient */}
                    <div className={`absolute -inset-[1px] rounded-full bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 transition-opacity duration-500 ${isFocused ? "opacity-100" : "group-hover:opacity-30"}`} />

                    <RotatingPolygon className={`w-5 h-5 ${isFocused ? "text-accent" : "text-white/40"} transition-colors duration-300`} />

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
                        <button
                            type="submit"
                            disabled={!query.trim()}
                            className={`p-1.5 rounded-lg border transition-all duration-300 ${
                                isFocused || query
                                    ? "bg-accent border-accent text-black hover:bg-accent/90 cursor-pointer"
                                    : "bg-white/5 border-white/10 text-white/30 cursor-default"
                            }`}
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </form>
        </div>
    );
};
