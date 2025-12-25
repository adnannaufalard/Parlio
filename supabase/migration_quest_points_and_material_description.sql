-- Migration: Add point-based scoring system to quests + material description
-- Run this in Supabase SQL Editor

-- =============================================
-- PART 1: Quest Points System
-- =============================================

-- Add poin_per_soal column (points per correct answer)
ALTER TABLE public.quests
ADD COLUMN IF NOT EXISTS poin_per_soal INTEGER DEFAULT 10;

-- Add min_points column (minimum points to pass)
ALTER TABLE public.quests
ADD COLUMN IF NOT EXISTS min_points INTEGER DEFAULT 60;

-- Update existing quests: calculate min_points from min_score_to_pass
-- Assuming 10 questions * 10 points = 100 max points
-- So min_points = min_score_to_pass (since both are effectively percentage-based)
UPDATE public.quests
SET 
  poin_per_soal = 10,
  min_points = COALESCE(min_score_to_pass, 70)
WHERE poin_per_soal IS NULL OR min_points IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.quests.poin_per_soal IS 'Points awarded per correct answer. Total score = correct_answers * poin_per_soal';
COMMENT ON COLUMN public.quests.min_points IS 'Minimum total points required to pass the quest';

-- =============================================
-- PART 2: Material Description
-- =============================================

-- Add description column to lesson_materials
ALTER TABLE public.lesson_materials
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.lesson_materials.description IS 'Teacher explanation or instructions for the material';

-- =============================================
-- Verify the changes
-- =============================================
SELECT 'Quests table:' as info;
SELECT id, title, poin_per_soal, min_points, min_score_to_pass 
FROM public.quests 
LIMIT 3;

SELECT 'Lesson Materials table:' as info;
SELECT id, title, description, material_type 
FROM public.lesson_materials 
LIMIT 3;
