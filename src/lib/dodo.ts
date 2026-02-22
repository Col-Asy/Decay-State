import DodoPayments from "dodopayments";

// Server-side Dodo Payments SDK — never import this in Client Components
// Uses test_mode unless DODO_ENV=live is set
export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
  environment: process.env.DODO_ENV === "live" ? "live_mode" : "test_mode",
});
