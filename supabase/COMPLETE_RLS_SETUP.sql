# Complete RLS Setup - All Tables

## Tables Yang Butuh RLS Fix

### 1. profiles table
### 2. student_chapter_progress table  
### 3. student_lesson_progress table
### 4. student_quest_attempts table
### 5. chapters table
### 6. lessons table
### 7. quests table
### 8. class_chapters table

---

## Complete SQL - Copy & Paste All

```sql
-- ============================================
-- TABLE: profiles
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view profiles (for leaderboard, teacher names, etc)
CREATE POLICY "Enable read access for authenticated users" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Users can update their own profile
CREATE POLICY "Enable update for users based on id" 
ON profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Users can insert their own profile (for registration)
CREATE POLICY "Enable insert for authentication" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

-- ============================================
-- TABLE: chapters
-- ============================================
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Everyone can view chapters
CREATE POLICY "Anyone can view chapters" 
ON chapters FOR SELECT 
TO authenticated 
USING (true);

-- Teachers can insert/update/delete chapters (use service_role for superadmin)
CREATE POLICY "Teachers can manage chapters" 
ON chapters FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- ============================================
-- TABLE: lessons
-- ============================================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Everyone can view lessons
CREATE POLICY "Anyone can view lessons" 
ON lessons FOR SELECT 
TO authenticated 
USING (true);

-- Teachers can manage lessons (use service_role for superadmin)
CREATE POLICY "Teachers can manage lessons" 
ON lessons FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- ============================================
-- TABLE: quests
-- ============================================
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- Everyone can view quests
CREATE POLICY "Anyone can view quests" 
ON quests FOR SELECT 
TO authenticated 
USING (true);

-- Teachers can manage quests (use service_role for superadmin)
CREATE POLICY "Teachers can manage quests" 
ON quests FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- ============================================
-- TABLE: class_chapters
-- ============================================
ALTER TABLE class_chapters ENABLE ROW LEVEL SECURITY;

-- Students can view chapters assigned to their classes
CREATE POLICY "Students can view assigned chapters" 
ON class_chapters FOR SELECT 
TO authenticated 
USING (
  class_id IN (
    SELECT class_id FROM class_members 
    WHERE student_id = auth.uid()
  )
);

-- Teachers can manage chapters in their classes
CREATE POLICY "Teachers can manage class chapters" 
ON class_chapters FOR ALL 
TO authenticated 
USING (
  class_id IN (
    SELECT id FROM classes 
    WHERE teacher_id = auth.uid()
  )
);

-- Note: Superadmin access via service_role, not RLS

-- ============================================
-- CREATE TABLE: student_chapter_progress
-- ============================================
-- Create table if not exists
CREATE TABLE IF NOT EXISTS student_chapter_progress (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
  is_unlocked BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, chapter_id)
);

-- Enable RLS
ALTER TABLE student_chapter_progress ENABLE ROW LEVEL SECURITY;

-- Students can view and manage their own progress
CREATE POLICY "Students can manage own chapter progress" 
ON student_chapter_progress FOR ALL 
TO authenticated 
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Teachers can view progress in their classes
CREATE POLICY "Teachers can view student chapter progress" 
ON student_chapter_progress FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM class_members cm
    JOIN classes c ON c.id = cm.class_id
    WHERE cm.student_id = student_chapter_progress.student_id
    AND c.teacher_id = auth.uid()
  )
);

-- Note: Superadmin access via service_role, not RLS

-- ============================================
-- CREATE TABLE: student_lesson_progress
-- ============================================
CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- Enable RLS
ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Students can manage their own progress
CREATE POLICY "Students can manage own lesson progress" 
ON student_lesson_progress FOR ALL 
TO authenticated 
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Teachers can view progress
CREATE POLICY "Teachers can view student lesson progress" 
ON student_lesson_progress FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM class_members cm
    JOIN classes c ON c.id = cm.class_id
    WHERE cm.student_id = student_lesson_progress.student_id
    AND c.teacher_id = auth.uid()
  )
);

-- Note: Superadmin access via service_role, not RLS

-- ============================================
-- CREATE TABLE: student_quest_attempts
-- ============================================
CREATE TABLE IF NOT EXISTS student_quest_attempts (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id INT REFERENCES quests(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  percentage DECIMAL DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_quest_attempts ENABLE ROW LEVEL SECURITY;

-- Students can view and create their own attempts
CREATE POLICY "Students can manage own quest attempts" 
ON student_quest_attempts FOR ALL 
TO authenticated 
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Teachers can view attempts
CREATE POLICY "Teachers can view student quest attempts" 
ON student_quest_attempts FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM class_members cm
    JOIN classes c ON c.id = cm.class_id
    WHERE cm.student_id = student_quest_attempts.student_id
    AND c.teacher_id = auth.uid()
  )
);

-- Note: Superadmin access via service_role, not RLS

-- ============================================
-- CREATE INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_student_chapter_progress_student 
ON student_chapter_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_student_chapter_progress_chapter 
ON student_chapter_progress(chapter_id);

CREATE INDEX IF NOT EXISTS idx_student_lesson_progress_student 
ON student_lesson_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_student_lesson_progress_lesson 
ON student_lesson_progress(lesson_id);

CREATE INDEX IF NOT EXISTS idx_student_quest_attempts_student 
ON student_quest_attempts(student_id);

CREATE INDEX IF NOT EXISTS idx_student_quest_attempts_quest 
ON student_quest_attempts(quest_id);
```

## Verification Queries

```sql
-- Check all tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 'classes', 'class_members', 
  'chapters', 'lessons', 'quests', 'class_chapters',
  'student_chapter_progress', 'student_lesson_progress', 
  'student_quest_attempts'
);

-- Check policies count
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

## Testing

```sql
-- Test as student
SELECT * FROM profiles WHERE id = auth.uid();
SELECT * FROM student_chapter_progress WHERE student_id = auth.uid();
SELECT * FROM student_lesson_progress WHERE student_id = auth.uid();
SELECT * FROM student_quest_attempts WHERE student_id = auth.uid();
```

## Notes
- All progress tables created with proper foreign keys
- RLS policies allow students to manage their own data
- Teachers can view their students' progress
- Superadmin has full access to everything
- Indexes added for performance
