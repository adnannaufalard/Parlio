-- Function to safely insert activity logs bypassing restrictive RLS
CREATE OR REPLACE FUNCTION log_activity_secure(
    p_user_id uuid,
    p_user_email text,
    p_user_name text,
    p_user_role text,
    p_action text,
    p_action_type text,
    p_resource_type text,
    p_resource_id text,
    p_resource_name text,
    p_details jsonb,
    p_ip_address text,
    p_user_agent text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as the definer (admin) to bypass RLS on INSERT
AS $$
DECLARE
    v_result jsonb;
BEGIN
    INSERT INTO activity_logs (
        user_id, user_email, user_name, user_role,
        action, action_type, resource_type, resource_id, resource_name,
        details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_user_email, p_user_name, p_user_role,
        p_action, p_action_type, p_resource_type, p_resource_id, p_resource_name,
        p_details, p_ip_address, p_user_agent
    ) RETURNING row_to_json(activity_logs.*) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function for Admin to reset a student's progress safely
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

    -- Delete from attempt tables (cascades or deletes child answers usually, but let's be explicit if needed)
    -- Assuming student_quest_answers has foreign key with ON DELETE CASCADE to student_quest_attempts.
    -- If not, we should delete those first. We'll delete attempts.
    WITH deleted AS (
        DELETE FROM student_quest_attempts WHERE student_id = p_student_id RETURNING id
    )
    SELECT count(*) INTO v_deleted_attempts FROM deleted;

    -- Update profile
    UPDATE profiles 
    SET xp_points = 0, coins = 0
    WHERE id = p_student_id;
    
    -- Optional: delete other progress tables if needed
    DELETE FROM student_chapter_progress WHERE student_id = p_student_id;
    DELETE FROM student_lesson_progress WHERE student_id = p_student_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Progress berhasil di-reset',
        'deleted_attempts', v_deleted_attempts
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION log_activity_secure TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_student_progress TO authenticated;
