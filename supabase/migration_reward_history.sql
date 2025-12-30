-- Migration: Create reward_history table
-- This table tracks all rewards given to students

-- Create the reward_history table
CREATE TABLE IF NOT EXISTS reward_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('xp', 'coins', 'both')),
  xp_amount INTEGER DEFAULT 0,
  coins_amount INTEGER DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_reward_history_student ON reward_history(student_id);
CREATE INDEX IF NOT EXISTS idx_reward_history_teacher ON reward_history(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reward_history_class ON reward_history(class_id);
CREATE INDEX IF NOT EXISTS idx_reward_history_created ON reward_history(created_at DESC);

-- Enable RLS
ALTER TABLE reward_history ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can insert reward history
CREATE POLICY "Teachers can insert reward history"
  ON reward_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Policy: Teachers can view their own reward history
CREATE POLICY "Teachers can view their reward history"
  ON reward_history
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Policy: Students can view rewards they received
CREATE POLICY "Students can view their received rewards"
  ON reward_history
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Update give_reward function to also log to reward_history
CREATE OR REPLACE FUNCTION give_reward_with_history(
  p_student_id UUID,
  p_teacher_id UUID,
  p_class_id INTEGER DEFAULT NULL,
  p_xp_amount INTEGER DEFAULT 0,
  p_coins_amount INTEGER DEFAULT 0,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Update XP if provided
  IF p_xp_amount > 0 THEN
    UPDATE profiles
    SET xp_points = COALESCE(xp_points, 0) + p_xp_amount
    WHERE id = p_student_id;
  END IF;
  
  -- Update Coins if provided
  IF p_coins_amount > 0 THEN
    UPDATE profiles
    SET coins = COALESCE(coins, 0) + p_coins_amount
    WHERE id = p_student_id;
  END IF;
  
  -- Log to reward_history
  INSERT INTO reward_history (student_id, teacher_id, class_id, reward_type, xp_amount, coins_amount, reason)
  VALUES (
    p_student_id,
    p_teacher_id,
    p_class_id,
    CASE 
      WHEN p_xp_amount > 0 AND p_coins_amount > 0 THEN 'both'
      WHEN p_xp_amount > 0 THEN 'xp'
      ELSE 'coins'
    END,
    p_xp_amount,
    p_coins_amount,
    p_reason
  );
  
  -- Return success
  SELECT json_build_object(
    'success', true,
    'xp_added', p_xp_amount,
    'coins_added', p_coins_amount
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;
