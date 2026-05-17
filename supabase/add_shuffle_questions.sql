-- Tambahkan kolom shuffle_questions ke tabel quests jika belum ada
ALTER TABLE quests ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false;
