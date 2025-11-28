-- ============================================
-- FIX: RLS Policy untuk Profiles Table
-- Purpose: Allow users to read and update their own XP & Coins
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any conflicts)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Policy 1: Everyone can view all profiles (for leaderboard, etc)
CREATE POLICY "profiles_select_policy" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Users can update their own profile (including XP & Coins)
CREATE POLICY "profiles_update_own" 
ON profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 3: Users can insert their own profile (during registration)
CREATE POLICY "profiles_insert_own" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test query (should return your profile)
SELECT id, email, xp_points, coins FROM profiles WHERE id = auth.uid();
