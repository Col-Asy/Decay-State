"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Send, Loader2, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
}

interface Mandate {
  label: string;
  category: "physical" | "intellectual" | "spiritual";
  rationale: string;
}

interface OnboardingChatProps {
  goal: string;
  manifesto: string;
  timeframe: string;
  onComplete: (mandates: Mandate[]) => void;
  onSkip: () => void;
}

export function OnboardingChat({ goal, manifesto, timeframe, onComplete, onSkip }: OnboardingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [generatedMandates, setGeneratedMandates] = useState<Mandate[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Initial trigger
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    // Automatically send an invisible "START" message to trigger the AI's first question
    sendMessage("START_ONBOARDING", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generatedMandates]);

  const sendMessage = async (text: string, isInit = false) => {
    if ((!text.trim() && !isInit) || isLoading || isFinished) return;

    if (!isInit) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "user", text }
      ]);
      setInput("");
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: isInit ? "I am ready. Ask me the first question." : text,
          history: isInit ? [] : messages,
          goal,
          manifesto,
          timeframe,
        }),
      });

      if (!response.ok) throw new Error("Network error");

      const reader = response.body?.getReader();
      if (!reader) return;

      const aiMsgId = Date.now().toString() + "ai";
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, sender: "ai", text: "" },
      ]);

      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (!value) continue;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6);
          if (!dataStr.trim()) continue;

          try {
            const event = JSON.parse(dataStr);

            if (event.type === "text") {
              accumulatedText += event.content;
              const displayText = accumulatedText.replace(/ONBOARDING_COMPLETE[\s\S]*$/, "").trim();
              
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId ? { ...msg, text: displayText } : msg,
                ),
              );
            } else if (event.type === "mandates_generated") {
              setIsFinished(true);
              setGeneratedMandates(event.mandates);
            } else if (event.type === "error") {
              console.error("Chat error:", event.content);
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    } catch (error) {
      console.error("Chat failure:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "err", sender: "ai", text: "SYSTEM ERROR. CONNECTION LOST." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 md:p-8 font-mono"
    >
      <div className="w-full max-w-2xl h-full max-h-[800px] flex flex-col border border-white/10 cyber-border relative overflow-hidden bg-[#050505]">
        
        {/* Header */}
        <header className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/50 backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-5 h-5 text-accent animate-pulse" />
            <div>
              <h2 className="text-white font-bold uppercase tracking-widest text-sm">Neural Link</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Protocol Induction Matrix</p>
            </div>
          </div>
          <button 
            onClick={onSkip}
            className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-white/10 px-3 py-1 hover:border-white/30"
          >
            Skip Induction
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative z-10">
          <AnimatePresence>
            {messages.filter(m => m.text).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 ${
                    msg.sender === "user"
                      ? "border border-white/15 bg-white/[0.03] text-white"
                      : "border-l-2 border-accent/70 bg-accent/[0.03] text-white pl-4"
                  }`}
                >
                  {msg.sender === "ai" && (
                    <span className="block text-[9px] text-accent/50 mb-2 font-bold tracking-widest uppercase flex items-center gap-1.5">
                      <BrainCircuit className="w-3 h-3" /> SYSTEM
                    </span>
                  )}
                  {msg.sender === "ai" ? (
                    <div className="text-xs md:text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-accent">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-xs md:text-sm leading-relaxed text-white/90">
                      {msg.text}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Mandate Generation Results */}
          {isFinished && generatedMandates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 border border-accent/30 bg-accent/5 p-6 space-y-4"
            >
              <div className="text-center space-y-1 pb-4 border-b border-accent/10">
                <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-2" />
                <h3 className="text-lg font-bold uppercase tracking-widest text-white">Induction Complete</h3>
                <p className="text-xs text-zinc-400">Initial operational mandates generated.</p>
              </div>

              <div className="grid gap-2">
                {generatedMandates.map((m, i) => (
                  <div key={i} className="bg-black/40 border border-white/5 p-3 flex gap-3 text-xs">
                    <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 uppercase self-start mt-0.5 ${
                      m.category === "physical" ? "text-red-400 bg-red-400/10" :
                      m.category === "intellectual" ? "text-blue-400 bg-blue-400/10" :
                      "text-purple-400 bg-purple-400/10"
                    }`}>
                      {m.category.slice(0, 4)}
                    </span>
                    <div>
                      <div className="font-bold text-white mb-0.5">{m.label}</div>
                      <div className="text-[10px] text-zinc-500">{m.rationale}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onComplete(generatedMandates)}
                className="w-full bg-accent text-black font-bold uppercase tracking-widest py-3 mt-4 hover:bg-white transition-colors text-xs"
              >
                Accept Mandates & Proceed
              </button>
            </motion.div>
          )}

          {isLoading && !isFinished && (
            <div className="flex items-center gap-2 text-[10px] text-accent/50 uppercase tracking-widest">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-sm shrink-0 relative z-10">
          <div className="relative group">
            <div className={`absolute inset-0 bg-accent/10 blur-xl opacity-0 transition-opacity ${!isFinished && !isLoading && 'group-focus-within:opacity-30'}`} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder={isFinished ? "INDUCTION COMPLETE." : "Respond to protocol..."}
              disabled={isLoading || isFinished}
              readOnly={isFinished}
              autoFocus
              className="w-full bg-[#0a0a0a] border border-white/10 p-4 pr-12 focus:outline-none focus:border-accent focus:text-white text-zinc-400 placeholder:text-zinc-700 font-mono text-sm relative z-20 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || isFinished || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-accent disabled:opacity-30 p-2 z-30 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
