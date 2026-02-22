import { createClient } from "@/lib/supabase/client";

export type Subscription = {
  id: string;
  user_id: string;
  dodo_customer_id: string | null;
  dodo_subscription_id: string | null;
  tier: "observer" | "operator";
  status: "active" | "cancelled" | "on_hold" | "failed" | "renewed";
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export async function getSubscription(
  userId: string,
): Promise<Subscription | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Subscription | null;
}

/** Used by webhook handler via service role client to update subscription state */
export async function upsertSubscription(
  userId: string,
  patch: Partial<
    Omit<Subscription, "id" | "user_id" | "created_at" | "updated_at">
  >,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("subscriptions")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
}
