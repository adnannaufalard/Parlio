-- Migration: Create class_forum_posts table for class discussions
-- Run this in Supabase SQL Editor

-- =============================================
-- Create class_forum_posts table
-- =============================================

CREATE TABLE IF NOT EXISTS public.class_forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_class_forum_posts_class_id ON public.class_forum_posts(class_id);
CREATE INDEX IF NOT EXISTS idx_class_forum_posts_user_id ON public.class_forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_class_forum_posts_created_at ON public.class_forum_posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.class_forum_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Anyone can view posts in their class
CREATE POLICY "Users can view forum posts in their classes"
ON public.class_forum_posts
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.class_members
        WHERE class_members.class_id = class_forum_posts.class_id
        AND class_members.student_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_forum_posts.class_id
        AND classes.teacher_id = auth.uid()
    )
);

-- Policy: Class members can insert posts
CREATE POLICY "Class members can create forum posts"
ON public.class_forum_posts
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND (
        EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_members.class_id = class_forum_posts.class_id
            AND class_members.student_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE classes.id = class_forum_posts.class_id
            AND classes.teacher_id = auth.uid()
        )
    )
);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own forum posts"
ON public.class_forum_posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own posts, teachers can delete any post in their class
CREATE POLICY "Users can delete their own posts or teachers can delete any"
ON public.class_forum_posts
FOR DELETE
USING (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_forum_posts.class_id
        AND classes.teacher_id = auth.uid()
    )
);

-- Add comment
COMMENT ON TABLE public.class_forum_posts IS 'Forum discussion posts for each class';

-- =============================================
-- Verify the changes
-- =============================================
SELECT 'class_forum_posts table created successfully!' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'class_forum_posts';
