"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ListTodo,
  BookOpen,
  BrainCircuit,
  ShieldAlert,
  UserCircle,
  LogOut,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { getSubscription } from "@/lib/db/subscriptions";
import { useEffect, useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const [tier, setTier] = useState<"observer" | "operator">("observer");

  useEffect(() => {
    if (!user) return;
    getSubscription(user.id).then((sub) => {
      if (sub?.tier) setTier(sub.tier as "observer" | "operator");
    });
  }, [user]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const navItems = [
    {
      label: "Command Center",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "Mandates",
      href: "/dashboard/mandates",
      icon: ListTodo,
      active: pathname.startsWith("/dashboard/mandates"),
    },
    {
      label: "Protocol Log",
      href: "/dashboard/journal",
      icon: BookOpen,
      active: pathname.startsWith("/dashboard/journal"),
    },
    {
      label: "Neural Link",
      href: "/dashboard/chat",
      icon: BrainCircuit,
      active: pathname.startsWith("/dashboard/chat"),
    },
    {
      label: "Accounts",
      href: "/dashboard/accounts",
      icon: UserCircle,
      active: pathname.startsWith("/dashboard/accounts"),
    },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-black border-r border-zinc-800 flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-accent hover:opacity-80 transition-opacity w-fit"
        >
          <ShieldAlert className="w-5 h-5" />
          <span className="font-display font-black text-lg tracking-tighter">
            DECAYSTATE
          </span>
        </Link>
        <Link
          href="/dashboard/accounts"
          className="flex items-center gap-2 mt-3 hover:opacity-70 transition-opacity w-fit"
        >
          <div className="text-[10px] uppercase text-zinc-500 tracking-widest font-mono flex items-center gap-1">
            <Zap className="w-3 h-3 text-accent" />
            PROTOCOL:{" "}
            <span
              className={`font-bold ${tier === "operator" ? "text-accent" : "text-white"}`}
            >
              {tier.toUpperCase()}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest px-4 mb-4">
          Modules
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-mono transition-all duration-200 border-l-2
              ${
                item.active
                  ? "border-accent text-accent bg-accent/5"
                  : "border-transparent text-zinc-500 hover:text-white hover:bg-white/5"
              }
            `}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 space-y-4">
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 overflow-hidden relative group">
          <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] text-zinc-400 font-mono">STATUS</span>
            <span className="text-[10px] text-green-500 font-bold tracking-widest animate-pulse">
              ONLINE
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-mono text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sever Connection
        </button>
      </div>
    </aside>
  );
}
