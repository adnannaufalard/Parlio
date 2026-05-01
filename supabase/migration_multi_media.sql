-- Migration: Add multi-media support (JSONB columns)
-- Run this in Supabase SQL Editor

-- Add media_files JSONB column to lesson_materials
-- Format: [{type: "video"|"audio"|"pdf"|"image", url: "...", name: "...", source: "upload"|"url"}]
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS media_files jsonb DEFAULT '[]'::jsonb;

-- Add media_files JSONB column to questions
-- Format: [{type: "image"|"audio"|"video", url: "...", name: "...", source: "upload"|"url"}]
ALTER TABLE questions ADD COLUMN IF NOT EXISTS media_files jsonb DEFAULT '[]'::jsonb;

-- Note: Existing fields (file_url, question_image_url, question_audio_url, question_video_url) 
-- are kept for backward compatibility. The UI will merge legacy fields + media_files.
-- Options format in questions.options now supports: [{text, is_correct, media: [{type, url, name}]}]
