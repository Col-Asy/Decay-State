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
      className="flex items-center gap-4 py-3 group cursor-pointer"
      onClick={() => onToggle(task.id, !task.completed)}
    >
      <div
        className={`relative w-6 h-6 border transition-colors duration-200 flex items-center justify-center
          ${task.completed ? "bg-white border-white" : "border-zinc-600 group-hover:border-zinc-400"}`}
      >
        {task.completed && <Check size={16} className="text-black" />}
      </div>

      <span
        className={`text-sm tracking-wider font-mono transition-colors duration-200 
        ${task.completed ? "text-zinc-500 line-through" : "text-zinc-100"}`}
      >
        {task.label}
      </span>
    </div>
  );
}
