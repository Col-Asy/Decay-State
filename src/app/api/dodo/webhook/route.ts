import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { dodo } from "@/lib/dodo";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let event: ReturnType<typeof dodo.webhooks.unwrap>;
  try {
    event = dodo.webhooks.unwrap(rawBody, {
      headers: Object.fromEntries(req.headers.entries()),
      key: process.env.DODO_WEBHOOK_SECRET!,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const supabase = await createServiceClient();
  const payload = event.data as unknown as Record<string, unknown>;
  const userId = (payload?.metadata as Record<string, string>)?.user_id;

  if (!userId) return NextResponse.json({ received: true });

  const subscriptionId = payload?.subscription_id as string | undefined;
  const customerId = payload?.customer_id as string | undefined;
  const periodEnd = payload?.current_period_end as string | undefined;

  switch (event.type) {
    case "subscription.active":
    case "subscription.renewed":
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          dodo_customer_id: customerId ?? null,
          dodo_subscription_id: subscriptionId ?? null,
          tier: "operator",
          status: "active",
          current_period_end: periodEnd ?? null,
        },
        { onConflict: "user_id" },
      );
      break;

    case "subscription.on_hold":
      await supabase
        .from("subscriptions")
        .update({ status: "on_hold" })
        .eq("user_id", userId);
      break;

    case "subscription.failed":
      await supabase
        .from("subscriptions")
        .update({ status: "failed" })
        .eq("user_id", userId);
      break;

    case "subscription.cancelled":
      await supabase
        .from("subscriptions")
        .update({
          tier: "observer",
          status: "cancelled",
          dodo_subscription_id: null,
        })
        .eq("user_id", userId);
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
