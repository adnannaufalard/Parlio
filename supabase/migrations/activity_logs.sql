-- =====================================================
-- PARLIO - Activity Logs System
-- Table untuk mencatat semua aktivitas user dalam sistem
-- =====================================================

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email text,
  user_name text,
  user_role text,
  action text NOT NULL,
  action_type text NOT NULL DEFAULT 'info',
  -- action_type: 'auth', 'create', 'update', 'delete', 'view', 'quest', 'reward', 'system'
  resource_type text,
  -- resource_type: 'user', 'class', 'chapter', 'lesson', 'quest', 'material', 'announcement', etc
  resource_id text,
  resource_name text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON public.activity_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admin can view all logs
CREATE POLICY "Admin can view all activity logs" ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Any authenticated user can insert logs (for logging their own actions)
CREATE POLICY "Users can insert activity logs" ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to get activity logs with filtering
CREATE OR REPLACE FUNCTION get_activity_logs(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_user_id uuid DEFAULT NULL,
  p_action_type text DEFAULT NULL,
  p_resource_type text DEFAULT NULL,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_email text,
  user_name text,
  user_role text,
  action text,
  action_type text,
  resource_type text,
  resource_id text,
  resource_name text,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    al.user_email,
    al.user_name,
    al.user_role,
    al.action,
    al.action_type,
    al.resource_type,
    al.resource_id,
    al.resource_name,
    al.details,
    al.ip_address,
    al.created_at
  FROM activity_logs al
  WHERE 
    (p_user_id IS NULL OR al.user_id = p_user_id)
    AND (p_action_type IS NULL OR al.action_type = p_action_type)
    AND (p_resource_type IS NULL OR al.resource_type = p_resource_type)
    AND (p_start_date IS NULL OR al.created_at >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at <= p_end_date)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get activity stats for dashboard
CREATE OR REPLACE FUNCTION get_activity_stats()
RETURNS TABLE (
  total_logs bigint,
  today_logs bigint,
  active_users_today bigint,
  logs_by_type jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM activity_logs)::bigint as total_logs,
    (SELECT COUNT(*) FROM activity_logs WHERE created_at >= CURRENT_DATE)::bigint as today_logs,
    (SELECT COUNT(DISTINCT user_id) FROM activity_logs WHERE created_at >= CURRENT_DATE)::bigint as active_users_today,
    (
      SELECT jsonb_object_agg(action_type, cnt)
      FROM (
        SELECT action_type, COUNT(*)::int as cnt
        FROM activity_logs
        WHERE created_at >= CURRENT_DATE
        GROUP BY action_type
      ) sub
    ) as logs_by_type;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_stats TO authenticated;
