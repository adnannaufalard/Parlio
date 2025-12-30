-- Migration: Create give_reward function
-- Run this SQL in Supabase SQL Editor

-- Function untuk memberikan reward ke siswa
-- Menggunakan SECURITY DEFINER untuk bypass RLS
CREATE OR REPLACE FUNCTION give_reward(
  student_id UUID,
  reward_type TEXT,
  amount INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF reward_type = 'xp' THEN
    UPDATE profiles 
    SET xp_points = COALESCE(xp_points, 0) + amount 
    WHERE id = student_id;
  ELSIF reward_type = 'coins' THEN
    UPDATE profiles 
    SET coins = COALESCE(coins, 0) + amount 
    WHERE id = student_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION give_reward TO authenticated;
