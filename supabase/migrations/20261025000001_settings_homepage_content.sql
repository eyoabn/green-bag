-- Migration: Add homepage_content column to public.settings and support TikTok, YouTube
-- Date: 2026-10-25

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS homepage_content JSONB DEFAULT '{}'::jsonb;
