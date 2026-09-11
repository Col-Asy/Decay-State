"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Lock, Unlock, ShieldAlert, Plus, Key, Eye, EyeOff, Trash2 } from "lucide-react";
import { getMandates } from "@/lib/db/mandates";
import { useToast } from "@/components/ui/CyberToast";

interface VaultItem {
  id: string;
  label: string;
  secret: string;
  category: "api_key" | "link" | "note";
  created_at: string;
}

export default function VaultPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [integrity, setIntegrity] = useState(100);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Form state
  const [newLabel, setNewLabel] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [newCategory, setNewCategory] = useState<"api_key" | "link" | "note">("api_key");

  useEffect(() => {
    if (!user) return;

    async function loadVault() {
      try {
        const fetchedTasks = await getMandates(user!.id);
        const rate =
          fetchedTasks.length > 0
            ? Math.round(
                (fetchedTasks.filter((t) => t.completed).length / fetchedTasks.length) * 100
              )
            : 0;
        setIntegrity(rate);

        // Load stored vault items from localStorage for user session
        const stored = localStorage.getItem(`vault_${user!.id}`);
        if (stored) {
          setItems(JSON.parse(stored));
        } else {
          // Preset sample item
          const defaultItems: VaultItem[] = [
            {
              id: "v-1",
              label: "Primary Production Repo Key",
              secret: "ghp_98472918472918479218472198",
              category: "api_key",
              created_at: new Date().toISOString(),
            },
          ];
          setItems(defaultItems);
          localStorage.setItem(`vault_${user!.id}`, JSON.stringify(defaultItems));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadVault();
  }, [user]);

  const isLocked = integrity < 70;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newSecret.trim() || !user) return;

    const newItem: VaultItem = {
      id: `v-${Date.now()}`,
      label: newLabel.trim(),
      secret: newSecret.trim(),
      category: newCategory,
      created_at: new Date().toISOString(),
    };

    const updated = [newItem, ...items];
    setItems(updated);
    localStorage.setItem(`vault_${user.id}`, JSON.stringify(updated));

    setNewLabel("");
    setNewSecret("");
    showToast("[VAULT ITEM ENCRYPTED & SAVED]");
  };

  const handleDeleteItem = (id: string) => {
    if (!user) return;
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    localStorage.setItem(`vault_${user.id}`, JSON.stringify(updated));
    showToast("[ITEM REMOVED FROM VAULT]");
  };

  const toggleReveal = (id: string) => {
    if (isLocked) {
      showToast("ACCESS DENIED: INTEGRITY BELOW 70% SECURITY THRESHOLD");
      return;
    }
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-[#050505] h-screen flex items-center justify-center font-mono text-xs text-accent animate-pulse">
        ACCESING ENCRYPTED LOCKBOX...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 border border-white/10 bg-white/5">
              {isLocked ? (
                <Lock className="w-6 h-6 text-red-500 animate-pulse" />
              ) : (
                <Unlock className="w-6 h-6 text-accent" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-display font-black uppercase tracking-wider text-white">
                Operative Secret Lockbox
              </h1>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                Integrity Lock Gate Threshold: 70% | Current: {integrity}%
              </p>
            </div>
          </div>
        </div>

        <div
          className={`px-4 py-2 border font-mono text-xs uppercase tracking-widest flex items-center gap-2 ${
            isLocked
              ? "bg-red-950/60 border-red-600/60 text-red-400"
              : "bg-emerald-950/60 border-emerald-600/60 text-emerald-400"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{isLocked ? "VAULT STATE: LOCKED (INTEGRITY LOW)" : "VAULT STATE: UNLOCKED"}</span>
        </div>
      </header>

      {/* Lockout Warning Banner */}
      {isLocked && (
        <div className="border border-red-900/60 bg-red-950/40 p-6 space-y-3 cyber-border">
          <div className="flex items-center gap-3 text-red-500 font-mono font-bold text-sm uppercase tracking-widest">
            <Lock className="w-5 h-5 animate-pulse" />
            Security Interlock Engaged
          </div>
          <p className="text-xs font-mono text-red-200/80 leading-relaxed">
            Your current integrity score is <strong>{integrity}%</strong>. Access to decrypted vault secrets is revoked until you execute today&apos;s daily mandates and reach <strong>70% integrity</strong>.
          </p>
        </div>
      )}

      {/* Create Secret Form */}
      <form onSubmit={handleAddItem} className="border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
        <div className="text-xs font-mono text-accent uppercase tracking-widest font-bold border-b border-white/5 pb-2">
          + Encrypt New Vault Secret
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              Secret Label
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Master Stripe API Key"
              className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-white focus:outline-none focus:border-accent/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-white focus:outline-none focus:border-accent/50"
            >
              <option value="api_key">API Key / Token</option>
              <option value="link">Private Repo / URL</option>
              <option value="note">Encrypted Note</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              Secret Value
            </label>
            <input
              type="password"
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              placeholder="Enter sensitive string..."
              className="w-full bg-black border border-white/10 p-3 text-xs font-mono text-white focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>

        <button
          type="submit"
          className="border border-white/10 bg-white/5 hover:bg-accent hover:text-black transition-all px-6 py-3 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Store Secret in Lockbox
        </button>
      </form>

      {/* Secret Items List */}
      <div className="space-y-4">
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest border-b border-white/10 pb-2">
          Stored Assets ({items.length})
        </div>

        {items.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-white/10 font-mono text-xs text-zinc-600 uppercase tracking-widest">
            No items in lockbox vault.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => {
              const isRevealed = revealedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className="border border-white/10 bg-[#0a0a0a] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-accent" />
                      <span className="font-display font-bold uppercase text-white tracking-wide">
                        {item.label}
                      </span>
                      <span className="text-[9px] font-mono border border-white/10 px-2 py-0.5 text-zinc-500 uppercase">
                        {item.category}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-zinc-400">
                      {isLocked ? (
                        <span className="text-red-500/80 tracking-widest select-none">
                          •••••••••••••••••••••••• [LOCKED]
                        </span>
                      ) : isRevealed ? (
                        <span className="text-accent select-all">{item.secret}</span>
                      ) : (
                        <span className="text-zinc-600 tracking-widest select-none">
                          ••••••••••••••••••••••••
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleReveal(item.id)}
                      disabled={isLocked}
                      className={`p-2 border transition-colors ${
                        isLocked
                          ? "border-red-900/40 text-red-700 cursor-not-allowed"
                          : "border-white/10 hover:border-accent text-zinc-400 hover:text-accent"
                      }`}
                      title={isLocked ? "Vault Locked" : isRevealed ? "Hide Secret" : "Reveal Secret"}
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 border border-white/10 hover:border-red-500/50 text-zinc-600 hover:text-red-400 transition-colors"
                      title="Delete Secret"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
