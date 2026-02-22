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

  const { annual } = await req.json().catch(() => ({ annual: false }));

  const productId = annual
    ? process.env.NEXT_PUBLIC_DODO_OPERATOR_ANNUAL_PRODUCT_ID!
    : process.env.NEXT_PUBLIC_DODO_OPERATOR_PRODUCT_ID!;

  if (!productId) {
    return NextResponse.json(
      { error: "Product not configured" },
      { status: 500 },
    );
  }

  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      metadata: { user_id: user.id },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/accounts?checkout=success`,
    });

    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Checkout creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
