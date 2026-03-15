-- =============================================================
-- MIGRATION: Future Self Image Generation
-- Run this in your Supabase SQL Editor
-- =============================================================


-- =============================================================
-- 1. NEW TABLE: future_self_images
-- Tracks AI-generated "future self" images (up to 3 per mission)
-- =============================================================

CREATE TABLE public.future_self_images (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id        UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  image_url         TEXT NOT NULL,
  storage_path      TEXT NOT NULL,
  prompt_used       TEXT,
  is_selected       BOOLEAN NOT NULL DEFAULT false,
  generation_number INTEGER NOT NULL CHECK (generation_number BETWEEN 1 AND 3),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (mission_id, generation_number)
);

-- RLS
ALTER TABLE public.future_self_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "future_self_images: own data"
  ON public.future_self_images FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER trg_future_self_images_updated_at
  BEFORE UPDATE ON public.future_self_images
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =============================================================
-- 2. NEW STORAGE BUCKET: future-self-images (public)
-- Generated images need permanent URLs (no signed URL expiry)
-- =============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('future-self-images', 'future-self-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, owner write
CREATE POLICY "future-self-images: upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'future-self-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "future-self-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'future-self-images');

CREATE POLICY "future-self-images: delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'future-self-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "future-self-images: update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'future-self-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
