-- RPC Function untuk reset periode leaderboard (Testing Panel)
-- SECURITY DEFINER = bypass RLS policies
-- Jalankan SQL ini di Supabase SQL Editor untuk mengaktifkan fitur reset period

CREATE OR REPLACE FUNCTION public.reset_leaderboard_period()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
SET search_path = public
AS $$
DECLARE
  badges_count integer;
  settings_count integer;
BEGIN
  -- Count existing data
  SELECT COUNT(*) INTO badges_count FROM leaderboard_badges;
  SELECT COUNT(*) INTO settings_count FROM leaderboard_settings;

  -- Delete all badges (WHERE true required by Supabase)
  DELETE FROM leaderboard_badges WHERE true;
  
  -- Delete all settings
  DELETE FROM leaderboard_settings WHERE true;

  RETURN json_build_object(
    'success', true,
    'deleted_badges', badges_count,
    'deleted_settings', settings_count
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reset_leaderboard_period() TO authenticated;

-- Optional: Restrict to specific roles only (uncomment if needed)
-- REVOKE EXECUTE ON FUNCTION public.reset_leaderboard_period() FROM authenticated;
-- GRANT EXECUTE ON FUNCTION public.reset_leaderboard_period() TO service_role;

-- ============================================================
-- RPC Function untuk reset XP/Coins siswa (Teacher Leaderboard)
-- SECURITY DEFINER = bypass RLS policies
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_student_xp_coins(
  student_ids uuid[],
  reset_xp boolean DEFAULT true,
  reset_coins boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer;
BEGIN
  -- Update based on what needs to be reset
  IF reset_xp AND reset_coins THEN
    UPDATE profiles 
    SET xp_points = 0, coins = 0 
    WHERE id = ANY(student_ids);
  ELSIF reset_xp THEN
    UPDATE profiles 
    SET xp_points = 0 
    WHERE id = ANY(student_ids);
  ELSIF reset_coins THEN
    UPDATE profiles 
    SET coins = 0 
    WHERE id = ANY(student_ids);
  END IF;

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'affected_count', affected_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_student_xp_coins(uuid[], boolean, boolean) TO authenticated;
