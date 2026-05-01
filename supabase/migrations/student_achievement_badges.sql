-- Create table for tracking student chapter completion badges
CREATE TABLE IF NOT EXISTS public.student_achievement_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id BIGINT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL DEFAULT 'chapter_completion', -- e.g., 'chapter_completion'
  badge_level INT NOT NULL, -- 1-5 for unite-one to unite-five
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, chapter_id), -- Each student gets one badge per chapter
  CONSTRAINT valid_badge_level CHECK (badge_level BETWEEN 1 AND 5)
);

-- Create index for faster lookups
CREATE INDEX idx_student_achievement_badges_student_id 
ON public.student_achievement_badges(student_id);

CREATE INDEX idx_student_achievement_badges_chapter_id 
ON public.student_achievement_badges(chapter_id);

-- Set up RLS if needed (optional based on your security setup)
ALTER TABLE public.student_achievement_badges ENABLE ROW LEVEL SECURITY;
