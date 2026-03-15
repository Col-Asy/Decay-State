"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/storage";
import {
  Shield,
  Link2,
  Check,
  Camera,
  Zap,
  Loader2,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { getSubscription } from "@/lib/db/subscriptions";
import {
  SiStrava,
  SiGooglefit,
  SiApple,
  SiLeetcode,
  SiGithub,
  SiCodeforces,
  SiNotion,
  SiGooglecalendar,
  SiGoogledrive,
  SiDiscord,
} from "react-icons/si";
import { motion, AnimatePresence } from "framer-motion";
import { type IconType } from "react-icons";
import Image from "next/image";
import { FutureSelfGallery } from "@/components/dashboard/FutureSelfGallery";
import { getActiveMission } from "@/lib/db/mission";
import type { Mission } from "@/lib/db/mission";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  color: string;
  connected: boolean;
  category: "fitness" | "coding" | "productivity" | "social";
}

const INTEGRATIONS: Integration[] = [
  {
    id: "strava",
    name: "Strava",
    description: "Track runs, cycling, and workouts automatically",
    icon: SiStrava,
    color: "#FC4C02",
    connected: false,
    category: "fitness",
  },
  {
    id: "google_fit",
    name: "Google Fit",
    description: "Sync health & activity data from Android",
    icon: SiGooglefit,
    color: "#4285F4",
    connected: false,
    category: "fitness",
  },
  {
    id: "apple_health",
    name: "Apple Health",
    description: "Import health metrics from iOS devices",
    icon: SiApple,
    color: "#FF2D55",
    connected: false,
    category: "fitness",
  },
  {
    id: "leetcode",
    name: "LeetCode",
    description: "Monitor coding challenges & problem-solving streaks",
    icon: SiLeetcode,
    color: "#FFA116",
    connected: false,
    category: "coding",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Track commits, PRs, and contribution streaks",
    icon: SiGithub,
    color: "#FFFFFF",
    connected: false,
    category: "coding",
  },
  {
    id: "codeforces",
    name: "Codeforces",
    description: "Competitive programming rating tracker",
    icon: SiCodeforces,
    color: "#1F8ACB",
    connected: false,
    category: "coding",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync goals, journals, and project boards",
    icon: SiNotion,
    color: "#FFFFFF",
    connected: false,
    category: "productivity",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Import events and track time commitments",
    icon: SiGooglecalendar,
    color: "#4285F4",
    connected: false,
    category: "productivity",
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Attach files and documents to your protocols",
    icon: SiGoogledrive,
    color: "#0F9D58",
    connected: false,
    category: "productivity",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Get accountability alerts in your server",
    icon: SiDiscord,
    color: "#5865F2",
    connected: false,
    category: "social",
  },
];

const categories = [
  { id: "all", label: "All Integrations" },
  { id: "fitness", label: "Fitness" },
  { id: "coding", label: "Coding" },
  { id: "productivity", label: "Productivity" },
  { id: "social", label: "Social" },
];

export default function AccountsPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [activeFilter, setActiveFilter] = useState("all");
  const [connectingId, setConnectingId] = useState<string | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile state — seeded from Supabase user
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Notifications (UI only — wired to real prefs later)
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(false);
  const [notifDecay, setNotifDecay] = useState(true);

  const [username, setUsername] = useState("");
  const [tier, setTier] = useState<"observer" | "operator">("observer");

  // Future self generation
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [showGeneratePrompt, setShowGeneratePrompt] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;
    setProfileName(user.user_metadata?.name ?? user.email?.split("@")[0] ?? "");
    setProfileBio(user.user_metadata?.bio ?? "");
    setAvatarUrl(user.user_metadata?.avatar_url || null);

    // Fetch subscription tier
    getSubscription(user.id).then((sub) => {
      if (sub?.tier) setTier(sub.tier as "observer" | "operator");
    });

    // Fetch profile for username + notification prefs
    const supabase = createClient();

    // Always fetch username + bio + avatar (as fallback)
    supabase
      .from("profiles")
      .select("username, bio, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        // Prefer DB username → user_metadata username → email prefix
        const handle =
          data?.username ||
          user.user_metadata?.username ||
          user.email?.split("@")[0] ||
          "";
        setUsername(handle);
        if (data?.bio) setProfileBio(data.bio);
        if (data?.avatar_url && !user.user_metadata?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      });

    // Fetch notification_prefs separately — fails gracefully if column missing
    supabase
      .from("profiles")
      .select("notification_prefs")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        const prefs = data?.notification_prefs;
        if (!prefs) return;
        setNotifEmail(prefs.email ?? true);
        setNotifPush(prefs.push ?? true);
        setNotifWeekly(prefs.weekly ?? false);
        setNotifDecay(prefs.decay ?? true);
      });

    // Fetch active mission for future self generation
    getActiveMission(user.id).then((m) => setActiveMission(m));
  }, [user, authLoading, router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const url = await uploadFile("avatars", user.id, file);
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      setAvatarUrl(url);
      // Show generate prompt if user has an active mission
      if (activeMission) {
        setShowGeneratePrompt(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setUsernameError("");
    setUsernameSaving(true);
    const supabase = createClient();

    // Uniqueness check — allow own current username
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "");
    if (cleanUsername) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleanUsername)
        .neq("id", user.id)
        .maybeSingle();
      if (existing) {
        setUsernameError("Username already taken");
        setUsernameSaving(false);
        return;
      }
    }

    await supabase.auth.updateUser({
      data: { name: profileName, bio: profileBio },
    });
    await supabase
      .from("profiles")
      .update({
        name: profileName,
        bio: profileBio,
        username: cleanUsername || null,
      })
      .eq("id", user.id);

    setUsername(cleanUsername);
    setUsernameSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const saveNotifPref = async (key: string, value: boolean) => {
    if (!user) return;
    const supabase = createClient();
    // Use jsonb_set via RPC-style update — just re-send the full prefs object
    const prefs = {
      email: notifEmail,
      push: notifPush,
      weekly: notifWeekly,
      decay: notifDecay,
      [key]: value,
    };
    await supabase
      .from("profiles")
      .update({ notification_prefs: prefs })
      .eq("id", user.id);
  };

  const handleConnect = (id: string) => {
    setConnectingId(id);
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)),
      );
      setConnectingId(null);
    }, 2000);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("WARNING: This will permanently delete your account, missions, and all associated data. This action cannot be undone. Are you sure?")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch("/api/auth/delete", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      await signOut();
      router.push("/login");
    } catch (error) {
      console.error(error);
      alert("An error occurred while deleting your account.");
      setIsDeleting(false);
    }
  };

  const filtered =
    activeFilter === "all"
      ? integrations
      : integrations.filter((i) => i.category === activeFilter);
  const connectedCount = integrations.filter((i) => i.connected).length;

  if (authLoading) return <div className="bg-black h-screen" />;
  if (!user) return null;

  const userName = profileName || user.email?.split("@")[0] || "OPERATIVE";

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 h-screen flex flex-col overflow-hidden">
      {/* Page Header */}
      <header className="shrink-0 border-b border-white/10 pb-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <div className="text-[10px] text-accent font-mono tracking-widest uppercase flex items-center gap-2">
              <Shield className="w-3 h-3 animate-pulse" />
              Operator Configuration
            </div>
            <h1 className="text-3xl font-display font-black text-white uppercase tracking-tighter">
              Account &amp; Integrations
            </h1>
          </div>
          {/* Connected Systems counter — temporarily hidden
          <div className="text-right">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
              Connected Systems
            </div>
            <div className="text-2xl font-display font-black text-accent">
              {connectedCount}
              <span className="text-zinc-600 text-sm">
                /{integrations.length}
              </span>
            </div>
          </div>
          */}
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar pr-2">
        {/* ─── PROFILE & IDENTITY ─── */}
        <div className="border border-white/10 bg-[#0a0a0a] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-30" />
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-accent/5 blur-3xl rounded-full pointer-events-none" />

          <div className="px-6 py-4 border-b border-white/5">
            <div className="text-[10px] text-accent font-mono tracking-widest uppercase flex items-center gap-2">
              <Shield className="w-3 h-3" /> Operator Identity
            </div>
          </div>

          <div className="p-6 space-y-6 relative z-10">
            {/* Avatar + Name Row */}
            <div className="flex items-center gap-6">
              <div className="relative group/avatar shrink-0">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <div className="w-24 h-24 border border-white/10 overflow-hidden bg-zinc-900 relative">
                  {avatarUrl && avatarUrl.length > 0 ? (
                    <Image
                      src={avatarUrl}
                      alt="Operator"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl font-display font-black uppercase">
                      {userName.charAt(0)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  {avatarUploading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </button>
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent/50" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-accent/50" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-accent/50" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent/50" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-xl font-display font-black text-white uppercase tracking-tight">
                  {userName}
                </div>
                {username && (
                  <div className="text-[10px] text-accent/70 font-mono tracking-widest">
                    @{username}
                  </div>
                )}
                <div className="text-[10px] text-zinc-500 font-mono tracking-wider">
                  {user.email}
                </div>
                <div className="flex gap-3 items-center mt-2 flex-wrap">
                  <div className="text-[9px] text-zinc-600 font-mono flex items-center gap-1">
                    <Zap className="w-3 h-3 text-accent" />
                    PROTOCOL:{" "}
                    <span
                      className={`font-bold ${tier === "operator" ? "text-accent" : "text-white"}`}
                    >
                      {tier.toUpperCase()}
                    </span>
                  </div>
                  {tier === "observer" && (
                    <a
                      href="/pricing"
                      className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-accent hover:underline"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      Upgrade
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Future Self Generation Prompt */}
            <AnimatePresence>
              {showGeneratePrompt && activeMission && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border border-accent/30 bg-accent/5 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-white font-bold uppercase tracking-tight">
                        New Source Image Detected
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        Generate an updated future self projection based on your mission
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setGalleryOpen(true)}
                        className="text-[9px] uppercase tracking-widest font-bold text-black bg-accent hover:bg-accent/80 px-4 py-2 transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Generate Projection
                      </button>
                      <button
                        onClick={() => setShowGeneratePrompt(false)}
                        className="text-[9px] uppercase tracking-widest text-zinc-500 hover:text-white px-2 py-2 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm select-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameError("");
                    }}
                    placeholder="your_handle"
                    className={`w-full bg-black/50 border py-2 pl-7 pr-3 text-sm font-mono text-white focus:outline-none transition-colors ${
                      usernameError
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/10 focus:border-accent/50"
                    }`}
                  />
                </div>
                {usernameError && (
                  <p className="text-[9px] text-red-400 font-mono tracking-wider">
                    {usernameError}
                  </p>
                )}
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
                  Bio / Status
                </label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  rows={2}
                  placeholder="Short operator status or personal tagline..."
                  className="w-full bg-black/50 border border-white/10 py-2 px-3 text-xs font-mono text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleProfileSave}
                disabled={usernameSaving}
                className="text-[10px] uppercase tracking-widest font-bold text-black bg-accent hover:bg-accent/80 px-5 py-2 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
              >
                <Check className="w-3 h-3" />{" "}
                {usernameSaving ? "Checking..." : "Save Changes"}
              </button>
              {profileSaved && (
                <span className="text-[10px] text-accent font-mono animate-pulse">
                  PROFILE UPDATED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── SECURITY ─── */}
        <div className="border border-white/10 bg-[#0a0a0a] relative overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <div className="text-[10px] text-accent font-mono tracking-widest uppercase flex items-center gap-2">
              <Shield className="w-3 h-3" /> Security Protocol
            </div>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-accent border border-white/10 hover:border-accent/30 px-3 py-1 transition-all"
            >
              {showPasswordSection ? "Cancel" : "Change Password"}
            </button>
          </div>

          <AnimatePresence>
            {showPasswordSection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        label: "Current Password",
                        value: currentPassword,
                        setter: setCurrentPassword,
                      },
                      {
                        label: "New Password",
                        value: newPassword,
                        setter: setNewPassword,
                      },
                      {
                        label: "Confirm New",
                        value: confirmPassword,
                        setter: setConfirmPassword,
                      },
                    ].map((f) => (
                      <div key={f.label} className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
                          {f.label}
                        </label>
                        <input
                          type="password"
                          value={f.value}
                          onChange={(e) => f.setter(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-accent/50 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setPasswordSaved(true);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setTimeout(() => {
                          setPasswordSaved(false);
                          setShowPasswordSection(false);
                        }, 2000);
                      }}
                      className="text-[10px] uppercase tracking-widest font-bold text-black bg-accent hover:bg-accent/80 px-5 py-2 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-3 h-3" /> Update Password
                    </button>
                    {passwordSaved && (
                      <span className="text-[10px] text-accent font-mono animate-pulse">
                        PASSWORD UPDATED
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showPasswordSection && (
            <div className="px-6 py-4 text-[10px] text-zinc-600 font-mono">
              Password last changed: Never
            </div>
          )}
        </div>

        {/* ─── NOTIFICATION PREFERENCES ─── */}
        <div className="border border-white/10 bg-[#0a0a0a] relative overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <div className="text-[10px] text-accent font-mono tracking-widest uppercase flex items-center gap-2">
              <Zap className="w-3 h-3" /> Alert Configuration
            </div>
          </div>
          <div className="p-6 space-y-0 divide-y divide-white/5">
            {[
              {
                label: "Email Notifications",
                desc: "Receive daily integrity reports via email",
                state: notifEmail,
                setter: setNotifEmail,
                key: "email",
              },
              {
                label: "Push Notifications",
                desc: "Browser push alerts for decay warnings",
                state: notifPush,
                setter: setNotifPush,
                key: "push",
              },
              {
                label: "Weekly Summary",
                desc: "Receive a weekly protocol compliance digest",
                state: notifWeekly,
                setter: setNotifWeekly,
                key: "weekly",
              },
              {
                label: "Decay Alerts",
                desc: "Critical alerts when integrity drops below threshold",
                state: notifDecay,
                setter: setNotifDecay,
                key: "decay",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="text-xs text-white font-bold uppercase tracking-tight">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
                    {item.desc}
                  </div>
                </div>
                <button
                  onClick={() => {
                    item.setter(!item.state);
                    saveNotifPref(item.key, !item.state);
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors ${item.state ? "bg-accent" : "bg-zinc-800"}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${item.state ? "left-5" : "left-0.5"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── INTEGRATIONS — temporarily hidden ───
        <div className="space-y-4">
          ... integrations section ...
        </div>
        */}

        {/* ─── DANGER ZONE ─── */}
        <div className="border border-red-500/20 bg-red-500/5 p-6 space-y-4">
          <div className="text-[10px] text-red-500 font-mono tracking-widest uppercase font-bold flex items-center gap-2">
            <Shield className="w-3 h-3" /> Danger Zone
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white font-bold uppercase tracking-tight">
                Sever All Connections
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                Permanently delete your account and wipe all operator data
              </div>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className={`text-[9px] uppercase tracking-widest font-bold text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-2 transition-all ${
                isDeleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isDeleting ? "WIPING..." : "Reset Protocol"}
            </button>
          </div>
        </div>
      </div>

      {/* Future Self Gallery Modal */}
      {activeMission?.id && (
        <FutureSelfGallery
          missionId={activeMission.id}
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          onImageChange={() => {
            setGalleryOpen(false);
            setShowGeneratePrompt(false);
          }}
        />
      )}
    </div>
  );
}
