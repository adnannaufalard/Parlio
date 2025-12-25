-- Migration: Add material_id to quests table
-- This allows quests to be associated with specific materials
-- Flow: Lesson -> Materials -> Quests (per material)

-- Add material_id column to quests
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quests' AND column_name = 'material_id'
  ) THEN
    ALTER TABLE quests ADD COLUMN material_id INT REFERENCES lesson_materials(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quests_material_id ON quests(material_id);

-- Comment for documentation
COMMENT ON COLUMN quests.material_id IS 'Reference to the lesson material this quest belongs to. Allows quests to be grouped by material.';
