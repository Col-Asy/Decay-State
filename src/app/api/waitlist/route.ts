import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role — bypasses RLS so unauthenticated users can submit
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, tier } = await req.json();

    // Basic server-side validation
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }
    const validTiers = ["01", "02", "03"];
    const safeTier = validTiers.includes(tier) ? tier : "02";

    const { error } = await supabase.from("waitlist").insert({
      email: email.toLowerCase().trim(),
      tier: safeTier,
    });

    if (error) {
      // Unique constraint violation — email already registered
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email is already in the queue." },
          { status: 409 }
        );
      }
      console.error("[waitlist] Supabase error:", error);
      return NextResponse.json({ error: "Submission failed. Try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[waitlist] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
