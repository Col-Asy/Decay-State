"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types";
import { Send, Plus, Target, Check, Loader2, BrainCircuit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { logActivity } from "@/lib/activityLog";
import { useAuth } from "@/context/AuthContext";
import { addMandate } from "@/lib/db/mandates";
import { upsertActiveMission } from "@/lib/db/mission";
import { getMandates } from "@/lib/db/mandates";

interface AIChatProps {
  integrity: number;
}

interface ExtractedActions {
  mandates: { label: string; category: string; rationale?: string }[];
  mission?: { goal: string; timeframe: string } | null;
}

interface ActionMessage {
  actions: ExtractedActions;
  applied: { mandates: boolean; mission: boolean };
}

export function AIChat({ integrity }: AIChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = sessionStorage.getItem("switch_chat_messages");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [extractingActions, setExtractingActions] = useState(false);
  const [actionMessages, setActionMessages] = useState<
    Map<string, ActionMessage>
  >(() => {
    if (typeof window === "undefined") return new Map();
    const saved = sessionStorage.getItem("switch_chat_actions");
    return saved ? new Map(JSON.parse(saved)) : new Map();
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "init",
          sender: "ai",
          text: "Protocol initialized. Neural Link active. I can help you manage your mandates, break down tasks, update your mission, and track your progress. What do you need?",
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  // Persist messages and actions
  useEffect(() => {
    sessionStorage.setItem("switch_chat_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(
      "switch_chat_actions",
      JSON.stringify(Array.from(actionMessages.entries())),
    );
  }, [actionMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, actionMessages]);

  // Extract actions from AI response (old flow)
  const extractActions = async (aiResponse: string, msgId: string) => {
    setExtractingActions(true);
    try {
      const currentMandates = user ? await getMandates(user.id) : [];
      const res = await fetch("/api/chat/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiResponse, currentMandates }),
      });
      const actions: ExtractedActions = await res.json();
      if (actions.mandates.length > 0 || actions.mission) {
        setActionMessages((prev) => {
          const next = new Map(prev);
          next.set(msgId, {
            actions,
            applied: { mandates: false, mission: false },
          });
          return next;
        });
      }
    } catch (err) {
      console.error("Action extraction failed:", err);
    } finally {
      setExtractingActions(false);
    }
  };

  // Normalize category to match DB constraint (physical | intellectual | spiritual)
  const normalizeCategory = (
    cat: string,
  ): "physical" | "intellectual" | "spiritual" => {
    const c = cat.toLowerCase().trim();
    if (c.startsWith("phys")) return "physical";
    if (
      c.startsWith("int") ||
      c.startsWith("ment") ||
      c.startsWith("acad") ||
      c.startsWith("stud")
    )
      return "intellectual";
    if (c.startsWith("spir") || c.startsWith("mind") || c.startsWith("med"))
      return "spiritual";
    return "intellectual"; // safe default
  };

  // Apply mandates (old flow — user confirms)
  const applyMandates = async (msgId: string) => {
    const am = actionMessages.get(msgId);
    if (!am || !user) return;

    for (const m of am.actions.mandates) {
      await addMandate(user.id, {
        label: m.label,
        category: normalizeCategory(m.category),
        rationale: m.rationale,
        completed: false,
      });
    }
    logActivity(
      "ai",
      `${am.actions.mandates.length} mandates added via Neural Link`,
      user.id,
    );

    setActionMessages((prev) => {
      const next = new Map(prev);
      next.set(msgId, {
        ...am,
        applied: { ...am.applied, mandates: true },
      });
      return next;
    });
  };

  // Apply mission update (old flow — user confirms)
  const applyMission = async (msgId: string) => {
    const am = actionMessages.get(msgId);
    if (!am?.actions.mission || !user) return;

    await upsertActiveMission(user.id, {
      goal: am.actions.mission.goal,
      timeframe: am.actions.mission.timeframe,
    });
    logActivity(
      "mission",
      `Mission updated via Neural Link: "${am.actions.mission.goal}"`,
      user.id,
    );

    setActionMessages((prev) => {
      const next = new Map(prev);
      next.set(msgId, {
        ...am,
        applied: { ...am.applied, mission: true },
      });
      return next;
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages,
          integrity,
          userId: user?.id,
        }),
      });

      if (!response.ok) throw new Error("Network error");

      const reader = response.body?.getReader();
      if (!reader) return;

      const aiMsgId = Date.now().toString() + "ai";
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, sender: "ai", text: "", timestamp: Date.now() },
      ]);

      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);

        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          try {
            const event = JSON.parse(data);

            if (event.type === "text") {
              accumulatedText += event.content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId ? { ...msg, text: accumulatedText } : msg,
                ),
              );
            } else if (event.type === "error") {
              accumulatedText += "\n\n⚠️ " + event.content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId ? { ...msg, text: accumulatedText } : msg,
                ),
              );
            }
          } catch {
            // Skip malformed events
          }
        }
      }

      // After streaming, extract actions from the AI response (old flow)
      if (accumulatedText.length > 50) {
        extractActions(accumulatedText, aiMsgId);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "err",
          sender: "ai",
          text: "CONNECTION ERROR. RETRY.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full cyber-border bg-black/50 p-6 font-mono text-sm shadow-[0_0_50px_-20px_rgba(255,255,255,0.1)]">
      {/* Terminal Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4 opacity-50 text-[10px] tracking-widest uppercase">
        <span className="flex items-center gap-2">
          <BrainCircuit className="w-3 h-3" />
          NEURAL_LINK :: AGENT_MODE
        </span>
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse delay-75" />
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse delay-150" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-6 custom-scrollbar pr-1">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[90%] p-4 ${
                  msg.sender === "user"
                    ? "border border-white/15 bg-white/[0.03] text-white"
                    : "border-l-2 border-accent/70 bg-accent/[0.03] text-white pl-4"
                }`}
              >
                {msg.sender === "ai" && (
                  <span className="block text-[9px] text-accent/50 mb-2 font-bold tracking-widest uppercase">
                    SYSTEM_RESPONSE
                  </span>
                )}
                {msg.sender === "ai" ? (
                  <div
                    className="leading-relaxed text-xs md:text-sm prose prose-invert prose-sm max-w-none
                    prose-p:my-1.5 prose-p:text-white/90
                    prose-strong:text-accent prose-strong:font-bold
                    prose-headings:text-accent prose-headings:font-display prose-headings:text-sm prose-headings:mt-3 prose-headings:mb-1
                    prose-ul:my-1.5 prose-ul:pl-4 prose-li:text-white/90 prose-li:my-0.5 prose-li:marker:text-accent/50
                    prose-ol:my-1.5 prose-ol:pl-4
                    prose-code:text-accent prose-code:bg-accent/10 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:rounded prose-code:font-mono
                    prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-white/10 prose-pre:p-3 prose-pre:my-2
                    prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                  "
                  >
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="leading-relaxed text-xs md:text-sm text-white/90">
                    {msg.text}
                  </div>
                )}
              </div>

              {/* Action Cards — same as original */}
              {msg.sender === "ai" &&
                actionMessages.has(msg.id) &&
                (() => {
                  const am = actionMessages.get(msg.id)!;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-[90%] mt-2 space-y-2"
                    >
                      {am.actions.mandates.length > 0 && (
                        <div className="border border-accent/20 bg-accent/[0.03] p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] text-accent/70 font-bold tracking-widest uppercase flex items-center gap-1.5">
                              <Plus className="w-3 h-3" />
                              GENERATED MANDATES ({am.actions.mandates.length})
                            </span>
                            {!am.applied.mandates ? (
                              <button
                                onClick={() => applyMandates(msg.id)}
                                className="text-[9px] font-bold tracking-wider uppercase bg-accent text-black px-2 py-1 hover:bg-white transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add All
                              </button>
                            ) : (
                              <span className="text-[9px] font-bold tracking-wider uppercase text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Added
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            {am.actions.mandates.map((m, i) => (
                              <div
                                key={i}
                                className="text-xs text-white/80 flex items-start gap-2 py-1 border-t border-white/5 first:border-0"
                              >
                                <span
                                  className={`text-[8px] px-1 py-0.5 rounded uppercase font-bold shrink-0 mt-0.5 ${
                                    m.category === "physical"
                                      ? "bg-red-500/20 text-red-400"
                                      : m.category === "intellectual"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-purple-500/20 text-purple-400"
                                  }`}
                                >
                                  {m.category.slice(0, 4)}
                                </span>
                                <div>
                                  <span className="text-white/90">
                                    {m.label}
                                  </span>
                                  {m.rationale && (
                                    <span className="text-white/40 ml-1 text-[10px]">
                                      — {m.rationale}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {am.actions.mission && (
                        <div className="border border-accent/20 bg-accent/[0.03] p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] text-accent/70 font-bold tracking-widest uppercase flex items-center gap-1.5">
                              <Target className="w-3 h-3" />
                              MISSION UPDATE
                            </span>
                            {!am.applied.mission ? (
                              <button
                                onClick={() => applyMission(msg.id)}
                                className="text-[9px] font-bold tracking-wider uppercase bg-accent text-black px-2 py-1 hover:bg-white transition-colors flex items-center gap-1"
                              >
                                <Target className="w-3 h-3" /> Apply
                              </button>
                            ) : (
                              <span className="text-[9px] font-bold tracking-wider uppercase text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Applied
                              </span>
                            )}
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="text-white/80">
                              <span className="text-accent/50">GOAL:</span>{" "}
                              {am.actions.mission.goal}
                            </div>
                            <div className="text-white/80">
                              <span className="text-accent/50">TIMEFRAME:</span>{" "}
                              {am.actions.mission.timeframe}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })()}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[10px] text-accent/50 uppercase tracking-widest pl-4"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            Agent processing...
          </motion.div>
        )}

        {extractingActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[10px] text-accent/50 uppercase tracking-widest pl-4"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            Extracting actionable directives...
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-accent/10 blur-xl opacity-0 group-focus-within:opacity-30 transition-opacity" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="INPUT COMMAND..."
          className="w-full bg-[#050505] border border-white/20 p-4 pr-12 focus:outline-none focus:border-accent focus:text-white text-zinc-400 placeholder:text-zinc-700 font-mono text-sm relative z-10 transition-colors"
          disabled={isLoading}
          autoFocus
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-accent disabled:opacity-30 p-2 z-20 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
