// Backward-compatibility re-export — prefer importing from @/lib/supabase/server directly
export {
  createClient as createServerSupabaseClient,
  createServiceClient as createServiceSupabaseClient,
} from "@/lib/supabase/server";
