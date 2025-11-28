-- Add user_answers column to student_quest_attempts table
-- This column will store the user's answer choices in JSON format
-- Format: { question_id: "A", question_id: "B", ... }

ALTER TABLE student_quest_attempts 
ADD COLUMN IF NOT EXISTS user_answers JSONB DEFAULT '{}'::jsonb;

-- Add comment to describe the column
COMMENT ON COLUMN student_quest_attempts.user_answers IS 
'Stores user answer choices in JSON format. Key: question_id (int), Value: answer choice (string like A/B/C/D or text)';

-- Create index for better query performance on user_answers
CREATE INDEX IF NOT EXISTS idx_student_attempts_user_answers 
ON student_quest_attempts USING gin(user_answers);
