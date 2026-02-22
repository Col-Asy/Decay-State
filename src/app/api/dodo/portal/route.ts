import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dodo } from "@/lib/dodo";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("dodo_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!sub?.dodo_customer_id) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 404 },
    );
  }

  try {
    const portal = await dodo.customers.customerPortal.create(
      sub.dodo_customer_id,
    );
    return NextResponse.json({ url: portal.link });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Portal creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
