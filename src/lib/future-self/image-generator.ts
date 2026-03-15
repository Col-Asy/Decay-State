import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

// FLUX.1-Kontext-dev: contextual image editing model (preserves subject, applies edits)
const PRIMARY_MODEL = "black-forest-labs/FLUX.1-Kontext-dev";
// Fallback: text-to-image (won't preserve face, but generates concept image)
const FALLBACK_MODEL = "black-forest-labs/FLUX.1-schnell";

// Providers to try for image-to-image, in order
const IMAGE_TO_IMAGE_PROVIDERS = ["replicate", "fal-ai"] as const;

export async function generateFutureSelfImage(
  sourceImageBlob: Blob,
  prompt: string,
): Promise<Blob> {
  const errors: string[] = [];

  // Try image-to-image with each provider (preserves face/subject)
  for (const provider of IMAGE_TO_IMAGE_PROVIDERS) {
    try {
      console.log(`Trying image-to-image via ${provider}...`);
      const result = await hf.imageToImage({
        model: PRIMARY_MODEL,
        provider,
        inputs: sourceImageBlob,
        parameters: {
          prompt,
        },
      });
      console.log(`Image-to-image succeeded via ${provider}`);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(`${provider} failed:`, msg);
      errors.push(`${provider}: ${msg}`);
    }
  }

  // Last resort: text-to-image (no face preservation, generates concept image)
  try {
    console.log("Falling back to text-to-image via FLUX.1-schnell...");
    const result = await hf.textToImage({
      model: FALLBACK_MODEL,
      inputs: `Professional portrait photo of a person who has successfully achieved their goal: ${prompt}. Photorealistic, professional headshot style.`,
      parameters: {
        num_inference_steps: 4,
      },
    }, { outputType: "blob" });
    console.log("Text-to-image fallback succeeded");
    return result;
  } catch (fallbackError: unknown) {
    const fallbackMsg =
      fallbackError instanceof Error
        ? fallbackError.message
        : "Unknown error";
    errors.push(`text-to-image: ${fallbackMsg}`);
    throw new Error(
      `All image generation attempts failed: ${errors.join(" | ")}`,
    );
  }
}
