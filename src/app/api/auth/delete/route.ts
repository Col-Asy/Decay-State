import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the current user securely
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // 2. Initialize the admin client to perform the deletion
    const supabaseAdmin = await createServiceClient();
    
    // 3. Delete the user
    // This will cascade and delete the user from public.profiles automatically
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Failed to delete user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete account." },
        { status: 500 }
      );
    }

    // 4. Return success
    return NextResponse.json({ success: true, message: "Account deleted" });
  } catch (error) {
    console.error("Unexpected error deleting account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
