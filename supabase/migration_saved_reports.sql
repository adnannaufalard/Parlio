-- Migration: Create saved_reports table for storing class reports
-- This table stores saved report data from TeacherClassChapterDetail

-- Table to store saved reports
CREATE TABLE IF NOT EXISTS public.saved_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  saved_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id integer NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  chapter_id integer REFERENCES public.chapters(id) ON DELETE SET NULL,
  lesson_id integer REFERENCES public.lessons(id) ON DELETE SET NULL,
  report_name text NOT NULL,
  report_data jsonb NOT NULL, -- Stores student scores, quest stats, etc.
  notes text,
  saved_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_reports_saved_by ON public.saved_reports(saved_by);
CREATE INDEX IF NOT EXISTS idx_saved_reports_class_id ON public.saved_reports(class_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_saved_at ON public.saved_reports(saved_at DESC);

-- Enable RLS
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Teachers can only see their own reports
CREATE POLICY "Teachers can view own reports" ON public.saved_reports
  FOR SELECT USING (auth.uid() = saved_by);

-- Teachers can insert their own reports
CREATE POLICY "Teachers can insert own reports" ON public.saved_reports
  FOR INSERT WITH CHECK (auth.uid() = saved_by);

-- Teachers can update their own reports
CREATE POLICY "Teachers can update own reports" ON public.saved_reports
  FOR UPDATE USING (auth.uid() = saved_by);

-- Teachers can delete their own reports
CREATE POLICY "Teachers can delete own reports" ON public.saved_reports
  FOR DELETE USING (auth.uid() = saved_by);

-- Grant permissions
GRANT ALL ON public.saved_reports TO authenticated;
GRANT ALL ON public.saved_reports TO service_role;
