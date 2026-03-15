import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateVisualPrompt } from "@/lib/future-self/prompt-generator";
import { generateFutureSelfImage } from "@/lib/future-self/image-generator";

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    // 2. Validate request
    const { missionId } = await req.json();
    if (!missionId) {
      return NextResponse.json(
        { success: false, error: "Missing missionId", code: "UNKNOWN" },
        { status: 400 },
      );
    }

    // 3. Fetch mission (RLS ensures user owns it)
    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .single();

    if (missionError || !mission) {
      return NextResponse.json(
        { success: false, error: "Mission not found", code: "UNKNOWN" },
        { status: 404 },
      );
    }

    // 4. Check generation limit (max 3 per mission)
    const { count, error: countError } = await supabase
      .from("future_self_images")
      .select("*", { count: "exact", head: true })
      .eq("mission_id", missionId);

    if (countError) {
      return NextResponse.json(
        { success: false, error: "Failed to check generation count", code: "UNKNOWN" },
        { status: 500 },
      );
    }

    const currentCount = count ?? 0;
    if (currentCount >= 3) {
      return NextResponse.json(
        { success: false, error: "Generation limit reached (3 per mission)", code: "LIMIT_REACHED" },
        { status: 400 },
      );
    }

    const generationNumber = currentCount + 1;

    // 5. Get source image (user's avatar)
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    const avatarUrl =
      profile?.avatar_url || user.user_metadata?.avatar_url || null;

    if (!avatarUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "No profile photo found. Please upload a photo first.",
          code: "NO_SOURCE_IMAGE",
        },
        { status: 400 },
      );
    }

    // 6. Fetch the source image via HTTP
    const imageResponse = await fetch(avatarUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch source image", code: "NO_SOURCE_IMAGE" },
        { status: 500 },
      );
    }
    const sourceBlob = await imageResponse.blob();

    // 7. Generate visual prompt via Groq
    const visualPrompt = await generateVisualPrompt(
      mission.goal,
      mission.manifesto,
    );

    // 8. Generate image via Hugging Face
    const generatedBlob = await generateFutureSelfImage(
      sourceBlob,
      visualPrompt,
    );

    // 9. Upload generated image to public bucket (RLS allows upload to own folder)
    const storagePath = `${user.id}/future-self-${missionId.slice(0, 8)}-${generationNumber}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("future-self-images")
      .upload(storagePath, generatedBlob, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload generated image", code: "GENERATION_FAILED" },
        { status: 500 },
      );
    }

    // 10. Get public URL
    const { data: urlData } = supabase.storage
      .from("future-self-images")
      .getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // 11. Insert record (auto-select if first generation)
    const isFirst = generationNumber === 1;
    const { data: record, error: insertError } = await supabase
      .from("future_self_images")
      .insert({
        user_id: user.id,
        mission_id: missionId,
        image_url: publicUrl,
        storage_path: storagePath,
        prompt_used: visualPrompt,
        is_selected: isFirst,
        generation_number: generationNumber,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save generated image", code: "GENERATION_FAILED" },
        { status: 500 },
      );
    }

    // 12. If first generation, update missions.image_url
    if (isFirst) {
      await supabase
        .from("missions")
        .update({ image_url: publicUrl })
        .eq("id", missionId);
    }

    return NextResponse.json({
      success: true,
      image: {
        id: record.id,
        imageUrl: publicUrl,
        generationNumber,
        promptUsed: visualPrompt,
      },
      generationsRemaining: 3 - generationNumber,
    });
  } catch (error) {
    console.error("Future self generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        code: "GENERATION_FAILED",
      },
      { status: 500 },
    );
  }
}
