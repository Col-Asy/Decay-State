import { motion } from "framer-motion";
import { Task } from "@/types";
import { Check } from "lucide-react";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, checked: boolean) => void;
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  return (
    <div
      className={`flex items-center gap-6 p-4 border transition-all duration-300 cursor-pointer relative overflow-hidden group/item
        ${task.completed
          ? "border-accent/20 bg-accent/5"
          : "border-white/10 bg-black hover:border-white/30 hover:bg-white/5"
        }`}
      onClick={() => onToggle(task.id, !task.completed)}
    >
      <div
        className={`relative w-5 h-5 border transition-all duration-300 flex items-center justify-center
          ${task.completed ? "bg-accent border-accent rotate-0" : "border-zinc-600 group-hover/item:border-white rotate-45"}`}
      >
        {task.completed && <Check size={12} className="text-black" />}
      </div>

      <span
        className={`text-sm tracking-wider font-mono transition-all duration-300
        ${task.completed ? "text-accent/50 line-through" : "text-zinc-300 group-hover/item:text-white"}`}
      >
        {task.label}
      </span>

      {/* Hover decoration */}
      <div className="absolute right-4 text-[9px] uppercase tracking-widest text-zinc-600 opacity-0 group-hover/item:opacity-100 transition-opacity">
        {task.completed ? "COMPLETED" : "EXECUTE"}
      </div>
    </div>
  );
}
