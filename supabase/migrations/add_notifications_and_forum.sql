-- 1. Create user_notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'achievement', 'forum'
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);

-- RLS for notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
ON public.user_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.user_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
ON public.user_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Add parent_id to class_forum_posts for replies
ALTER TABLE public.class_forum_posts 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.class_forum_posts(id) ON DELETE CASCADE;

-- 3. RLS for student_achievement_badges (if not already properly set)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'student_achievement_badges' AND policyname = 'Students can view own badges'
    ) THEN
        CREATE POLICY "Students can view own badges"
        ON public.student_achievement_badges FOR SELECT
        TO authenticated
        USING (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'student_achievement_badges' AND policyname = 'Authenticated users can insert badges'
    ) THEN
        CREATE POLICY "Authenticated users can insert badges"
        ON public.student_achievement_badges FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = student_id);
    END IF;
END $$;
