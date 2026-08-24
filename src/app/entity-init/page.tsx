import { redirect } from "next/navigation";

// Signup is not public — redirect everyone to the waitlist.
// Dev access: navigate directly to /login
export default function SignupPage() {
  redirect("/waitlist");
}
