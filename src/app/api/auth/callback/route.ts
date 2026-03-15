import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session?.user) {
      const user = session.user;
      
      // Handle Google OAuth metadata sync
      if (user.app_metadata?.provider === "google") {
        const metadata = user.user_metadata;
        const email = user.email || "";
        const emailPrefix = email.split("@")[0] || "";
        
        // Use provided name or default to email prefix
        const name = metadata.full_name || metadata.name || emailPrefix;
        const avatarUrl = metadata.avatar_url || metadata.picture || null;

        // Try to update auth metadata for consistency
        await supabase.auth.updateUser({
          data: { name, username: emailPrefix, avatar_url: avatarUrl }
        });

        // Upsert profile in DB
        // By default, inserting will fail if profile already exists.
        // We do an upsert or single update. Since our profiles table might not do this automatically
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("id", user.id)
          .single();

        if (profile) {
            await supabase
            .from("profiles")
            .update({
              name,
              // Only set username if they don't already have one
              ...(profile.username ? {} : { username: emailPrefix }),
              // Only overwrite avatar if we got one from google
              ...(avatarUrl ? { avatar_url: avatarUrl } : {})
            })
            .eq("id", user.id);
        } else {
            // If the trigger missed them somehow
            await supabase
            .from("profiles")
            .insert([{
                id: user.id,
                name,
                username: emailPrefix,
                avatar_url: avatarUrl
            }]);
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
