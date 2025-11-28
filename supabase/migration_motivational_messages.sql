-- Migration: Create motivational_messages table for dynamic dashboard greetings
-- Date: November 8, 2025
-- Purpose: Allow super admin to manage motivational messages displayed on student dashboard

-- Create motivational_messages table
CREATE TABLE IF NOT EXISTS motivational_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for active messages
CREATE INDEX IF NOT EXISTS idx_motivational_messages_active 
  ON motivational_messages(is_active, display_order);

-- Insert default motivational messages
INSERT INTO motivational_messages (message, is_active, display_order) VALUES
  ('hari baru semangat baru lagi dong!', true, 1),
  ('terus belajar sampai bisa ya!', true, 2),
  ('jangan menyerah, kamu pasti bisa!', true, 3),
  ('setiap usaha pasti ada hasilnya!', true, 4),
  ('hebat! tetap semangat belajarnya!', true, 5);

-- Create function to get random active message
CREATE OR REPLACE FUNCTION get_random_motivational_message()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  random_message TEXT;
BEGIN
  SELECT message INTO random_message
  FROM motivational_messages
  WHERE is_active = true
  ORDER BY RANDOM()
  LIMIT 1;
  
  RETURN COALESCE(random_message, 'hari baru semangat baru lagi dong!');
END;
$$;

-- Enable RLS
ALTER TABLE motivational_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Super Admin: Full access
CREATE POLICY "Super admin can manage motivational messages"
  ON motivational_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Students and Teachers: Read only active messages
CREATE POLICY "Users can view active motivational messages"
  ON motivational_messages
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_motivational_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_motivational_messages_updated_at
  BEFORE UPDATE ON motivational_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_motivational_messages_updated_at();

-- Comments
COMMENT ON TABLE motivational_messages IS 'Stores motivational messages displayed on student dashboard';
COMMENT ON COLUMN motivational_messages.message IS 'The motivational message text';
COMMENT ON COLUMN motivational_messages.is_active IS 'Whether the message is currently active';
COMMENT ON COLUMN motivational_messages.display_order IS 'Order for displaying messages (lower = higher priority)';
