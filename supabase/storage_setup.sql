-- ============================================
-- SETUP SUPABASE STORAGE FOR QUEST MEDIA
-- ============================================

-- Create storage bucket for quest media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quest-media',
  'quest-media',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies untuk quest-media bucket
-- Policy: Guru dapat upload file
DROP POLICY IF EXISTS "Guru dapat upload media" ON storage.objects;
CREATE POLICY "Guru dapat upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quest-media' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('guru', 'superadmin')
  )
);

-- Policy: Semua user bisa lihat file (public bucket)
DROP POLICY IF EXISTS "Public dapat view media" ON storage.objects;
CREATE POLICY "Public dapat view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'quest-media');

-- Policy: Guru bisa update file mereka
DROP POLICY IF EXISTS "Guru dapat update media mereka" ON storage.objects;
CREATE POLICY "Guru dapat update media mereka"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'quest-media' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('guru', 'superadmin')
  )
);

-- Policy: Guru bisa hapus file mereka
DROP POLICY IF EXISTS "Guru dapat delete media mereka" ON storage.objects;
CREATE POLICY "Guru dapat delete media mereka"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'quest-media' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('guru', 'superadmin')
  )
);
