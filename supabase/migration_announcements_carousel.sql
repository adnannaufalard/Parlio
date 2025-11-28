-- ================================================
-- MIGRATION: Announcements Carousel System
-- Description: Create table and functions for announcement carousel
-- Author: System
-- Date: 2025-11-08
-- ================================================

-- ================================================
-- 1. CREATE ANNOUNCEMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'announcement', -- announcement, event, tips, news
    color_from TEXT DEFAULT 'from-blue-500', -- Tailwind gradient start
    color_to TEXT DEFAULT 'to-blue-600', -- Tailwind gradient end
    icon TEXT, -- Icon name or emoji
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Optional expiry date
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 2. CREATE INDEXES
-- ================================================
-- Index for active announcements ordered by display_order
CREATE INDEX IF NOT EXISTS idx_announcements_active_order 
ON announcements(is_active, display_order) 
WHERE is_active = true;

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_announcements_type 
ON announcements(type);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_announcements_dates 
ON announcements(published_at, expires_at);

-- ================================================
-- 3. CREATE RLS POLICIES
-- ================================================
-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admin can do everything
CREATE POLICY "Super Admin full access on announcements"
ON announcements
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- Policy: Students and Teachers can view active announcements
CREATE POLICY "Users can view active announcements"
ON announcements
FOR SELECT
TO authenticated
USING (
    is_active = true
    AND (published_at IS NULL OR published_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
);

-- ================================================
-- 4. CREATE FUNCTION: Get Active Announcements
-- ================================================
CREATE OR REPLACE FUNCTION get_active_announcements()
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    type TEXT,
    color_from TEXT,
    color_to TEXT,
    icon TEXT,
    display_order INTEGER,
    published_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.description,
        a.type,
        a.color_from,
        a.color_to,
        a.icon,
        a.display_order,
        a.published_at
    FROM announcements a
    WHERE 
        a.is_active = true
        AND (a.published_at IS NULL OR a.published_at <= NOW())
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
    ORDER BY a.display_order ASC, a.created_at DESC;
END;
$$;

-- ================================================
-- 5. CREATE TRIGGER: Auto-update timestamp
-- ================================================
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcements_updated_at();

-- ================================================
-- 6. INSERT DEFAULT ANNOUNCEMENTS DATA
-- ================================================
INSERT INTO announcements (title, description, type, color_from, color_to, icon, is_active, display_order, published_at)
VALUES 
    (
        'Selamat Datang di Parlio! 🎉',
        'Mulai petualangan belajar bahasa Prancis kamu dengan sistem gamifikasi yang menyenangkan. Kumpulkan XP, raih level tertinggi, dan jadilah yang terbaik!',
        'announcement',
        'from-blue-500',
        'to-blue-600',
        '📢',
        true,
        1,
        NOW()
    ),
    (
        'Event: French Culture Week',
        'Ikuti French Culture Week minggu depan! Ada kuis berhadiah, kompetisi pronunciation, dan banyak aktivitas seru lainnya. Jangan sampai ketinggalan!',
        'event',
        'from-purple-500',
        'to-purple-600',
        '📅',
        true,
        2,
        NOW()
    ),
    (
        'Tips: Konsistensi adalah Kunci',
        'Belajar 15 menit setiap hari lebih efektif daripada belajar 2 jam sekali seminggu. Buat jadwal belajar rutin dan patuhi komitmenmu!',
        'tips',
        'from-green-500',
        'to-green-600',
        '💡',
        true,
        3,
        NOW()
    ),
    (
        'Update: Fitur Baru Quest System',
        'Sekarang kamu bisa mengulang quest yang sudah diselesaikan untuk meningkatkan skor dan mendapatkan lebih banyak XP. Coba sekarang!',
        'news',
        'from-orange-500',
        'to-orange-600',
        '🚀',
        true,
        4,
        NOW()
    ),
    (
        'Motivasi: Jangan Takut Salah!',
        'Membuat kesalahan adalah bagian penting dari proses belajar. Setiap kesalahan adalah kesempatan untuk belajar dan berkembang. Terus semangat!',
        'tips',
        'from-pink-500',
        'to-pink-600',
        '⭐',
        true,
        5,
        NOW()
    );

-- ================================================
-- 7. GRANT PERMISSIONS
-- ================================================
-- Grant execute permission on function to authenticated users
GRANT EXECUTE ON FUNCTION get_active_announcements() TO authenticated;

-- ================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ================================================
COMMENT ON TABLE announcements IS 'Stores announcement/carousel cards displayed on student dashboard';
COMMENT ON COLUMN announcements.type IS 'Type of announcement: announcement, event, tips, news';
COMMENT ON COLUMN announcements.color_from IS 'Tailwind gradient start color class (e.g., from-blue-500)';
COMMENT ON COLUMN announcements.color_to IS 'Tailwind gradient end color class (e.g., to-blue-600)';
COMMENT ON COLUMN announcements.icon IS 'Icon emoji or name to display on card';
COMMENT ON COLUMN announcements.display_order IS 'Order of display (lower number = higher priority)';
COMMENT ON COLUMN announcements.published_at IS 'When announcement becomes visible (NULL = immediately)';
COMMENT ON COLUMN announcements.expires_at IS 'When announcement stops being visible (NULL = never expires)';
COMMENT ON FUNCTION get_active_announcements() IS 'Returns all active announcements that should be displayed';

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify table creation: SELECT * FROM announcements;
-- 3. Test function: SELECT * FROM get_active_announcements();
-- 4. Update StudentDashboard.jsx to fetch from database instead of placeholder
-- 5. Build Super Admin interface for CRUD operations
-- ================================================
