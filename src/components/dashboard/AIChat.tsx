"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types";
import { Send, Plus, Target, Loader2, BrainCircuit, CheckCircle2, Trash2, Pencil, BookOpen, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { logActivity } from "@/lib/activityLog";
import { useAuth } from "@/context/AuthContext";

interface AIChatProps {
  integrity: number;
}

interface ToolAction {
  tool: string;
  result: any;
}

export function AIChat({ integrity }: AIChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem("switch_chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      sessionStorage.removeItem("switch_chat_messages");
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolActions, setToolActions] = useState<Map<string, ToolAction[]>>(
    () => {
      if (typeof window === "undefined") return new Map();
      try {
        const saved = sessionStorage.getItem("switch_chat_tool_actions");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return new Map(parsed);
        }
      } catch {
        sessionStorage.removeItem("switch_chat_tool_actions");
      }
      // Clean up legacy key from old code
      sessionStorage.removeItem("switch_chat_actions");
      return new Map();
    },
  );
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

  // Persist messages and tool actions
  useEffect(() => {
    sessionStorage.setItem("switch_chat_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(
      "switch_chat_tool_actions",
      JSON.stringify(Array.from(toolActions.entries())),
    );
  }, [toolActions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolActions]);

  // Notify other components that data changed (mandates, journal, mission)
  const notifyDataChange = () => {
    window.dispatchEvent(new CustomEvent("neural-link-data-change"));
  };

  // Get icon and label for a tool action
  const getToolDisplay = (action: ToolAction) => {
    const result = action.result;
    const success = typeof result === "object" && result?.success;
    const message = typeof result === "object" ? result?.message : String(result);

    switch (action.tool) {
      case "create_mandate":
        return { icon: Plus, label: "Mandate Created", message, success };
      case "toggle_mandate":
        return { icon: CheckCircle2, label: "Mandate Updated", message, success };
      case "delete_mandate":
        return { icon: Trash2, label: "Mandate Deleted", message, success };
      case "edit_mandate":
        return { icon: Pencil, label: "Mandate Edited", message, success };
      case "update_mission":
        return { icon: Target, label: "Mission Updated", message, success };
      case "create_journal_entry":
        return { icon: BookOpen, label: "Journal Entry Created", message, success };
      default:
        return null; // Read-only tools don't need visual feedback
    }
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
      let hadMutatingAction = false;
      const mutatingTools = new Set([
        "create_mandate", "toggle_mandate", "delete_mandate",
        "edit_mandate", "update_mission", "create_journal_entry",
      ]);

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
            } else if (event.type === "tool_result") {
              // Track mutating tool actions for visual feedback
              if (mutatingTools.has(event.tool)) {
                hadMutatingAction = true;
                setToolActions((prev) => {
                  const next = new Map(prev);
                  const existing = next.get(aiMsgId) || [];
                  next.set(aiMsgId, [
                    ...existing,
                    { tool: event.tool, result: event.result },
                  ]);
                  return next;
                });
              }
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

      // Notify other components if data was mutated
      if (hadMutatingAction) {
        notifyDataChange();
        if (user) {
          logActivity("ai", "Neural Link executed actions", user.id);
        }
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

              {/* Tool Action Cards — show what the AI did */}
              {msg.sender === "ai" &&
                toolActions.has(msg.id) &&
                (() => {
                  const actions = toolActions.get(msg.id)!;
                  const displayActions = actions
                    .map((a) => ({ ...a, display: getToolDisplay(a) }))
                    .filter((a) => a.display !== null);
                  if (displayActions.length === 0) return null;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-[90%] mt-2 space-y-1.5"
                    >
                      {displayActions.map((action, i) => {
                        const d = action.display!;
                        const Icon = d.icon;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 px-3 py-2 border text-[10px] uppercase tracking-widest font-bold ${
                              d.success
                                ? "border-accent/30 bg-accent/5 text-accent"
                                : "border-red-500/30 bg-red-500/5 text-red-400"
                            }`}
                          >
                            {d.success ? (
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="truncate">
                              {d.message || d.label}
                            </span>
                          </div>
                        );
                      })}
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
