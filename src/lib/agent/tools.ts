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
      schema: z.object({}),
    },
  );

  // Simple single-mandate creation tool (8B model friendly — no array schemas)
  const createMandate = tool(
    async (input) => {
      try {
        // Check Observer mandate limit (5 mandates max)
        const { count } = await supabase
          .from("mandates")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (count !== null && count >= 5) {
          return JSON.stringify({
            success: false,
            error: "Mandate limit reached (5/5). The user must complete or delete existing mandates before creating new ones. Tell the user this.",
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
        "Creates a single mandate (task) for the user. Call this tool ONCE for EACH mandate you want to create. For example to create 3 mandates, call this tool 3 separate times.",
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
              manifesto: input.manifesto || null,
            })
            .eq("id", existing.id);

          if (error)
            return JSON.stringify({ success: false, error: error.message });
        } else {
          const { error } = await supabase.from("missions").insert({
            user_id: userId,
            goal: input.goal,
            timeframe: input.timeframe,
            manifesto: input.manifesto || null,
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
        manifesto: z
          .string()
          .optional()
          .describe("Detailed plan for achieving the goal"),
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
              `${t.completed ? "[x]" : "[ ]"} ${t.label} (${t.category})${t.rationale ? ` — ${t.rationale}` : ""}`,
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
          .default("pending")
          .describe("Filter mandates by status"),
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

  const searchJournal = tool(
    async (input) => {
      try {
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
    updateMission,
    getUpcomingTasks,
    breakDownTask,
    searchJournal,
  ];
}
