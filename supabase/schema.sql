-- Schema Tambahan untuk Dashboard Guru
-- Menyesuaikan dengan database yang sudah ada:
-- - profiles (sudah ada)
-- - classes (sudah ada: id SERIAL, class_name, teacher_id, class_code)
-- - class_members (sudah ada: class_id INT, student_id UUID)
-- - modules (sudah ada)
-- - quizzes (sudah ada)
-- - questions (sudah ada)
-- - student_answers (sudah ada)

-- Note: Tidak perlu membuat ulang tabel classes dan class_members karena sudah ada
-- Kita hanya menambahkan tabel baru yang diperlukan untuk fitur guru

-- ============================================
-- TABEL BARU: Assignments & Submissions
-- ============================================

-- Table: assignments (Tugas Tambahan selain Quiz)
-- Untuk tugas esai, speaking, atau tugas lain di luar quiz
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  module_id INT REFERENCES modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'essay', -- 'essay', 'speaking', 'project'
  max_points INT DEFAULT 100,
  due_date TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: assignment_submissions (Pengumpulan Tugas)
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id BIGSERIAL PRIMARY KEY,
  assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT, -- URL file jika siswa upload file
  points_earned INT DEFAULT 0,
  feedback TEXT,
  status TEXT DEFAULT 'submitted', -- 'submitted', 'graded', 'returned'
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES profiles(id),
  UNIQUE(assignment_id, student_id)
);

-- ============================================
-- TABEL BARU: Announcements & Class Resources
-- ============================================

-- Table: class_announcements (Pengumuman Kelas)
CREATE TABLE IF NOT EXISTS class_announcements (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: class_materials (Materi/Resource Kelas)
-- Untuk file PDF, video link, dll
CREATE TABLE IF NOT EXISTS class_materials (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  module_id INT REFERENCES modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT, -- 'pdf', 'video', 'link', 'document'
  file_url TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: student_quiz_attempts (Tracking Percobaan Quiz)
-- Melengkapi student_answers untuk tracking per-attempt
CREATE TABLE IF NOT EXISTS student_quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  max_score INT DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES untuk Performa
-- ============================================
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_module ON assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_announcements_class ON class_announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_materials_class ON class_materials(class_id);
CREATE INDEX IF NOT EXISTS idx_materials_module ON class_materials(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON student_quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON student_quiz_attempts(quiz_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guru dapat CRUD assignments di kelas mereka" ON assignments
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

CREATE POLICY "Siswa dapat melihat assignments published" ON assignments
  FOR SELECT USING (
    is_published = true AND
    class_id IN (SELECT class_id FROM class_members WHERE student_id = auth.uid())
  );

CREATE POLICY "Superadmin dapat CRUD semua assignments" ON assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Assignment Submissions
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa dapat submit dan view submission mereka" ON assignment_submissions
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Guru dapat view/grade submissions di kelas mereka" ON assignment_submissions
  FOR ALL USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()
      )
    )
  );

CREATE POLICY "Superadmin dapat manage semua submissions" ON assignment_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Class Announcements
ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guru dapat CRUD announcements di kelas mereka" ON class_announcements
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

CREATE POLICY "Siswa dapat melihat announcements" ON class_announcements
  FOR SELECT USING (
    class_id IN (SELECT class_id FROM class_members WHERE student_id = auth.uid())
  );

CREATE POLICY "Superadmin dapat CRUD semua announcements" ON class_announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Class Materials
ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guru dapat CRUD materials di kelas mereka" ON class_materials
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

CREATE POLICY "Siswa dapat melihat materials" ON class_materials
  FOR SELECT USING (
    class_id IN (SELECT class_id FROM class_members WHERE student_id = auth.uid())
  );

CREATE POLICY "Superadmin dapat CRUD semua materials" ON class_materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Student Quiz Attempts
ALTER TABLE student_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa dapat view attempts mereka" ON student_quiz_attempts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Guru dapat view attempts siswa di kelas mereka" ON student_quiz_attempts
  FOR SELECT USING (
    quiz_id IN (
      SELECT q.id FROM quizzes q
      JOIN modules m ON m.id = q.module_id
      WHERE q.created_by = auth.uid()
    )
  );

CREATE POLICY "Superadmin dapat view semua attempts" ON student_quiz_attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function untuk auto-update XP dan Coins saat assignment di-grade
CREATE OR REPLACE FUNCTION update_student_xp_from_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update XP di profiles
  UPDATE profiles
  SET 
    xp_points = xp_points + NEW.points_earned,
    coins = coins + (NEW.points_earned / 2) -- 1 coin per 2 XP
  WHERE id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update XP saat assignment dinilai
CREATE TRIGGER trigger_update_xp_from_assignment
AFTER UPDATE OF points_earned ON assignment_submissions
FOR EACH ROW
WHEN (NEW.status = 'graded' AND (OLD.status != 'graded' OR OLD.points_earned != NEW.points_earned))
EXECUTE FUNCTION update_student_xp_from_assignment();

-- ============================================
-- VIEWS untuk Dashboard Stats
-- ============================================

-- View: Teacher Class Stats
CREATE OR REPLACE VIEW teacher_class_stats AS
SELECT 
  c.id as class_id,
  c.class_name,
  c.teacher_id,
  COUNT(DISTINCT cm.student_id) as total_students,
  COUNT(DISTINCT a.id) as total_assignments,
  COUNT(DISTINCT q.id) as total_quizzes,
  COUNT(DISTINCT CASE WHEN asub.status = 'submitted' THEN asub.id END) as pending_submissions
FROM classes c
LEFT JOIN class_members cm ON cm.class_id = c.id
LEFT JOIN assignments a ON a.class_id = c.id
LEFT JOIN quizzes q ON q.created_by = c.teacher_id
LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id
GROUP BY c.id, c.class_name, c.teacher_id;

-- View: Student Performance Summary
CREATE OR REPLACE VIEW student_performance_summary AS
SELECT 
  p.id as student_id,
  p.full_name,
  p.xp_points,
  p.coins,
  COUNT(DISTINCT cm.class_id) as enrolled_classes,
  COUNT(DISTINCT sa.id) as total_answers,
  COUNT(DISTINCT CASE WHEN sa.is_correct THEN sa.id END) as correct_answers,
  COALESCE(
    ROUND(
      (COUNT(DISTINCT CASE WHEN sa.is_correct THEN sa.id END)::NUMERIC / 
       NULLIF(COUNT(DISTINCT sa.id), 0)) * 100,
      2
    ),
    0
  ) as accuracy_percentage
FROM profiles p
LEFT JOIN class_members cm ON cm.student_id = p.id
LEFT JOIN student_answers sa ON sa.student_id = p.id
WHERE p.role = 'siswa'
GROUP BY p.id, p.full_name, p.xp_points, p.coins;

-- View: Teacher Student Performance (untuk filter per guru)
-- View ini menampilkan performa siswa yang HANYA tergabung di kelas guru tertentu
CREATE OR REPLACE VIEW teacher_student_performance AS
SELECT 
  c.teacher_id,
  p.id as student_id,
  p.full_name,
  p.email,
  p.xp_points,
  p.coins,
  cm.class_id,
  c.class_name,
  COUNT(DISTINCT sa.id) as total_answers,
  COUNT(DISTINCT CASE WHEN sa.is_correct THEN sa.id END) as correct_answers,
  COALESCE(
    ROUND(
      (COUNT(DISTINCT CASE WHEN sa.is_correct THEN sa.id END)::NUMERIC / 
       NULLIF(COUNT(DISTINCT sa.id), 0)) * 100,
      2
    ),
    0
  ) as accuracy_percentage,
  COUNT(DISTINCT asub.id) as total_submissions,
  COALESCE(AVG(asub.points_earned), 0) as avg_assignment_score
FROM classes c
INNER JOIN class_members cm ON cm.class_id = c.id
INNER JOIN profiles p ON p.id = cm.student_id
LEFT JOIN student_answers sa ON sa.student_id = p.id
LEFT JOIN assignment_submissions asub ON asub.student_id = p.id
WHERE p.role = 'siswa'
GROUP BY c.teacher_id, p.id, p.full_name, p.email, p.xp_points, p.coins, cm.class_id, c.class_name;
