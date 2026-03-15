import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const todayUTC = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    // --- Fetch or create the shield row ---
    let { data: shieldRow } = await supabase
      .from("shields")
      .select("id, count, consecutive_days, last_evaluated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (!shieldRow) {
      const { data: created, error: createErr } = await supabase
        .from("shields")
        .insert({ user_id: userId, count: 3, consecutive_days: 0 })
        .select("id, count, consecutive_days, last_evaluated_at")
        .single();
      if (createErr) throw new Error(createErr.message);
      shieldRow = created;
    }

    // --- Skip if already evaluated today ---
    if (shieldRow.last_evaluated_at) {
      const lastDate = new Date(shieldRow.last_evaluated_at)
        .toISOString()
        .slice(0, 10);
      if (lastDate >= todayUTC) {
        return NextResponse.json({ evaluated: false, reason: "already_evaluated" });
      }
    }

    // --- Find the most recent daily mandate generation BEFORE today ---
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { data: prevGen } = await supabase
      .from("daily_mandate_generations")
      .select("mandate_ids, created_at")
      .eq("user_id", userId)
      .lt("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // No prior generation → log no_mandates, update timestamp, no penalty
    if (!prevGen || !prevGen.mandate_ids || prevGen.mandate_ids.length === 0) {
      await supabase
        .from("shield_events")
        .insert({
          user_id: userId,
          event_type: "no_mandates",
          shields_after: shieldRow.count,
          evaluated_for: todayUTC,
          seen: false,
        });
      await supabase
        .from("shields")
        .update({ last_evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", shieldRow.id);

      return NextResponse.json({
        evaluated: true,
        event_type: "no_mandates",
        shields_after: shieldRow.count,
      });
    }

    // --- Fetch those mandates and check completion ---
    const { data: mandates } = await supabase
      .from("mandates")
      .select("id, completed")
      .in("id", prevGen.mandate_ids);

    const total = mandates?.length ?? 0;
    const completed = mandates?.filter((m) => m.completed).length ?? 0;
    const allDone = total > 0 && completed === total;

    // --- Apply evaluation logic ---
    let newCount = shieldRow.count;
    let newConsecutive = shieldRow.consecutive_days;
    let eventType: string;

    if (allDone) {
      newConsecutive = shieldRow.consecutive_days + 1;
      if (newConsecutive >= 3 && shieldRow.count < 3) {
        newCount = shieldRow.count + 1;
        newConsecutive = 0;
        eventType = "gained";
      } else {
        eventType = "perfect_day";
      }
    } else {
      newCount = Math.max(0, shieldRow.count - 1);
      newConsecutive = 0;
      eventType = "lost";
    }

    const now = new Date().toISOString();

    // --- Update shields row ---
    await supabase
      .from("shields")
      .update({
        count: newCount,
        consecutive_days: newConsecutive,
        last_evaluated_at: now,
        updated_at: now,
      })
      .eq("id", shieldRow.id);

    // --- Insert shield event ---
    await supabase.from("shield_events").insert({
      user_id: userId,
      event_type: eventType,
      shields_after: newCount,
      evaluated_for: todayUTC,
      seen: false,
    });

    return NextResponse.json({
      evaluated: true,
      event_type: eventType,
      shields_after: newCount,
    });
  } catch (error: any) {
    console.error("Shield evaluation error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
