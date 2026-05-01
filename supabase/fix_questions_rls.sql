-- Fix RLS policies for questions table
-- Allow any authenticated user (teacher) to update questions
-- This is needed because questions may be created by one teacher
-- but edited by another teacher managing the same quest

-- First, check current policies (run this separately to see what exists):
-- SELECT * FROM pg_policies WHERE tablename = 'questions';

-- Drop restrictive update policy if it exists (adjust name as needed)
-- DROP POLICY IF EXISTS "Users can update own questions" ON questions;
-- DROP POLICY IF EXISTS "questions_update_policy" ON questions;

-- Create a permissive update policy for authenticated users
-- Option 1: Allow any authenticated user to update any question
CREATE POLICY "Allow authenticated users to update questions" 
ON questions FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Also ensure teachers can read all questions
CREATE POLICY "Allow authenticated users to read questions" 
ON questions FOR SELECT 
TO authenticated 
USING (true);

-- Also ensure teachers can insert questions
CREATE POLICY "Allow authenticated users to insert questions" 
ON questions FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Do the same for lesson_materials
CREATE POLICY "Allow authenticated users to update lesson_materials" 
ON lesson_materials FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read lesson_materials" 
ON lesson_materials FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert lesson_materials" 
ON lesson_materials FOR INSERT 
TO authenticated 
WITH CHECK (true);
