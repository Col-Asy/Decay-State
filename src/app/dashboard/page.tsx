"use client";

import { useState, useEffect } from "react";
import { UserState, Task } from "@/types";
import { FutureSelfImage } from "@/components/dashboard/FutureSelfImage";
import { TaskItem } from "@/components/dashboard/TaskItem";
import { AIChat } from "@/components/dashboard/AIChat";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [user, setUser] = useState<UserState | null>(null);

  // Mock Tasks - In a real app this would be in DB
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", label: "Run 5km", completed: false },
    { id: "2", label: "Read 30 mins", completed: false },
    { id: "3", label: "Code 1 hour", completed: false },
  ]);

  useEffect(() => {
    const savedUser = localStorage.getItem("switch_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleToggleTask = (id: string, completed: boolean) => {
    if (!user) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t)),
    );

    // Update Integrity Logic
    // +15% for completing, -15% for unchecking
    const change = completed ? 15 : -15;
    const newIntegrity = Math.min(100, Math.max(0, user.integrity + change));

    setUser({ ...user, integrity: newIntegrity });
  };

  if (!user) return <div className="bg-black h-screen"></div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 grid md:grid-cols-2 gap-8 items-start max-w-7xl mx-auto">
      {/* LEFT COLUMN: Visual Artifact */}
      <div className="sticky top-8 space-y-6">
        <header className="border-b border-zinc-800 pb-4 mb-8">
          <h1 className="text-xl font-bold tracking-widest uppercase">
            Protocol Dashboard
          </h1>
          <div className="flex justify-between items-end mt-2">
            <span className="text-xs text-zinc-500 font-mono">
              OPERATOR: {user.name || "UNKNOWN"}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              TARGET: {user.goal}
            </span>
          </div>
        </header>

        <FutureSelfImage integrity={user.integrity} imageUrl={user.image_url} />

        <div className="p-4 border border-zinc-800 bg-zinc-900/50">
          <h3 className="text-xs font-bold text-zinc-500 mb-2 font-mono">
            STATUS DIAGNOSTIC
          </h3>
          <div className="w-full bg-zinc-800 h-2 mt-1">
            <motion.div
              className={`h-full ${user.integrity > 80 ? "bg-white shadow-[0_0_10px_white]" : user.integrity < 30 ? "bg-red-600" : "bg-zinc-400"}`}
              animate={{ width: `${user.integrity}%` }}
            />
          </div>
          <p className="text-right text-xs font-mono mt-1 text-zinc-400">
            {user.integrity}% INTEGRITY
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Tasks & Chat */}
      <div className="space-y-8">
        {/* Tasks */}
        <section>
          <h2 className="text-sm font-bold border-b border-zinc-800 pb-2 mb-4 text-zinc-400 uppercase tracking-widest">
            Daily Mandates
          </h2>
          <div className="space-y-1">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={handleToggleTask} />
            ))}
          </div>
        </section>

        {/* Chat */}
        <section className="h-[400px]">
          <h2 className="text-sm font-bold border-b border-zinc-800 pb-2 mb-4 text-zinc-400 uppercase tracking-widest flex justify-between items-center">
            <span>System Log</span>
            <span className="animate-pulse text-green-500 text-[10px] uppercase">
              ● Connected
            </span>
          </h2>
          <AIChat integrity={user.integrity} />
        </section>
      </div>
    </div>
  );
}
