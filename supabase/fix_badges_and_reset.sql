-- 1. Perbaiki badge_level pada student_achievement_badges yang sudah terlanjur mendapatkan level 1
-- Mengambil urutan bab (chapter) berdasarkan class_chapters
UPDATE student_achievement_badges sab
SET badge_level = sub.new_level
FROM (
  SELECT chapter_id, MIN(new_level) as new_level
  FROM (
    SELECT cc.chapter_id, ROW_NUMBER() OVER(PARTITION BY cc.class_id ORDER BY cc.chapter_id ASC) as new_level
    FROM class_chapters cc
  ) t
  GROUP BY chapter_id
) sub
WHERE sab.chapter_id = sub.chapter_id AND sab.badge_level != sub.new_level;


-- 2. Perbarui fungsi admin_reset_student_progress untuk turut mereset badge
CREATE OR REPLACE FUNCTION admin_reset_student_progress(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role text;
    v_deleted_attempts int;
BEGIN
    -- Verify caller is an admin
    SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
    
    IF v_caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Hanya admin yang dapat mereset progress siswa';
    END IF;

    -- Delete from attempt tables
    WITH deleted AS (
        DELETE FROM student_quest_attempts WHERE student_id = p_student_id RETURNING id
    )
    SELECT count(*) INTO v_deleted_attempts FROM deleted;

    -- Update profile
    UPDATE profiles 
    SET xp_points = 0, coins = 0
    WHERE id = p_student_id;
    
    -- Delete other progress tables
    DELETE FROM student_chapter_progress WHERE student_id = p_student_id;
    DELETE FROM student_lesson_progress WHERE student_id = p_student_id;
    
    -- Delete achievement and leaderboard badges
    DELETE FROM student_achievement_badges WHERE student_id = p_student_id;
    DELETE FROM leaderboard_badges WHERE student_id = p_student_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Progress berhasil di-reset',
        'deleted_attempts', v_deleted_attempts
    );
END;
$$;
