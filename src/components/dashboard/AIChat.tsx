"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types";
import { Send, Plus, Target, Loader2, BrainCircuit, CheckCircle2, Trash2, Pencil, BookOpen, AlertCircle, ClipboardList, History, X, SquarePen, Mic, MicOff, Paperclip, FileText, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { logActivity } from "@/lib/activityLog";
import { useAuth } from "@/context/AuthContext";
import { getOrCreateConversation, createConversation, saveMessage, getConversationMessages, getConversations, Conversation } from "@/lib/db/conversations";
import { shouldShowWeeklyReview } from "@/lib/db/weekly-review";
import { useToast } from "@/components/ui/CyberToast";

interface AIChatProps {
  integrity: number;
}

interface ToolAction {
  tool: string;
  result: any;
}

export function AIChat({ integrity }: AIChatProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

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
  const [attachments, setAttachments] = useState<{
    name: string;
    type: "image" | "doc";
    mimeType: string;
    content: string;
  }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: typeof attachments = [];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_SIZE) {
        showToast("File size exceeds 5MB limit.");
        continue;
      }
      const name = file.name;
      const mimeType = file.type;

      if (mimeType.startsWith("image/")) {
        const promise = new Promise<typeof attachments[0]>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new window.Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_WIDTH = 400;
              const MAX_HEIGHT = 400;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL(mimeType, 0.7);
                resolve({
                  name,
                  type: "image",
                  mimeType,
                  content: compressedDataUrl,
                });
              } else {
                resolve({
                  name,
                  type: "image",
                  mimeType,
                  content: event.target?.result as string,
                });
              }
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
        newAttachments.push(await promise);
      } else if (mimeType === "application/pdf") {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/chat/parse-doc", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            newAttachments.push({
              name,
              type: "doc",
              mimeType,
              content: data.text,
            });
          } else {
            showToast("Failed to parse PDF document.");
          }
        } catch (error) {
          console.error("PDF parse error:", error);
          showToast("Error reading PDF file.");
        }
      } else {
        const reader = new FileReader();
        const promise = new Promise<typeof attachments[0]>((resolve) => {
          reader.onload = (event) => {
            resolve({
              name,
              type: "doc",
              mimeType,
              content: event.target?.result as string,
            });
          };
        });
        reader.readAsText(file);
        newAttachments.push(await promise);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
      sessionStorage.removeItem("switch_chat_actions");
      return new Map();
    },
  );

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isWeeklyReview, setIsWeeklyReview] = useState(false);
  const [showReviewBanner, setShowReviewBanner] = useState(false);
  const [reviewStarting, setReviewStarting] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [historyConvs, setHistoryConvs] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initDoneRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopAgent = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      showToast("Agent response stopped.");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        showToast("Speech recognition not supported in this browser.");
      }
    }
  };

  // Initialize: load conversation + messages from DB, check weekly review
  useEffect(() => {
    if (!user || initDoneRef.current) return;
    initDoneRef.current = true;

    async function init() {
      try {
        const conv = await getOrCreateConversation(user!.id);
        setConversationId(conv.id);

        // Load persisted messages from DB
        const dbMessages = await getConversationMessages(conv.id);
        if (dbMessages.length > 0) {
          const converted: ChatMessage[] = dbMessages.map((m) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            timestamp: new Date(m.created_at).getTime(),
            attachments: m.attachments,
          }));
          setMessages(converted);
          // Update sessionStorage cache
          sessionStorage.setItem("switch_chat_messages", JSON.stringify(converted));
        } else if (messages.length === 0) {
          // No DB history — show initial greeting
          const greeting: ChatMessage = {
            id: "init",
            sender: "ai",
            text: "Protocol initialized. Neural Link active. I can help you manage your tasks, break them down, update your mission, and track your progress. What do you need?",
            timestamp: Date.now(),
          };
          setMessages([greeting]);
          // Save greeting to DB so it persists
          await saveMessage(conv.id, user!.id, "ai", greeting.text);
        }

        // Check if weekly review is due
        const reviewDue = await shouldShowWeeklyReview(user!.id);
        setShowReviewBanner(reviewDue);
      } catch (err) {
        console.error("AIChat init error:", err);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Persist messages and tool actions to sessionStorage (fast cache)
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

  // Start weekly review — create a new dedicated conversation
  const startWeeklyReview = async () => {
    if (!user || reviewStarting) return;
    setReviewStarting(true);
    try {
      const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const reviewConv = await createConversation(user.id, { title: `Weekly Review — Week of ${dateLabel}` });
      setConversationId(reviewConv.id);
      setIsWeeklyReview(true);
      setShowReviewBanner(false);

      // Clear session messages and show the review opening in UI (AI will send first)
      const openingMsg: ChatMessage = {
        id: "review-init",
        sender: "ai",
        text: "It's been 7 days. Let's review your protocol. Before we start — how would you describe the week overall? Did you feel like you were in control of your routine, or did things slip more than you'd like?",
        timestamp: Date.now(),
      };
      setMessages([openingMsg]);
      sessionStorage.setItem("switch_chat_messages", JSON.stringify([openingMsg]));
      await saveMessage(reviewConv.id, user.id, "ai", openingMsg.text);
    } catch (err) {
      console.error("Failed to start weekly review:", err);
    } finally {
      setReviewStarting(false);
    }
  };

  // Group conversations by date bucket for history panel
  function groupConversationsByDate(convs: Conversation[]) {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1);
    const weekStart = new Date(todayStart); weekStart.setDate(todayStart.getDate() - 7);

    const buckets: { label: string; items: Conversation[] }[] = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "This Week", items: [] },
      { label: "Earlier", items: [] },
    ];

    for (const conv of convs) {
      const d = new Date(conv.created_at);
      d.setHours(0, 0, 0, 0);
      if (d >= todayStart) buckets[0].items.push(conv);
      else if (d >= yesterdayStart) buckets[1].items.push(conv);
      else if (d >= weekStart) buckets[2].items.push(conv);
      else buckets[3].items.push(conv);
    }

    return buckets.filter((b) => b.items.length > 0);
  }

  const startNewChat = async () => {
    if (!user || isLoading) return;
    try {
      const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const timeLabel = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      const newConv = await createConversation(user.id, { title: `Session — ${dateLabel}, ${timeLabel}` });
      const greeting: ChatMessage = {
        id: "init",
        sender: "ai",
        text: "Protocol initialized. Neural Link active. I can help you manage your tasks, break them down, update your mission, and track your progress. What do you need?",
        timestamp: Date.now(),
      };
      setConversationId(newConv.id);
      setMessages([greeting]);
      setToolActions(new Map());
      setIsWeeklyReview(false);
      sessionStorage.setItem("switch_chat_messages", JSON.stringify([greeting]));
      sessionStorage.removeItem("switch_chat_tool_actions");
      await saveMessage(newConv.id, user.id, "ai", greeting.text);
    } catch (err) {
      console.error("Failed to start new chat:", err);
    }
  };

  const openHistory = async () => {
    if (!user) return;
    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const convs = await getConversations(user.id);
      setHistoryConvs(convs);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadConversation = async (conv: Conversation) => {
    setShowHistory(false);
    try {
      const dbMessages = await getConversationMessages(conv.id);
      const converted: ChatMessage[] = dbMessages.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        timestamp: new Date(m.created_at).getTime(),
        attachments: m.attachments,
      }));
      setMessages(converted);
      setConversationId(conv.id);
      setToolActions(new Map());
      setIsWeeklyReview(conv.title.startsWith("Weekly Review"));
      sessionStorage.setItem("switch_chat_messages", JSON.stringify(converted));
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  // Get icon and label for a tool action
  const getToolDisplay = (action: ToolAction) => {
    const result = action.result;
    const success = typeof result === "object" && result?.success;
    const message = typeof result === "object" ? result?.message : String(result);

    switch (action.tool) {
      case "create_mandate":
        return { icon: Plus, label: "Task Created", message, success };
      case "toggle_mandate":
        return { icon: CheckCircle2, label: "Task Updated", message, success };
      case "delete_mandate":
        return { icon: Trash2, label: "Task Deleted", message, success };
      case "edit_mandate":
        return { icon: Pencil, label: "Task Edited", message, success };
      case "update_mission":
        return { icon: Target, label: "Mission Updated", message, success };
      case "create_journal_entry":
        return { icon: BookOpen, label: "Journal Entry Created", message, success };
      default:
        return null;
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userText = input;
    const currentAttachments = [...attachments];
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: userText,
      timestamp: Date.now(),
      attachments: currentAttachments,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const aiMsgId = Date.now().toString() + "ai";
    let accumulatedText = "";

    // Persist user message to DB (fire-and-forget, don't block UI)
    if (conversationId && user) {
      saveMessage(conversationId, user.id, "user", userText, currentAttachments).catch(console.error);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: messages,
          integrity,
          userId: user?.id,
          isWeeklyReview,
          attachments: currentAttachments,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Network error");

      const reader = response.body?.getReader();
      if (!reader) return;

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

      // Persist AI response to DB
      if (conversationId && user && accumulatedText) {
        saveMessage(conversationId, user.id, "ai", accumulatedText).catch(console.error);
      }

      // Notify other components if data was mutated
      if (hadMutatingAction) {
        notifyDataChange();
        if (user) {
          logActivity("ai", "Neural Link executed actions", user.id);
        }
      }

      // Weekly review completion detection
      if (isWeeklyReview && accumulatedText.includes("WEEKLY REVIEW COMPLETE")) {
        try {
          // Collect all current messages + the new AI response for summarization
          const allMessages = [
            ...messages,
            userMsg,
            { id: aiMsgId, sender: "ai" as const, text: accumulatedText, timestamp: Date.now() },
          ].filter((m) => m.id !== "review-init"); // Exclude the scripted opener

          const res = await fetch("/api/chat/weekly-review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId,
              messages: allMessages.map((m) => ({ sender: m.sender, text: m.text })),
            }),
          });

          if (res.ok) {
            showToast("Weekly review saved. Tasks will be personalized.");
            setIsWeeklyReview(false);
            // Switch back to a regular conversation for continued use
            if (user) {
              const regularConv = await getOrCreateConversation(user.id);
              setConversationId(regularConv.id);
            }
          }
        } catch (err) {
          console.error("Failed to save weekly review:", err);
        }
      }
    } catch (error: any) {
      if (error?.name === "AbortError" || (error instanceof DOMException && error.name === "AbortError")) {
        console.log("Agent stream aborted by user.");
        return;
      }
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
      abortControllerRef.current = null;
    }
  };

  const renderHistoryPanel = (isMobileOverlay: boolean) => (
    <div className="flex flex-col h-full bg-[#030303]">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <span className="text-[12px] font-bold tracking-widest uppercase text-accent/80 flex items-center gap-2">
          <History className="w-3.5 h-3.5" />
          Session History
        </span>
        <button
          onClick={() => setShowHistory(false)}
          className="text-white/40 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-24 gap-2 text-[12px] text-white/30 uppercase tracking-widest">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading...
          </div>
        ) : historyConvs.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-[12px] text-white/30 uppercase tracking-widest">
            No sessions yet
          </div>
        ) : (
          groupConversationsByDate(historyConvs).map((group) => (
            <div key={group.label}>
              {/* Date group label */}
              <div className="px-4 py-2 text-[11px] font-bold tracking-widest uppercase text-white/25 bg-white/[0.02] border-b border-white/5">
                {group.label}
              </div>
              {group.items.map((conv) => {
                const isWeeklyReviewConv = conv.title.startsWith("Weekly Review");
                const isActive = conv.id === conversationId;
                const dateStr = new Date(conv.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const timeStr = new Date(conv.created_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv)}
                    className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors flex items-start gap-3 group ${
                      isActive
                        ? "bg-accent/10 border-l-2 border-l-accent"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isWeeklyReviewConv ? (
                        <ClipboardList className="w-3.5 h-3.5 text-yellow-400/60" />
                      ) : (
                        <BrainCircuit className="w-3.5 h-3.5 text-accent/40 group-hover:text-accent/60 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[13px] font-medium truncate ${
                          isActive ? "text-accent" : "text-white/70 group-hover:text-white/90"
                        }`}
                      >
                        {conv.title}
                      </div>
                      <div className="text-[11px] text-white/25 mt-0.5 tracking-wide">
                        {dateStr} · {timeStr}
                      </div>
                    </div>
                    {isWeeklyReviewConv && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 border border-yellow-500/25 text-yellow-400/60 uppercase tracking-wider font-bold">
                        Review
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full cyber-border bg-black/50 p-6 font-mono text-base shadow-[0_0_50px_-20px_rgba(255,255,255,0.1)]">
      {/* Terminal Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4 opacity-50 text-[10px] tracking-widest uppercase gap-4">
        <span className="flex items-center gap-2 truncate min-w-0">
          <BrainCircuit className="w-3 h-3 shrink-0" />
          <span className="truncate">
            <span className="hidden xs:inline">NEURAL_LINK :: </span>
            {isWeeklyReview ? "WEEKLY_REVIEW" : "AGENT_MODE"}
          </span>
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={startNewChat}
            disabled={isLoading}
            title="New Chat"
            className="flex items-center gap-1 hover:text-accent transition-colors disabled:opacity-30"
          >
            <SquarePen className="w-3 h-3" />
            <span>New</span>
          </button>
          <button
            onClick={openHistory}
            title="Chat History"
            className="flex items-center gap-1 hover:text-accent transition-colors"
          >
            <History className="w-3 h-3" />
            <span>History</span>
          </button>
          <div className="flex gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isWeeklyReview ? "bg-yellow-400" : "bg-green-500"}`} />
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse delay-75 ${isWeeklyReview ? "bg-yellow-400" : "bg-green-500"}`} />
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse delay-150 ${isWeeklyReview ? "bg-yellow-400" : "bg-green-500"}`} />
          </div>
        </div>
      </div>

      <div className="relative flex-1 flex gap-4 overflow-hidden mb-6">
        {/* Desktop History Sidebar (persistent left side on lg screens) */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "280px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="hidden lg:block h-full border-r border-white/10 shrink-0 overflow-hidden"
            >
              {renderHistoryPanel(false)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages list */}
        <div className="flex-1 h-full overflow-y-auto space-y-4 custom-scrollbar pr-1 relative">
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
                  <span className="block text-[11px] text-accent/50 mb-2 font-bold tracking-widest uppercase">
                    {isWeeklyReview ? "REVIEW_PROTOCOL" : "SYSTEM_RESPONSE"}
                  </span>
                )}
                {msg.sender === "ai" ? (
                  <div
                    className="leading-relaxed text-sm md:text-base prose prose-invert prose-base max-w-none
                    prose-p:my-1.5 prose-p:text-white/90
                    prose-strong:text-accent prose-strong:font-bold
                    prose-headings:text-accent prose-headings:font-display prose-headings:text-base prose-headings:mt-3 prose-headings:mb-1
                    prose-ul:my-1.5 prose-ul:pl-4 prose-li:text-white/90 prose-li:my-0.5 prose-li:marker:text-accent/50
                    prose-ol:my-1.5 prose-ol:pl-4
                    prose-code:text-accent prose-code:bg-accent/10 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs md:prose-code:text-sm prose-code:rounded prose-code:font-mono
                    prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-white/10 prose-pre:p-3 prose-pre:my-2
                    prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                  "
                  >
                    <ReactMarkdown>
                      {msg.text.replace(/WEEKLY REVIEW COMPLETE\.?\s*$/i, "").trim()}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {msg.text && (
                      <div className="leading-relaxed text-sm md:text-base text-white/90">
                        {msg.text}
                      </div>
                    )}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.attachments.map((file, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-center gap-2 bg-white/5 border border-white/10 px-2 py-1 text-xs text-zinc-400 font-mono"
                          >
                            {file.type === "image" ? (
                              <img
                                src={file.content}
                                className="w-8 h-8 object-cover border border-white/10"
                                alt={file.name}
                              />
                            ) : (
                              <FileText className="w-4 h-4 text-accent shrink-0" />
                            )}
                            <span className="max-w-[120px] truncate" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tool Action Cards — show what the AI did */}
              {msg.sender === "ai" &&
                toolActions.has(msg.id) &&
                (() => {
                  const actions = toolActions.get(msg.id)!;

                  const mandateCreations = actions.filter(
                    (a) => a.tool === "create_mandate" && a.result?.success && a.result?.mandate,
                  );
                  const otherActions = actions
                    .filter((a) => a.tool !== "create_mandate")
                    .map((a) => ({ ...a, display: getToolDisplay(a) }))
                    .filter((a) => a.display !== null);

                  if (mandateCreations.length === 0 && otherActions.length === 0) return null;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-[90%] mt-2 space-y-1.5"
                    >
                      {/* Rich mandate creation cards */}
                      {mandateCreations.length > 0 && (
                        <div className="border border-accent/20 bg-accent/[0.03] p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Plus className="w-3 h-3 text-accent/70" />
                            <span className="text-[9px] text-accent/70 font-bold tracking-widest uppercase">
                              GENERATED TASKS ({mandateCreations.length})
                            </span>
                          </div>
                          <div className="space-y-1">
                            {mandateCreations.map((a, i) => {
                              const m = a.result.mandate;
                              const rationale = m.rationale || null;
                              return (
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
                                    <span className="text-white/90">{m.label}</span>
                                    {rationale && (
                                      <span className="text-white/40 ml-1 text-[10px]">
                                        — {rationale}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Compact cards for other tool actions */}
                      {otherActions.map((action, i) => {
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
            {isWeeklyReview ? "Protocol reviewing..." : "Agent processing..."}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
        </div>{/* end messages list */}

        {/* Mobile History Drawer (absolute overlay on < lg screens) */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-0 bg-black/97 border-l border-white/10 z-20 flex lg:hidden flex-col"
            >
              {renderHistoryPanel(true)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>{/* end relative container */}

      {/* Weekly review banner */}
      {showReviewBanner && !isWeeklyReview && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="text-[11.5px] font-mono font-bold tracking-widest uppercase text-yellow-400/90 truncate">
              [WEEKLY_REVIEW_PENDING] Your 7-day protocol review is due.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startWeeklyReview}
              disabled={reviewStarting}
              className="shrink-0 text-[11px] font-mono font-bold tracking-widest uppercase border border-yellow-500/40 text-yellow-400 px-3 py-1.5 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"
            >
              {reviewStarting ? "Starting..." : "Start review →"}
            </button>
            <button
              onClick={() => setShowReviewBanner(false)}
              className="text-yellow-500/60 hover:text-yellow-400 p-1.5 transition-colors shrink-0"
              title="Dismiss Notification"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 border border-dashed border-white/10 bg-white/5 relative z-20">
          {attachments.map((file, idx) => (
            <div key={idx} className="relative flex items-center gap-2 bg-black/50 border border-white/10 px-2 py-1 text-xs text-zinc-300 font-mono group animate-in fade-in-50 duration-200">
              {file.type === "image" ? (
                <img src={file.content} className="w-8 h-8 object-cover border border-white/10" alt={file.name} />
              ) : (
                <FileText className="w-4 h-4 text-accent shrink-0" />
              )}
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-zinc-500 hover:text-red-400 ml-1 transition-colors"
                title="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative group">
        <div className="absolute inset-0 bg-accent/10 blur-xl opacity-0 group-focus-within:opacity-30 transition-opacity" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={isListening ? "LISTENING..." : isWeeklyReview ? "RESPOND TO REVIEW..." : "INPUT COMMAND..."}
          className={`w-full bg-[#050505] border p-4 pr-32 focus:outline-none focus:text-white text-zinc-400 placeholder:text-zinc-700 font-mono text-base relative z-10 transition-colors ${
            isListening ? "border-accent animate-pulse" : "border-white/20 focus:border-accent"
          }`}
          disabled={isLoading}
          autoFocus
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,.txt,.md,.json,.csv,.log,.pdf,.js,.ts,.py,.go"
            className="hidden"
          />
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu((prev) => !prev)}
              disabled={isLoading}
              title="Attach Image or Document"
              className={`p-2 transition-colors disabled:opacity-30 ${
                showAttachMenu ? "text-accent" : "text-zinc-500 hover:text-accent"
              }`}
            >
              <Paperclip size={18} />
            </button>
            {showAttachMenu && (
              <div
                ref={attachMenuRef}
                className="absolute right-0 bottom-full mb-2 bg-[#0a0a0a] border border-white/10 p-2 flex flex-col gap-1 w-48 shadow-xl z-30 animate-in slide-in-from-bottom-2 duration-200"
              >
                <button
                  onClick={() => {
                    setShowAttachMenu(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 font-mono transition-colors text-left w-full"
                >
                  <span>IMAGE UPLOAD</span>
                </button>
                <button
                  onClick={() => {
                    setShowAttachMenu(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = ".pdf,.txt,.md,.json,.csv,.log,.js,.ts,.py,.go";
                      fileInputRef.current.click();
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 font-mono transition-colors text-left w-full"
                >
                  <span>DOCUMENT UPLOAD</span>
                </button>
                <div className="border-t border-white/5 mt-1 pt-1.5 px-3 pb-0.5">
                  <span className="text-[9px] text-zinc-600 font-mono tracking-wider block uppercase">
                    MAX SIZE: 2MB EACH
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={toggleVoiceInput}
            disabled={isLoading}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
            className={`p-2 transition-colors ${
              isListening ? "text-accent" : "text-zinc-500 hover:text-accent"
            } disabled:opacity-30`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={isLoading ? stopAgent : sendMessage}
            disabled={isListening}
            className={`p-2 transition-colors ${
              isLoading
                ? "text-red-500 hover:text-red-400"
                : "text-zinc-500 hover:text-accent disabled:opacity-30"
            }`}
            title={isLoading ? "Stop Agent Response" : "Send Command"}
          >
            {isLoading ? <Square size={18} className="fill-current" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
