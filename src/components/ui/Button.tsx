import { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const baseStyles =
    "px-6 py-2 uppercase font-bold text-sm tracking-widest transition-all duration-200 border border-transparent active:translate-y-1 sharp-edges";

  const variants = {
    primary:
      "bg-white text-black hover:bg-zinc-200 brutalist-shadow border-black dark:border-white",
    secondary:
      "bg-transparent text-white border-white hover:bg-white hover:text-black",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-zinc-400 hover:text-white",
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], className))}
      {...props}
    >
      {children}
    </button>
  );
}
