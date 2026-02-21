-- Migration for leaderboard settings and store products
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX EXISTING TABLES
-- ============================================

-- Add joined_at column to class_members if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'class_members' AND column_name = 'joined_at') THEN
    ALTER TABLE public.class_members ADD COLUMN joined_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- ============================================
-- CREATE NEW TABLES
-- ============================================

-- Class Forum Posts table
CREATE TABLE IF NOT EXISTS public.class_forum_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id integer NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT class_forum_posts_pkey PRIMARY KEY (id),
  CONSTRAINT class_forum_posts_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
  CONSTRAINT class_forum_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Leaderboard settings table (class_id NULL = global leaderboard)
CREATE TABLE IF NOT EXISTS public.leaderboard_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id integer,
  teacher_id uuid NOT NULL,
  period_name text NOT NULL DEFAULT 'Periode 1'::text,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leaderboard_settings_pkey PRIMARY KEY (id),
  CONSTRAINT leaderboard_settings_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
  CONSTRAINT leaderboard_settings_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id)
);

-- Leaderboard badges for winners (class_id NULL = global badge)
CREATE TABLE IF NOT EXISTS public.leaderboard_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  leaderboard_setting_id uuid NOT NULL,
  student_id uuid NOT NULL,
  class_id integer,
  rank integer NOT NULL CHECK (rank BETWEEN 1 AND 3),
  badge_type text NOT NULL CHECK (badge_type IN ('gold', 'silver', 'bronze')),
  xp_at_end integer DEFAULT 0,
  awarded_at timestamp with time zone DEFAULT now(),
  period_name text,
  CONSTRAINT leaderboard_badges_pkey PRIMARY KEY (id),
  CONSTRAINT leaderboard_badges_setting_fkey FOREIGN KEY (leaderboard_setting_id) REFERENCES public.leaderboard_settings(id) ON DELETE CASCADE,
  CONSTRAINT leaderboard_badges_student_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT leaderboard_badges_class_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);

-- Store products table
CREATE TABLE IF NOT EXISTS public.store_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  class_id integer,
  product_name text NOT NULL,
  description text,
  coin_price integer NOT NULL DEFAULT 0,
  image_url text,
  stock integer DEFAULT -1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT store_products_pkey PRIMARY KEY (id),
  CONSTRAINT store_products_teacher_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id),
  CONSTRAINT store_products_class_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);

-- Student purchases (redemptions)
CREATE TABLE IF NOT EXISTS public.store_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  product_id uuid NOT NULL,
  coins_spent integer NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  purchased_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  processed_by uuid,
  notes text,
  CONSTRAINT store_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT store_purchases_student_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT store_purchases_product_fkey FOREIGN KEY (product_id) REFERENCES public.store_products(id),
  CONSTRAINT store_purchases_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.profiles(id)
);

-- ============================================
-- FIX CONSTRAINTS AFTER TABLE CREATION
-- ============================================

-- Fix leaderboard_settings class_id to allow NULL (for global leaderboard)
DO $$
BEGIN
  -- Only drop NOT NULL if the constraint exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_settings' 
    AND column_name = 'class_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.leaderboard_settings ALTER COLUMN class_id DROP NOT NULL;
  END IF;
END $$;

-- Fix leaderboard_badges class_id to allow NULL (for global badges)  
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_badges' 
    AND column_name = 'class_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.leaderboard_badges ALTER COLUMN class_id DROP NOT NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.class_forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if any
DROP POLICY IF EXISTS "Class members and teachers can view forum posts" ON public.class_forum_posts;
DROP POLICY IF EXISTS "Class members and teachers can create forum posts" ON public.class_forum_posts;
DROP POLICY IF EXISTS "Users can update their own forum posts" ON public.class_forum_posts;
DROP POLICY IF EXISTS "Users can delete their own forum posts" ON public.class_forum_posts;

DROP POLICY IF EXISTS "Teachers can manage their own leaderboard settings" ON public.leaderboard_settings;
DROP POLICY IF EXISTS "Students can view leaderboard settings" ON public.leaderboard_settings;
DROP POLICY IF EXISTS "Students can view leaderboard settings for their classes" ON public.leaderboard_settings;

DROP POLICY IF EXISTS "Anyone can view leaderboard badges" ON public.leaderboard_badges;
DROP POLICY IF EXISTS "Teachers can manage badges for their classes" ON public.leaderboard_badges;

DROP POLICY IF EXISTS "Teachers can manage their own products" ON public.store_products;
DROP POLICY IF EXISTS "Students can view products" ON public.store_products;

DROP POLICY IF EXISTS "Students can create purchases" ON public.store_purchases;
DROP POLICY IF EXISTS "Students can view their own purchases" ON public.store_purchases;
DROP POLICY IF EXISTS "Teachers can view and manage purchases for their products" ON public.store_purchases;

-- RLS policies for class_forum_posts
CREATE POLICY "Class members and teachers can view forum posts" ON public.class_forum_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_members 
      WHERE class_members.class_id = class_forum_posts.class_id 
      AND class_members.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = class_forum_posts.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Class members and teachers can create forum posts" ON public.class_forum_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.class_members 
        WHERE class_members.class_id = class_forum_posts.class_id 
        AND class_members.student_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.classes 
        WHERE classes.id = class_forum_posts.class_id 
        AND classes.teacher_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own forum posts" ON public.class_forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forum posts" ON public.class_forum_posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for leaderboard_settings
CREATE POLICY "Teachers can manage their own leaderboard settings" ON public.leaderboard_settings
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view leaderboard settings" ON public.leaderboard_settings
  FOR SELECT USING (
    class_id IS NULL -- Global leaderboard visible to all
    OR EXISTS (
      SELECT 1 FROM public.class_members 
      WHERE class_members.class_id = leaderboard_settings.class_id 
      AND class_members.student_id = auth.uid()
    )
  );

-- RLS policies for leaderboard_badges
CREATE POLICY "Anyone can view leaderboard badges" ON public.leaderboard_badges
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage badges for their classes" ON public.leaderboard_badges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = leaderboard_badges.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can manage global badges (class_id IS NULL) if they own the leaderboard_setting
CREATE POLICY "Teachers can manage global badges" ON public.leaderboard_badges
  FOR ALL USING (
    leaderboard_badges.class_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.leaderboard_settings 
      WHERE leaderboard_settings.id = leaderboard_badges.leaderboard_setting_id 
      AND leaderboard_settings.teacher_id = auth.uid()
    )
  );

-- RLS policies for store_products
CREATE POLICY "Teachers can manage their own products" ON public.store_products
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view products" ON public.store_products
  FOR SELECT USING (is_active = true);

-- RLS policies for store_purchases
CREATE POLICY "Students can create purchases" ON public.store_purchases
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own purchases" ON public.store_purchases
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view and manage purchases for their products" ON public.store_purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.store_products 
      WHERE store_products.id = store_purchases.product_id 
      AND store_products.teacher_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_class_forum_posts_class ON public.class_forum_posts(class_id);
CREATE INDEX IF NOT EXISTS idx_class_forum_posts_user ON public.class_forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_settings_class ON public.leaderboard_settings(class_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_badges_student ON public.leaderboard_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_store_products_teacher ON public.store_products(teacher_id);
CREATE INDEX IF NOT EXISTS idx_store_purchases_student ON public.store_purchases(student_id);

-- ============================================
-- Storage bucket for product images
-- ============================================

-- Create storage bucket for products
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read access for products" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete product images" ON storage.objects;

-- Storage policies for products bucket

-- Allow anyone to view product images (public bucket)
CREATE POLICY "Public read access for products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated users who are teachers to upload product images
CREATE POLICY "Teachers can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' 
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'guru'
);

-- Allow teachers to update their own product images
CREATE POLICY "Teachers can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' 
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'guru'
);

-- Allow teachers to delete product images
CREATE POLICY "Teachers can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' 
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'guru'
);
