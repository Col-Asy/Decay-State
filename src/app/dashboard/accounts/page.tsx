"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import { UserState } from "@/types";
import {
    Shield,
    Link2,
    Check,
    X,
    Camera,
    Zap,
} from "lucide-react";
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
    const [user, setUser] = useState<UserState | null>(null);
    const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
    const [activeFilter, setActiveFilter] = useState("all");
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileName, setProfileName] = useState("");
    const [profileGoal, setProfileGoal] = useState("");

    const [profileEmail, setProfileEmail] = useState("operator@decaystate.io");
    const [profileBio, setProfileBio] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordSaved, setPasswordSaved] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);
    const [notifEmail, setNotifEmail] = useState(true);
    const [notifPush, setNotifPush] = useState(true);
    const [notifWeekly, setNotifWeekly] = useState(false);
    const [notifDecay, setNotifDecay] = useState(true);

    useEffect(() => {
        const currentUser = auth.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }
        setUser(currentUser);
        setProfileName(currentUser.name);
        setProfileGoal(currentUser.goal);
    }, [router]);

    const handleConnect = (id: string) => {
        setConnectingId(id);
        // Simulate OAuth flow
        setTimeout(() => {
            setIntegrations((prev) =>
                prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i))
            );
            setConnectingId(null);
        }, 2000);
    };

    const handleProfileSave = () => {
        if (user) {
            const updated = { ...user, name: profileName, goal: profileGoal };
            setUser(updated);
            localStorage.setItem("switch_user", JSON.stringify(updated));
            setEditingProfile(false);
        }
    };

    const filtered =
        activeFilter === "all"
            ? integrations
            : integrations.filter((i) => i.category === activeFilter);

    const connectedCount = integrations.filter((i) => i.connected).length;

    if (!user) return <div className="bg-black h-screen" />;

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
                            Account & Integrations
                        </h1>
                    </div>
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
                </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar pr-2">
                {/* ═══ PROFILE & IDENTITY ═══ */}
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
                        <div className="flex items-start gap-6">
                            <div className="relative group/avatar shrink-0">
                                <div className="w-20 h-20 border border-white/10 overflow-hidden bg-zinc-900">
                                    <img src={user.image_url} alt="Operator" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <Camera className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent/50" />
                                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-accent/50" />
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-accent/50" />
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent/50" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="text-xl font-display font-black text-white uppercase tracking-tight">
                                    {user.name}
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono tracking-wider">
                                    {profileEmail}
                                </div>
                                <div className="flex gap-3 items-center mt-2">
                                    <div className="text-[9px] text-zinc-600 font-mono flex items-center gap-1">
                                        <Zap className="w-3 h-3 text-accent" />
                                        INTEGRITY: <span className="text-accent font-bold">{user.integrity}%</span>
                                    </div>
                                    <div className="text-[9px] text-zinc-600 font-mono">
                                        OBJECTIVE: <span className="text-white">{user.goal}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editable Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Display Name</label>
                                <input
                                    type="text"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-accent/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Email Address</label>
                                <input
                                    type="email"
                                    value={profileEmail}
                                    onChange={(e) => setProfileEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-accent/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Primary Objective</label>
                                <input
                                    type="text"
                                    value={profileGoal}
                                    onChange={(e) => setProfileGoal(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-accent/50 transition-colors uppercase"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Bio / Status</label>
                                <textarea
                                    value={profileBio}
                                    onChange={(e) => setProfileBio(e.target.value)}
                                    rows={2}
                                    placeholder="Short operator status or personal tagline..."
                                    className="w-full bg-black/50 border border-white/10 py-2 px-3 text-xs font-mono text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    handleProfileSave();
                                    setProfileSaved(true);
                                    setTimeout(() => setProfileSaved(false), 2000);
                                }}
                                className="text-[10px] uppercase tracking-widest font-bold text-black bg-accent hover:bg-accent/80 px-5 py-2 transition-colors flex items-center gap-2"
                            >
                                <Check className="w-3 h-3" /> Save Changes
                            </button>
                            {profileSaved && (
                                <span className="text-[10px] text-accent font-mono animate-pulse">PROFILE UPDATED</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ SECURITY ═══ */}
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
                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Current Password</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-accent/50 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-accent/50 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Confirm New</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-accent/50 transition-colors"
                                            />
                                        </div>
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
                                            <span className="text-[10px] text-accent font-mono animate-pulse">PASSWORD UPDATED</span>
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

                {/* ═══ NOTIFICATION PREFERENCES ═══ */}
                <div className="border border-white/10 bg-[#0a0a0a] relative overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5">
                        <div className="text-[10px] text-accent font-mono tracking-widest uppercase flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Alert Configuration
                        </div>
                    </div>
                    <div className="p-6 space-y-0 divide-y divide-white/5">
                        {[
                            { label: "Email Notifications", desc: "Receive daily integrity reports via email", state: notifEmail, setter: setNotifEmail },
                            { label: "Push Notifications", desc: "Browser push alerts for decay warnings", state: notifPush, setter: setNotifPush },
                            { label: "Weekly Summary", desc: "Receive a weekly protocol compliance digest", state: notifWeekly, setter: setNotifWeekly },
                            { label: "Decay Alerts", desc: "Critical alerts when integrity drops below threshold", state: notifDecay, setter: setNotifDecay },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                <div>
                                    <div className="text-xs text-white font-bold uppercase tracking-tight">{item.label}</div>
                                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{item.desc}</div>
                                </div>
                                <button
                                    onClick={() => item.setter(!item.state)}
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

                {/* ═══ INTEGRATIONS ═══ */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] text-accent font-mono tracking-widest uppercase flex items-center gap-2">
                            <Link2 className="w-3 h-3" />
                            External Systems
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex gap-2 flex-wrap">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveFilter(cat.id)}
                                className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 border transition-all
                                    ${activeFilter === cat.id
                                        ? "border-accent bg-accent/10 text-accent"
                                        : "border-white/5 text-zinc-600 hover:text-white hover:border-white/20"
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Integration Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <AnimatePresence mode="popLayout">
                            {filtered.map((integration) => (
                                <motion.div
                                    key={integration.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`border bg-[#0a0a0a] p-4 flex items-center gap-4 group transition-all relative overflow-hidden
                                        ${integration.connected
                                            ? "border-accent/30 bg-accent/5"
                                            : "border-white/5 hover:border-white/15"
                                        }`}
                                >
                                    {/* Scanning animation on connect */}
                                    {connectingId === integration.id && (
                                        <motion.div
                                            className="absolute inset-0 bg-accent/10 z-0"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 2, ease: "linear" }}
                                        />
                                    )}

                                    {/* Icon */}
                                    <div
                                        className="w-10 h-10 flex items-center justify-center border border-white/10 shrink-0 relative z-10"
                                        style={{
                                            backgroundColor: `${integration.color}10`,
                                        }}
                                    >
                                        <integration.icon size={18} color={integration.color} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 relative z-10">
                                        <div className="text-sm font-display font-bold text-white uppercase tracking-tight flex items-center gap-2">
                                            {integration.name}
                                            {integration.connected && (
                                                <span className="text-[8px] text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded font-mono">
                                                    LINKED
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                                            {integration.description}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <button
                                        onClick={() => handleConnect(integration.id)}
                                        disabled={connectingId === integration.id}
                                        className={`shrink-0 text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 border transition-all relative z-10 disabled:opacity-50 disabled:cursor-wait
                                            ${integration.connected
                                                ? "border-red-500/30 text-red-500/70 hover:bg-red-500/10 hover:text-red-400"
                                                : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 hover:border-accent/30"
                                            }`}
                                    >
                                        {connectingId === integration.id
                                            ? "SYNCING..."
                                            : integration.connected
                                                ? "DISCONNECT"
                                                : "CONNECT"}
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="border border-red-500/20 bg-red-500/5 p-6 space-y-4">
                    <div className="text-[10px] text-red-500 font-mono tracking-widest uppercase font-bold flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        Danger Zone
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-white font-bold uppercase tracking-tight">
                                Sever All Connections
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                                Disconnect all linked integrations and reset account data
                            </div>
                        </div>
                        <button className="text-[9px] uppercase tracking-widest font-bold text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-2 transition-all">
                            Reset Protocol
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
