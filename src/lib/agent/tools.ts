import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates all agent tools scoped to a specific user.
 * Accepts a server-side Supabase client for proper auth/RLS.
 *
 * Tool schemas are kept SIMPLE (no arrays) so that smaller
 * models like llama-3.1-8b-instant can call them reliably.
 */
export function createAgentTools(
  userId: string,
  supabase: SupabaseClient,
) {
  const getUserContext = tool(
    async () => {
      try {
        const [
          { data: mandates },
          { data: missions },
          { data: journal },
        ] = await Promise.all([
          supabase
            .from("mandates")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true }),
          supabase
            .from("missions")
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true)
            .maybeSingle(),
          supabase
            .from("journal_entries")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        const allMandates = mandates || [];
        const mission = missions;
        const entries = journal || [];

        const completed = allMandates.filter((t: any) => t.completed);
        const pending = allMandates.filter((t: any) => !t.completed);
        const integrity =
          allMandates.length > 0
            ? Math.round((completed.length / allMandates.length) * 100)
            : 0;

        let context = `INTEGRITY: ${integrity}%\n`;

        if (mission) {
          context += `\nACTIVE MISSION:\n- Goal: ${mission.goal}\n- Timeframe: ${mission.timeframe}\n- Plan: ${mission.manifesto || "No details provided"}`;
        } else {
          context += `\nACTIVE MISSION: None set`;
        }

        context += `\n\nMANDATES (${completed.length}/${allMandates.length} completed):`;
        pending.forEach((t: any) => {
          context += `\n- [ ] ${t.label} (${t.category})`;
        });
        completed.forEach((t: any) => {
          context += `\n- [x] ${t.label} (${t.category})`;
        });

        if (entries.length > 0) {
          context += `\n\nRECENT JOURNAL ENTRIES:`;
          entries.forEach((entry: any) => {
            context += `\n--- ${entry.date} ---`;
            if (entry.wins) context += `\nWins: ${entry.wins}`;
            if (entry.failures) context += `\nFailures: ${entry.failures}`;
            if (entry.adjustments)
              context += `\nAdjustments: ${entry.adjustments}`;
          });
        }

        return context;
      } catch (error) {
        return `Error fetching user context: ${error}`;
      }
    },
    {
      name: "get_user_context",
      description:
        "Fetches the user's current mission, all mandates (tasks), recent journal entries, and integrity score. Use this when the user asks about their progress or status.",
      schema: z.object({
        reason: z.string().describe("Brief reason for fetching context"),
      }),
    },
  );

  // Simple single-mandate creation tool (8B model friendly — no array schemas)
  const createMandate = tool(
    async (input) => {
      try {
        // --- Daily limit: AI chat can only generate 3 mandates per day ---
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Get daily-generated mandate IDs to exclude from the count
        const { data: dailyGens } = await supabase
          .from("daily_mandate_generations")
          .select("mandate_ids")
          .eq("user_id", userId)
          .gte("created_at", todayStart.toISOString());

        const dailyMandateIds = new Set(
          (dailyGens || []).flatMap((g: any) => g.mandate_ids || []),
        );

        // Count only AI-chat mandates created today (exclude daily-generated)
        const { data: todayMandates, error: countError } = await supabase
          .from("mandates")
          .select("id")
          .eq("user_id", userId)
          .not("rationale", "is", null)
          .gte("created_at", todayStart.toISOString());

        if (countError) {
          return JSON.stringify({ success: false, error: countError.message });
        }

        const aiChatCount = (todayMandates || []).filter(
          (m: any) => !dailyMandateIds.has(m.id),
        ).length;

        if (aiChatCount >= 3) {
          return JSON.stringify({
            success: false,
            error: "Daily AI mandate limit reached (3 per day). The user already has 3 AI-generated mandates today. Try again tomorrow.",
          });
        }

        // Get active mission to link the mandate
        const { data: mission } = await supabase
          .from("missions")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        const { data, error } = await supabase
          .from("mandates")
          .insert({
            user_id: userId,
            mission_id: mission?.id ?? null,
            label: input.label,
            category: input.category,
            rationale: input.rationale || null,
            completed: false,
          })
          .select()
          .single();

        if (error) {
          return JSON.stringify({ success: false, error: error.message });
        }

        return JSON.stringify({
          success: true,
          message: `Mandate created: "${data.label}"`,
          mandate: {
            id: data.id,
            label: data.label,
            category: data.category,
            rationale: data.rationale,
          },
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Failed to create mandate: ${error}`,
        });
      }
    },
    {
      name: "create_mandate",
      description:
        "Creates a single mandate (task) for the user. You can only create up to 3 mandates per day. Call this tool ONCE for EACH mandate you want to create. For example to create 3 mandates, call this tool 3 separate times.",
      schema: z.object({
        label: z
          .string()
          .describe("Short actionable task description, max 8 words"),
        category: z
          .enum(["physical", "intellectual", "spiritual"])
          .describe("Task category"),
        rationale: z
          .string()
          .describe("Brief explanation of why this task matters"),
      }),
    },
  );

  const updateMission = tool(
    async (input) => {
      try {
        // Check for existing active mission
        const { data: existing } = await supabase
          .from("missions")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("missions")
            .update({
              goal: input.goal,
              timeframe: input.timeframe,
            })
            .eq("id", existing.id);

          if (error)
            return JSON.stringify({ success: false, error: error.message });
        } else {
          const { error } = await supabase.from("missions").insert({
            user_id: userId,
            goal: input.goal,
            timeframe: input.timeframe,
            is_active: true,
          });

          if (error)
            return JSON.stringify({ success: false, error: error.message });
        }

        return JSON.stringify({
          success: true,
          message: `Mission updated`,
          mission: { goal: input.goal, timeframe: input.timeframe },
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Failed to update mission: ${error}`,
        });
      }
    },
    {
      name: "update_mission",
      description:
        "Updates or creates the user's active mission/goal. Use when the user wants to set a new objective or change their goal.",
      schema: z.object({
        goal: z.string().describe("The user's primary goal"),
        timeframe: z
          .string()
          .describe("How long to achieve the goal, e.g. '30 Days'"),
      }),
    },
  );

  const getUpcomingTasks = tool(
    async (input) => {
      try {
        let query = supabase
          .from("mandates")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        if (input.filter === "pending") {
          query = query.eq("completed", false);
        } else if (input.filter === "completed") {
          query = query.eq("completed", true);
        }

        const { data, error } = await query;
        if (error)
          return `Error fetching tasks: ${error.message}`;

        if (!data || data.length === 0) {
          return `No ${input.filter || ""} mandates found.`;
        }

        return data
          .map(
            (t: any) =>
              `[ID: ${t.id}] ${t.completed ? "[x]" : "[ ]"} ${t.label} (${t.category})${t.rationale ? ` — ${t.rationale}` : ""}`,
          )
          .join("\n");
      } catch (error) {
          return `Error fetching tasks: ${error}`;
      }
    },
    {
      name: "get_upcoming_tasks",
      description:
        "Fetches the user's mandates with an optional filter. Use when the user asks about their pending or completed tasks.",
      schema: z.object({
        filter: z
          .enum(["pending", "completed", "all"])
          .describe("Filter mandates: 'pending', 'completed', or 'all'"),
      }),
    },
  );

  const breakDownTask = tool(
    async (input) => {
      return JSON.stringify({
        task: input.task_description,
        instruction:
          "Generate a breakdown of this task into concrete, actionable sub-tasks. Present them to the user, then ask if they want you to create them as mandates using the create_mandate tool.",
      });
    },
    {
      name: "break_down_task",
      description:
        "Use this when the user asks to decompose a complex goal into smaller steps. Results are suggestions only — not saved. Present them and ask if the user wants to create them as mandates.",
      schema: z.object({
        task_description: z
          .string()
          .describe("The task or goal to break down"),
      }),
    },
  );

  const toggleMandate = tool(
    async (input) => {
      try {
        // Find the mandate first
        const { data: mandate, error: fetchError } = await supabase
          .from("mandates")
          .select("*")
          .eq("id", input.mandate_id)
          .eq("user_id", userId)
          .single();

        if (fetchError || !mandate) {
          return JSON.stringify({
            success: false,
            error: "Mandate not found. Use get_upcoming_tasks to see valid mandate IDs.",
          });
        }

        const newStatus = !mandate.completed;
        const { error } = await supabase
          .from("mandates")
          .update({
            completed: newStatus,
            completed_at: newStatus ? new Date().toISOString() : null,
          })
          .eq("id", input.mandate_id);

        if (error) {
          return JSON.stringify({ success: false, error: error.message });
        }

        return JSON.stringify({
          success: true,
          message: `Mandate "${mandate.label}" marked as ${newStatus ? "completed" : "pending"}`,
          mandate: { id: mandate.id, label: mandate.label, completed: newStatus },
        });
      } catch (error) {
        return JSON.stringify({ success: false, error: `Failed to toggle mandate: ${error}` });
      }
    },
    {
      name: "toggle_mandate",
      description:
        "Marks a mandate as completed or uncompleted. Use when the user says they finished a task, completed something, or wants to undo a completion. You MUST call get_upcoming_tasks first to get the mandate ID.",
      schema: z.object({
        mandate_id: z
          .string()
          .describe("The UUID of the mandate to toggle"),
      }),
    },
  );

  const deleteMandate = tool(
    async (input) => {
      try {
        // Verify it belongs to user
        const { data: mandate, error: fetchError } = await supabase
          .from("mandates")
          .select("id, label")
          .eq("id", input.mandate_id)
          .eq("user_id", userId)
          .single();

        if (fetchError || !mandate) {
          return JSON.stringify({
            success: false,
            error: "Mandate not found. Use get_upcoming_tasks to see valid mandate IDs.",
          });
        }

        const { error } = await supabase
          .from("mandates")
          .delete()
          .eq("id", input.mandate_id);

        if (error) {
          return JSON.stringify({ success: false, error: error.message });
        }

        return JSON.stringify({
          success: true,
          message: `Mandate "${mandate.label}" has been deleted`,
        });
      } catch (error) {
        return JSON.stringify({ success: false, error: `Failed to delete mandate: ${error}` });
      }
    },
    {
      name: "delete_mandate",
      description:
        "Permanently deletes a mandate. Use when the user explicitly asks to remove or delete a task. You MUST call get_upcoming_tasks first to get the mandate ID.",
      schema: z.object({
        mandate_id: z
          .string()
          .describe("The UUID of the mandate to delete"),
      }),
    },
  );

  const editMandate = tool(
    async (input) => {
      try {
        const { data: mandate, error: fetchError } = await supabase
          .from("mandates")
          .select("*")
          .eq("id", input.mandate_id)
          .eq("user_id", userId)
          .single();

        if (fetchError || !mandate) {
          return JSON.stringify({
            success: false,
            error: "Mandate not found. Use get_upcoming_tasks to see valid mandate IDs.",
          });
        }

        const patch: Record<string, any> = {};
        if (input.label) patch.label = input.label;

        const { error } = await supabase
          .from("mandates")
          .update(patch)
          .eq("id", input.mandate_id);

        if (error) {
          return JSON.stringify({ success: false, error: error.message });
        }

        return JSON.stringify({
          success: true,
          message: `Mandate updated: "${input.label || mandate.label}"`,
          mandate: {
            id: mandate.id,
            label: input.label || mandate.label,
            category: mandate.category,
          },
        });
      } catch (error) {
        return JSON.stringify({ success: false, error: `Failed to update mandate: ${error}` });
      }
    },
    {
      name: "edit_mandate",
      description:
        "Updates an existing mandate's label. Use when the user wants to rename or change a task. You MUST call get_upcoming_tasks first to get the mandate ID.",
      schema: z.object({
        mandate_id: z
          .string()
          .describe("The UUID of the mandate to update"),
        label: z
          .string()
          .describe("New label for the mandate"),
      }),
    },
  );

  const createJournalEntry = tool(
    async (input) => {
      try {
        // Get active mission to link
        const { data: mission } = await supabase
          .from("missions")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        const { data, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: userId,
            mission_id: mission?.id ?? null,
            mandate_id: null,
            date: new Date().toISOString().split("T")[0],
            wins: input.wins || null,
            failures: input.failures || null,
            adjustments: input.adjustments || null,
            image_url: null,
          })
          .select()
          .single();

        if (error) {
          return JSON.stringify({ success: false, error: error.message });
        }

        // Embed into ChromaDB for RAG (fire-and-forget, non-blocking)
        try {
          const { embedJournalEntry } = await import("@/lib/rag/journal-rag");
          embedJournalEntry({
            id: data.id,
            user_id: userId,
            date: data.date,
            wins: input.wins || null,
            failures: input.failures || null,
            adjustments: input.adjustments || null,
          }).catch((err: any) =>
            console.warn("RAG embed failed for agent-created entry:", err?.message),
          );
        } catch {
          // RAG module not available — skip silently
        }

        return JSON.stringify({
          success: true,
          message: `Journal entry created for ${data.date}`,
          entry: { id: data.id, date: data.date },
        });
      } catch (error) {
        return JSON.stringify({ success: false, error: `Failed to create journal entry: ${error}` });
      }
    },
    {
      name: "create_journal_entry",
      description:
        "Creates a journal entry recording the user's wins, failures, and adjustments. Use when the user wants to log their day or reflect on progress.",
      schema: z.object({
        wins: z
          .string()
          .describe("What went well — wins, achievements, progress. Use 'none' if not provided."),
        failures: z
          .string()
          .describe("What went wrong — failures, setbacks. Use 'none' if not provided."),
        adjustments: z
          .string()
          .describe("What to change — new strategies or plans. Use 'none' if not provided."),
      }),
    },
  );

  const searchJournal = tool(
    async (input) => {
      try {
        // Try semantic search first via RAG
        try {
          const { retrieveRelevantEntries } = await import(
            "@/lib/rag/journal-rag"
          );
          const results = await retrieveRelevantEntries(
            userId,
            input.query,
            5,
          );
          if (results) return results;
        } catch {
          // RAG unavailable, fall back to keyword search below
        }

        // Fallback: original keyword search
        const { data, error } = await supabase
          .from("journal_entries")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) return `Error searching journal: ${error.message}`;
        if (!data || data.length === 0) return "No journal entries found.";

        const query = input.query.toLowerCase();
        const matching = data.filter((e: any) => {
          const text =
            `${e.wins || ""} ${e.failures || ""} ${e.adjustments || ""}`.toLowerCase();
          return text.includes(query);
        });

        if (matching.length === 0) {
          return `No journal entries found matching "${input.query}".`;
        }

        return matching
          .slice(0, 5)
          .map((e: any) => {
            let text = `--- ${e.date} ---`;
            if (e.wins) text += `\nWins: ${e.wins}`;
            if (e.failures) text += `\nFailures: ${e.failures}`;
            if (e.adjustments) text += `\nAdjustments: ${e.adjustments}`;
            return text;
          })
          .join("\n\n");
      } catch (error) {
        return `Error searching journal: ${error}`;
      }
    },
    {
      name: "search_journal",
      description:
        "Searches the user's journal entries for a specific topic or keyword.",
      schema: z.object({
        query: z
          .string()
          .describe("Search query to find matching journal entries"),
      }),
    },
  );

  return [
    getUserContext,
    createMandate,
    toggleMandate,
    deleteMandate,
    editMandate,
    updateMission,
    getUpcomingTasks,
    breakDownTask,
    createJournalEntry,
    searchJournal,
  ];
}
