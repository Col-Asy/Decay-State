import { createClient } from "@/lib/supabase/client";

/**
 * Upload a file to Supabase Storage.
 * Files are stored under `{bucketName}/{userId}/{filename}` so RLS
 * policies (folder-based ownership) work automatically.
 *
 * @returns Public URL (for avatars) or signed URL (for mission-images)
 */
export async function uploadFile(
  bucket: "avatars" | "mission-images" | "journal-images",
  userId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();

  // Sanitise the filename and prefix with userId for RLS
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) throw new Error(error.message);

  if (bucket === "avatars" || bucket === "journal-images") {
    // public buckets — return permanent public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } else {
    // mission-images bucket is private — return a 1-hour signed URL
    const { data, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    if (signError) throw new Error(signError.message);
    return data.signedUrl;
  }
}

/**
 * Delete a file from Supabase Storage given its full storage path.
 */
export async function deleteFile(
  bucket: "avatars" | "mission-images" | "journal-images",
  path: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}
