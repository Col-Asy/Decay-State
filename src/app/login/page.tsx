import { redirect } from "next/navigation";

// Old login route — redirect to renamed path
export default function OldLoginPage() {
  redirect("/sys-access");
}
