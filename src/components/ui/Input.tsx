import { InputHTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={twMerge(
        clsx(
          "w-full bg-transparent border-b border-zinc-700 py-2 px-4 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors duration-200 text-lg font-mono",
          className,
        ),
      )}
      {...props}
    />
  );
}
