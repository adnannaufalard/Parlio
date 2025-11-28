-- ============================================
-- SCHEMA UNTUK QUEST SYSTEM (MENARA EIFFEL)
-- Struktur: Chapter (Lantai) -> Lessons (Sub-bab) -> Quests (Tantangan)
-- ============================================

-- Table: chapters (Bab / Lantai Menara Eiffel)
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  floor_number INT NOT NULL, -- Lantai 1, 2, 3, dst
  icon TEXT, -- URL icon untuk UI
  bg_color TEXT DEFAULT '#3B82F6', -- Warna background card
  is_published BOOLEAN DEFAULT false,
  unlock_xp_required INT DEFAULT 0, -- XP yang dibutuhkan untuk unlock
  created_by UUID REFERENCES profiles(id), -- Guru yang membuat chapter
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan kolom created_by jika belum ada (untuk backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE chapters ADD COLUMN created_by UUID REFERENCES profiles(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE chapters ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE chapters ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Table: class_chapters (Junction table untuk assign chapters ke classes)
CREATE TABLE IF NOT EXISTS class_chapters (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id), -- Guru yang assign
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true, -- Bisa dinonaktifkan tanpa menghapus
  UNIQUE(class_id, chapter_id)
);

-- Table: lessons (Sub-bab dalam setiap Chapter)
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_order INT NOT NULL, -- Urutan dalam chapter
  content_type TEXT DEFAULT 'mixed', -- 'video', 'audio', 'text', 'mixed'
  estimated_duration INT DEFAULT 30, -- Estimasi menit
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: lesson_materials (Materi dalam setiap Lesson)
CREATE TABLE IF NOT EXISTS lesson_materials (
  id SERIAL PRIMARY KEY,
  lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  material_type TEXT NOT NULL, -- 'pdf', 'audio', 'video', 'image', 'text'
  file_url TEXT, -- URL file di Supabase Storage
  content TEXT, -- Untuk tipe 'text'
  material_order INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: question_templates (Template Soal)
CREATE TABLE IF NOT EXISTS question_templates (
  id SERIAL PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'multiple_choice', 'fill_blank', 'matching', 'audio_response', 'essay'
  description TEXT,
  default_points INT DEFAULT 10,
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: questions (Bank Soal)
-- Note: Jika tabel sudah ada dari schema sebelumnya, kita perlu alter
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  template_id INT REFERENCES question_templates(id) ON DELETE SET NULL,
  question_type TEXT NOT NULL, -- 'multiple_choice', 'fill_blank', 'matching', 'audio_response', 'essay'
  question_text TEXT NOT NULL,
  question_audio_url TEXT, -- URL audio soal
  question_image_url TEXT, -- URL gambar soal
  
  -- Options untuk multiple choice
  options JSONB, -- [{id: 'A', text: 'Option A'}, ...]
  correct_answer TEXT, -- 'A', 'B', atau text jawaban untuk fill_blank
  
  -- Untuk matching
  matching_pairs JSONB, -- [{left: 'Bonjour', right: 'Hello'}, ...]
  
  -- Metadata
  difficulty TEXT DEFAULT 'easy', -- 'easy', 'medium', 'hard'
  topic_tags TEXT[], -- ['vocabulary', 'grammar', 'listening']
  points INT DEFAULT 10,
  explanation TEXT, -- Penjelasan jawaban
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan kolom-kolom baru jika belum ada (untuk backward compatibility)
DO $$ 
BEGIN
  -- Add lesson_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'lesson_id'
  ) THEN
    ALTER TABLE questions ADD COLUMN lesson_id INT REFERENCES lessons(id) ON DELETE SET NULL;
  END IF;
  
  -- Add template_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE questions ADD COLUMN template_id INT REFERENCES question_templates(id) ON DELETE SET NULL;
  END IF;
  
  -- Add question_audio_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'question_audio_url'
  ) THEN
    ALTER TABLE questions ADD COLUMN question_audio_url TEXT;
  END IF;
  
  -- Add question_image_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'question_image_url'
  ) THEN
    ALTER TABLE questions ADD COLUMN question_image_url TEXT;
  END IF;
  
  -- Add options (JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'options'
  ) THEN
    ALTER TABLE questions ADD COLUMN options JSONB;
  END IF;
  
  -- Add correct_answer
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'correct_answer'
  ) THEN
    ALTER TABLE questions ADD COLUMN correct_answer TEXT;
  END IF;
  
  -- Add matching_pairs (JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'matching_pairs'
  ) THEN
    ALTER TABLE questions ADD COLUMN matching_pairs JSONB;
  END IF;
  
  -- Add difficulty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE questions ADD COLUMN difficulty TEXT DEFAULT 'easy';
  END IF;
  
  -- Add topic_tags (TEXT[])
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'topic_tags'
  ) THEN
    ALTER TABLE questions ADD COLUMN topic_tags TEXT[];
  END IF;
  
  -- Add points
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'points'
  ) THEN
    ALTER TABLE questions ADD COLUMN points INT DEFAULT 10;
  END IF;
  
  -- Add explanation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'explanation'
  ) THEN
    ALTER TABLE questions ADD COLUMN explanation TEXT;
  END IF;
  
  -- Add created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE questions ADD COLUMN created_by UUID REFERENCES profiles(id);
  END IF;
  
  -- Add created_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE questions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Add updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE questions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Add pairs (alias untuk matching_pairs, untuk konsistensi nama)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'pairs'
  ) THEN
    ALTER TABLE questions ADD COLUMN pairs JSONB;
  END IF;
  
  -- Add correct_order (untuk arrange_sentence)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'correct_order'
  ) THEN
    ALTER TABLE questions ADD COLUMN correct_order JSONB;
  END IF;
  
  -- Add scrambled_words (untuk arrange_sentence)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'scrambled_words'
  ) THEN
    ALTER TABLE questions ADD COLUMN scrambled_words TEXT;
  END IF;
  
  -- Add audio_url (untuk listening)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE questions ADD COLUMN audio_url TEXT;
  END IF;
  
  -- Add question_video_url (untuk media tambahan)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'question_video_url'
  ) THEN
    ALTER TABLE questions ADD COLUMN question_video_url TEXT;
  END IF;
END $$;

-- Table: quests (Tantangan di akhir setiap Lesson)
CREATE TABLE IF NOT EXISTS quests (
  id SERIAL PRIMARY KEY,
  lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT DEFAULT 'practice', -- 'practice', 'daily_task', 'chapter_exam', 'boss_battle'
  question_type TEXT DEFAULT 'multiple_choice', -- 'multiple_choice', 'essay', 'matching', 'arrange_sentence', 'listening'
  
  -- Rules & Rewards
  xp_reward INT DEFAULT 50,
  coins_reward INT DEFAULT 25,
  badge_id INT, -- Reference ke badges table (akan dibuat)
  
  -- Difficulty & Requirements
  difficulty TEXT DEFAULT 'medium',
  min_score_to_pass INT DEFAULT 70, -- Skor minimal untuk lulus (%)
  max_attempts INT DEFAULT 3, -- Maksimal percobaan
  time_limit_minutes INT, -- Batas waktu (nullable)
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  unlock_previous_required BOOLEAN DEFAULT true, -- Harus selesai quest sebelumnya
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan kolom question_type jika belum ada (untuk backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quests' AND column_name = 'question_type'
  ) THEN
    ALTER TABLE quests ADD COLUMN question_type TEXT DEFAULT 'multiple_choice';
  END IF;
END $$;

-- Table: quest_questions (Soal dalam setiap Quest)
CREATE TABLE IF NOT EXISTS quest_questions (
  id SERIAL PRIMARY KEY,
  quest_id INT REFERENCES quests(id) ON DELETE CASCADE,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  question_order INT NOT NULL,
  points_override INT, -- Override points dari question (optional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quest_id, question_id)
);

-- Table: student_quest_attempts (Tracking percobaan siswa)
CREATE TABLE IF NOT EXISTS student_quest_attempts (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id INT REFERENCES quests(id) ON DELETE CASCADE,
  
  -- Attempt info
  attempt_number INT DEFAULT 1,
  score INT DEFAULT 0,
  max_score INT NOT NULL,
  percentage NUMERIC(5,2) DEFAULT 0,
  
  -- Results
  passed BOOLEAN DEFAULT false,
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INT,
  
  UNIQUE(student_id, quest_id, attempt_number)
);

-- Table: student_quest_answers (Jawaban siswa per soal)
CREATE TABLE IF NOT EXISTS student_quest_answers (
  id BIGSERIAL PRIMARY KEY,
  attempt_id BIGINT REFERENCES student_quest_attempts(id) ON DELETE CASCADE,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Answer data
  answer_text TEXT,
  answer_audio_url TEXT, -- Untuk audio response
  is_correct BOOLEAN DEFAULT false,
  points_earned INT DEFAULT 0,
  
  -- Feedback
  feedback TEXT,
  
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

-- Table: badges (Lencana Achievement)
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon_url TEXT,
  badge_type TEXT DEFAULT 'quest', -- 'quest', 'streak', 'mastery', 'special'
  requirement_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: student_badges (Lencana yang dimiliki siswa)
CREATE TABLE IF NOT EXISTS student_badges (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id INT REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, badge_id)
);

-- Table: student_chapter_progress (Progress siswa per chapter)
CREATE TABLE IF NOT EXISTS student_chapter_progress (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
  
  is_unlocked BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  current_lesson_id INT REFERENCES lessons(id),
  
  total_xp_earned INT DEFAULT 0,
  total_coins_earned INT DEFAULT 0,
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  UNIQUE(student_id, chapter_id)
);

-- Table: student_lesson_progress (Progress siswa per lesson)
CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
  
  is_unlocked BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  materials_viewed INT DEFAULT 0,
  total_materials INT DEFAULT 0,
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  UNIQUE(student_id, lesson_id)
);

-- ============================================
-- INDEXES untuk Performa
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chapters_floor ON chapters(floor_number);
CREATE INDEX IF NOT EXISTS idx_chapters_created_by ON chapters(created_by);
CREATE INDEX IF NOT EXISTS idx_class_chapters_class ON class_chapters(class_id);
CREATE INDEX IF NOT EXISTS idx_class_chapters_chapter ON class_chapters(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter ON lessons(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson ON lesson_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quests_lesson ON quests(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quest_questions_quest ON quest_questions(quest_id);
CREATE INDEX IF NOT EXISTS idx_student_attempts_student ON student_quest_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attempts_quest ON student_quest_attempts(quest_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt ON student_quest_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_student ON student_chapter_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON student_lesson_progress(student_id);

-- Index untuk lesson_id di questions (dibuat setelah kolom ditambahkan)
CREATE INDEX IF NOT EXISTS idx_questions_lesson ON questions(lesson_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Chapters
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public dapat view chapters published" ON chapters;
CREATE POLICY "Public dapat view chapters published" ON chapters
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Guru dapat CRUD chapters mereka" ON chapters;
CREATE POLICY "Guru dapat CRUD chapters mereka" ON chapters
  FOR ALL USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Class Chapters (Assignment)
ALTER TABLE class_chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guru dapat view class chapters di kelas mereka" ON class_chapters;
CREATE POLICY "Guru dapat view class chapters di kelas mereka" ON class_chapters
  FOR SELECT USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Guru dapat assign chapters ke kelas mereka" ON class_chapters;
CREATE POLICY "Guru dapat assign chapters ke kelas mereka" ON class_chapters
  FOR INSERT WITH CHECK (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "Guru dapat update/delete class chapters di kelas mereka" ON class_chapters;
CREATE POLICY "Guru dapat update/delete class chapters di kelas mereka" ON class_chapters
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Siswa dapat view chapters di kelas mereka" ON class_chapters;
CREATE POLICY "Siswa dapat view chapters di kelas mereka" ON class_chapters
  FOR SELECT USING (
    class_id IN (SELECT class_id FROM class_members WHERE student_id = auth.uid())
  );

-- Lessons
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public dapat view lessons published" ON lessons;
CREATE POLICY "Public dapat view lessons published" ON lessons
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Guru dapat CRUD lessons" ON lessons;
CREATE POLICY "Guru dapat CRUD lessons" ON lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'superadmin'))
  );

-- Lesson Materials
ALTER TABLE lesson_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa dapat view materials" ON lesson_materials;
CREATE POLICY "Siswa dapat view materials" ON lesson_materials
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Guru dapat CRUD materials" ON lesson_materials;
CREATE POLICY "Guru dapat CRUD materials" ON lesson_materials
  FOR ALL USING (created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Question Templates
ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public dapat view public templates" ON question_templates;
CREATE POLICY "Public dapat view public templates" ON question_templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "Guru dapat CRUD templates mereka" ON question_templates;
CREATE POLICY "Guru dapat CRUD templates mereka" ON question_templates
  FOR ALL USING (created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa dapat view questions published" ON questions;
CREATE POLICY "Siswa dapat view questions published" ON questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Guru dapat CRUD questions mereka" ON questions;
CREATE POLICY "Guru dapat CRUD questions mereka" ON questions
  FOR ALL USING (created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Quests
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa dapat view quests published" ON quests;
CREATE POLICY "Siswa dapat view quests published" ON quests
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Guru dapat CRUD quests mereka" ON quests;
CREATE POLICY "Guru dapat CRUD quests mereka" ON quests
  FOR ALL USING (created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Quest Questions
ALTER TABLE quest_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public dapat view quest questions" ON quest_questions;
CREATE POLICY "Public dapat view quest questions" ON quest_questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Guru dapat CRUD quest questions" ON quest_questions;
CREATE POLICY "Guru dapat CRUD quest questions" ON quest_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'superadmin'))
  );

-- Student Quest Attempts
ALTER TABLE student_quest_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa dapat view attempts mereka" ON student_quest_attempts;
CREATE POLICY "Siswa dapat view attempts mereka" ON student_quest_attempts
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Siswa dapat create attempts" ON student_quest_attempts;
CREATE POLICY "Siswa dapat create attempts" ON student_quest_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Guru dapat view attempts siswa" ON student_quest_attempts;
CREATE POLICY "Guru dapat view attempts siswa" ON student_quest_attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'superadmin'))
  );

-- Student Quest Answers
ALTER TABLE student_quest_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa dapat view answers mereka" ON student_quest_answers;
CREATE POLICY "Siswa dapat view answers mereka" ON student_quest_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM student_quest_attempts WHERE id = attempt_id AND student_id = auth.uid())
  );

DROP POLICY IF EXISTS "Siswa dapat create answers" ON student_quest_answers;
CREATE POLICY "Siswa dapat create answers" ON student_quest_answers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM student_quest_attempts WHERE id = attempt_id AND student_id = auth.uid())
  );

-- Badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public dapat view badges" ON badges;
CREATE POLICY "Public dapat view badges" ON badges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Guru dapat CRUD badges" ON badges;
CREATE POLICY "Guru dapat CRUD badges" ON badges
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'superadmin'))
  );

-- Student Badges
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa dapat view badges mereka" ON student_badges;
CREATE POLICY "Siswa dapat view badges mereka" ON student_badges
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Public dapat view badges siswa lain" ON student_badges;
CREATE POLICY "Public dapat view badges siswa lain" ON student_badges
  FOR SELECT USING (true);

-- Student Chapter Progress
ALTER TABLE student_chapter_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa dapat view progress mereka" ON student_chapter_progress;
CREATE POLICY "Siswa dapat view progress mereka" ON student_chapter_progress
  FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Guru dapat view progress siswa" ON student_chapter_progress;
CREATE POLICY "Guru dapat view progress siswa" ON student_chapter_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'superadmin'))
  );

-- Student Lesson Progress
ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa dapat view progress mereka" ON student_lesson_progress;
CREATE POLICY "Siswa dapat view progress mereka" ON student_lesson_progress
  FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Guru dapat view progress siswa" ON student_lesson_progress;
CREATE POLICY "Guru dapat view progress siswa" ON student_lesson_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'superadmin'))
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Auto-award XP dan Coins saat quest selesai
CREATE OR REPLACE FUNCTION award_quest_rewards()
RETURNS TRIGGER AS $$
BEGIN
  -- Hanya jalankan jika quest baru completed dan passed
  IF NEW.completed_at IS NOT NULL AND NEW.passed = true AND 
     (OLD.completed_at IS NULL OR OLD.passed = false) THEN
    
    -- Update XP dan Coins di profiles
    UPDATE profiles
    SET 
      xp_points = xp_points + NEW.xp_earned,
      coins = coins + NEW.coins_earned
    WHERE id = NEW.student_id;
    
    -- Update chapter progress
    UPDATE student_chapter_progress scp
    SET total_xp_earned = total_xp_earned + NEW.xp_earned,
        total_coins_earned = total_coins_earned + NEW.coins_earned
    FROM quests q
    JOIN lessons l ON l.id = q.lesson_id
    WHERE scp.student_id = NEW.student_id 
      AND scp.chapter_id = l.chapter_id
      AND q.id = NEW.quest_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_award_quest_rewards ON student_quest_attempts;
CREATE TRIGGER trigger_award_quest_rewards
AFTER UPDATE ON student_quest_attempts
FOR EACH ROW
EXECUTE FUNCTION award_quest_rewards();

-- Function: Auto-unlock next lesson saat quest selesai
CREATE OR REPLACE FUNCTION unlock_next_content()
RETURNS TRIGGER AS $$
DECLARE
  next_lesson_id INT;
  current_chapter_id INT;
BEGIN
  -- Hanya jalankan jika quest passed
  IF NEW.passed = true THEN
    -- Get current lesson and chapter
    SELECT l.id, l.chapter_id INTO next_lesson_id, current_chapter_id
    FROM lessons l
    JOIN quests q ON q.lesson_id = l.id
    WHERE q.id = NEW.quest_id;
    
    -- Mark current lesson as completed
    UPDATE student_lesson_progress
    SET is_completed = true, completed_at = NOW()
    WHERE student_id = NEW.student_id AND lesson_id = next_lesson_id;
    
    -- Find next lesson in same chapter
    SELECT l.id INTO next_lesson_id
    FROM lessons l
    WHERE l.chapter_id = current_chapter_id
      AND l.lesson_order > (SELECT lesson_order FROM lessons WHERE id = next_lesson_id)
    ORDER BY l.lesson_order ASC
    LIMIT 1;
    
    -- Unlock next lesson if exists
    IF next_lesson_id IS NOT NULL THEN
      INSERT INTO student_lesson_progress (student_id, lesson_id, is_unlocked, started_at)
      VALUES (NEW.student_id, next_lesson_id, true, NOW())
      ON CONFLICT (student_id, lesson_id) 
      DO UPDATE SET is_unlocked = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_unlock_next_content ON student_quest_attempts;
CREATE TRIGGER trigger_unlock_next_content
AFTER UPDATE ON student_quest_attempts
FOR EACH ROW
WHEN (NEW.passed = true AND OLD.passed = false)
EXECUTE FUNCTION unlock_next_content();

-- ============================================
-- VIEWS untuk Dashboard & Analytics
-- ============================================

-- View: Chapter Stats (untuk teacher dashboard)
DROP VIEW IF EXISTS chapter_stats CASCADE;
CREATE OR REPLACE VIEW chapter_stats AS
SELECT 
  c.id as chapter_id,
  c.title as chapter_title,
  c.floor_number,
  c.created_by as creator_id,
  COUNT(DISTINCT cc.class_id) as assigned_to_classes,
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT q.id) as total_quests,
  COUNT(DISTINCT qq.question_id) as total_questions,
  SUM(q.xp_reward) as total_xp_available,
  COUNT(DISTINCT scp.student_id) as students_started,
  COUNT(DISTINCT CASE WHEN scp.is_completed THEN scp.student_id END) as students_completed
FROM chapters c
LEFT JOIN class_chapters cc ON cc.chapter_id = c.id AND cc.is_active = true
LEFT JOIN lessons l ON l.chapter_id = c.id
LEFT JOIN quests q ON q.lesson_id = l.id
LEFT JOIN quest_questions qq ON qq.quest_id = q.id
LEFT JOIN student_chapter_progress scp ON scp.chapter_id = c.id
GROUP BY c.id, c.title, c.floor_number, c.created_by;

-- View: Student Quest Performance
DROP VIEW IF EXISTS student_quest_performance CASCADE;
CREATE OR REPLACE VIEW student_quest_performance AS
SELECT 
  sqa.student_id,
  p.full_name,
  q.id as quest_id,
  q.title as quest_title,
  l.title as lesson_title,
  c.title as chapter_title,
  sqa.attempt_number,
  sqa.score,
  sqa.max_score,
  sqa.percentage,
  sqa.passed,
  sqa.xp_earned,
  sqa.coins_earned,
  sqa.completed_at
FROM student_quest_attempts sqa
JOIN profiles p ON p.id = sqa.student_id
JOIN quests q ON q.id = sqa.quest_id
JOIN lessons l ON l.id = q.lesson_id
JOIN chapters c ON c.id = l.chapter_id
WHERE p.role = 'siswa';

-- View: Question Bank Stats
DROP VIEW IF EXISTS question_stats CASCADE;
CREATE OR REPLACE VIEW question_stats AS
SELECT 
  q.id as question_id,
  q.question_type,
  q.difficulty,
  q.topic_tags,
  q.points,
  COUNT(DISTINCT sqa.id) as times_answered,
  COUNT(DISTINCT CASE WHEN sqa.is_correct THEN sqa.id END) as times_correct,
  COALESCE(
    ROUND(
      (COUNT(DISTINCT CASE WHEN sqa.is_correct THEN sqa.id END)::NUMERIC / 
       NULLIF(COUNT(DISTINCT sqa.id), 0)) * 100,
      2
    ),
    0
  ) as correct_percentage
FROM questions q
LEFT JOIN student_quest_answers sqa ON sqa.question_id = q.id
GROUP BY q.id, q.question_type, q.difficulty, q.topic_tags, q.points;

-- View: Class Chapter Assignments (untuk melihat chapter di setiap kelas)
DROP VIEW IF EXISTS class_chapter_details CASCADE;
CREATE OR REPLACE VIEW class_chapter_details AS
SELECT 
  cc.id as assignment_id,
  cc.class_id,
  cl.class_name,
  cl.teacher_id,
  cc.chapter_id,
  c.title as chapter_title,
  c.floor_number,
  c.is_published,
  cc.is_active,
  cc.assigned_at,
  COUNT(DISTINCT l.id) as total_lessons_in_chapter,
  COUNT(DISTINCT cm.student_id) as total_students_in_class,
  COUNT(DISTINCT scp.student_id) as students_started_chapter,
  COUNT(DISTINCT CASE WHEN scp.is_completed THEN scp.student_id END) as students_completed_chapter
FROM class_chapters cc
JOIN classes cl ON cl.id = cc.class_id
JOIN chapters c ON c.id = cc.chapter_id
LEFT JOIN lessons l ON l.chapter_id = c.id
LEFT JOIN class_members cm ON cm.class_id = cl.id
LEFT JOIN student_chapter_progress scp ON scp.chapter_id = c.id AND scp.student_id = cm.student_id
GROUP BY cc.id, cc.class_id, cl.class_name, cl.teacher_id, cc.chapter_id, c.title, c.floor_number, c.is_published, cc.is_active, cc.assigned_at;
