-- Migration: Simplify passing score to percentage only (min_score_to_pass)
-- Run this in Supabase SQL Editor

-- =============================================
-- Migrate existing data from min_points to min_score_to_pass
-- =============================================

-- For quests that have min_points set but not min_score_to_pass,
-- we need to convert min_points to percentage
-- Assuming the typical setup: 5 questions * 10 points = 50 max points
-- min_points 30 out of 50 = 60%

-- First, update min_score_to_pass based on min_points if min_score_to_pass is null or still default 70
UPDATE public.quests
SET min_score_to_pass = CASE 
    -- If min_points was set to something reasonable (not 0), use it directly as percentage
    -- Since teacher was inputting "60" thinking it was percentage, just use that value
    WHEN min_points IS NOT NULL AND min_points > 0 AND min_points <= 100 THEN min_points
    -- Default to 60% if nothing was set
    ELSE 60
  END
WHERE min_score_to_pass IS NULL OR min_score_to_pass = 70;

-- Set default value for min_score_to_pass to 60 for future quests
ALTER TABLE public.quests 
ALTER COLUMN min_score_to_pass SET DEFAULT 60;

-- Update any NULL min_score_to_pass to 60
UPDATE public.quests
SET min_score_to_pass = 60
WHERE min_score_to_pass IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.quests.min_score_to_pass IS 'Minimum percentage (0-100) required to pass the quest. e.g., 60 means student needs to score at least 60% to pass.';

-- =============================================
-- Verify the changes
-- =============================================
SELECT 'Updated quests:' as info;
SELECT id, title, min_score_to_pass, min_points, poin_per_soal
FROM public.quests 
ORDER BY id
LIMIT 10;
