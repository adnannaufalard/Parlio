-- ============================================
-- CORRECT ANSWER FORMAT MIGRATION SCRIPT
-- ============================================
-- Purpose: Convert correct_answer from text format to letter format (A/B/C/D)
-- WARNING: Always backup before running!
-- ============================================

-- STEP 1: Create backup table
-- ============================================
DO $$
BEGIN
  -- Drop backup if exists
  DROP TABLE IF EXISTS questions_backup_20250129;
  
  -- Create backup with timestamp
  CREATE TABLE questions_backup_20250129 AS 
  SELECT * FROM questions;
  
  RAISE NOTICE 'Backup created: questions_backup_20250129';
END $$;

-- STEP 2: Analyze current data
-- ============================================
SELECT 
  '=== CURRENT DATA ANALYSIS ===' as analysis,
  question_type,
  COUNT(*) as total_questions,
  COUNT(CASE WHEN correct_answer IN ('A','B','C','D','E','F') THEN 1 END) as letter_format,
  COUNT(CASE WHEN correct_answer NOT IN ('A','B','C','D','E','F') THEN 1 END) as text_format
FROM questions
GROUP BY question_type
ORDER BY question_type;

-- STEP 3: Preview migration changes
-- ============================================
SELECT 
  '=== MIGRATION PREVIEW ===' as preview,
  id,
  question_text,
  question_type,
  correct_answer as old_correct_answer,
  CASE 
    WHEN question_type = 'multiple_choice' THEN
      CASE 
        WHEN options->0->>'text' = correct_answer OR options->0->>'is_correct' = 'true' THEN 'A'
        WHEN options->1->>'text' = correct_answer OR options->1->>'is_correct' = 'true' THEN 'B'
        WHEN options->2->>'text' = correct_answer OR options->2->>'is_correct' = 'true' THEN 'C'
        WHEN options->3->>'text' = correct_answer OR options->3->>'is_correct' = 'true' THEN 'D'
        WHEN options->4->>'text' = correct_answer OR options->4->>'is_correct' = 'true' THEN 'E'
        WHEN options->5->>'text' = correct_answer OR options->5->>'is_correct' = 'true' THEN 'F'
        ELSE '⚠️ NOT FOUND'
      END
    ELSE correct_answer
  END as new_correct_answer
FROM questions
WHERE question_type = 'multiple_choice'
AND correct_answer NOT IN ('A', 'B', 'C', 'D', 'E', 'F')
ORDER BY id;

-- STEP 4: Execute migration (UNCOMMENT TO RUN)
-- ============================================
-- IMPORTANT: Review STEP 3 preview first!
-- Only uncomment and run if preview looks correct

/*
UPDATE questions q
SET correct_answer = (
  CASE 
    -- Try to match by text first
    WHEN options->0->>'text' = q.correct_answer THEN 'A'
    WHEN options->1->>'text' = q.correct_answer THEN 'B'
    WHEN options->2->>'text' = q.correct_answer THEN 'C'
    WHEN options->3->>'text' = q.correct_answer THEN 'D'
    WHEN options->4->>'text' = q.correct_answer THEN 'E'
    WHEN options->5->>'text' = q.correct_answer THEN 'F'
    -- Fallback: Try to match by is_correct flag
    WHEN options->0->>'is_correct' = 'true' THEN 'A'
    WHEN options->1->>'is_correct' = 'true' THEN 'B'
    WHEN options->2->>'is_correct' = 'true' THEN 'C'
    WHEN options->3->>'is_correct' = 'true' THEN 'D'
    WHEN options->4->>'is_correct' = 'true' THEN 'E'
    WHEN options->5->>'is_correct' = 'true' THEN 'F'
    ELSE q.correct_answer
  END
)
WHERE question_type = 'multiple_choice'
AND correct_answer NOT IN ('A', 'B', 'C', 'D', 'E', 'F');
*/

-- STEP 5: Verify migration results
-- ============================================
SELECT 
  '=== POST-MIGRATION VERIFICATION ===' as verification,
  id,
  question_text,
  correct_answer,
  options
FROM questions
WHERE question_type = 'multiple_choice'
ORDER BY id
LIMIT 20;

-- STEP 6: Check for any issues
-- ============================================
SELECT 
  '=== POTENTIAL ISSUES ===' as issues,
  id,
  question_text,
  correct_answer,
  options
FROM questions
WHERE question_type = 'multiple_choice'
AND (
  correct_answer IS NULL 
  OR correct_answer = ''
  OR correct_answer = '⚠️ NOT FOUND'
  OR correct_answer NOT IN ('A', 'B', 'C', 'D', 'E', 'F')
);

-- STEP 7: Rollback (if needed)
-- ============================================
-- ONLY USE IF MIGRATION FAILED!
/*
DO $$
BEGIN
  -- Restore from backup
  DELETE FROM questions;
  INSERT INTO questions SELECT * FROM questions_backup_20250129;
  
  RAISE NOTICE 'Rollback complete! Data restored from backup.';
END $$;
*/

-- ============================================
-- SUMMARY REPORT
-- ============================================
SELECT 
  '=== FINAL SUMMARY ===' as summary,
  (SELECT COUNT(*) FROM questions WHERE question_type = 'multiple_choice') as total_mc_questions,
  (SELECT COUNT(*) FROM questions WHERE question_type = 'multiple_choice' AND correct_answer IN ('A','B','C','D','E','F')) as using_letter_format,
  (SELECT COUNT(*) FROM questions WHERE question_type = 'multiple_choice' AND correct_answer NOT IN ('A','B','C','D','E','F')) as using_text_format,
  CASE 
    WHEN (SELECT COUNT(*) FROM questions WHERE question_type = 'multiple_choice' AND correct_answer NOT IN ('A','B','C','D','E','F')) = 0 
    THEN '✅ All migrated successfully!'
    ELSE '⚠️ Some questions still need migration'
  END as status;

-- ============================================
-- INSTRUCTIONS
-- ============================================
/*
HOW TO USE THIS SCRIPT:

1. Run STEP 1-3 first (backup + preview)
2. Review the STEP 3 preview carefully
3. If preview looks good, uncomment STEP 4 and run
4. Run STEP 5-6 to verify results
5. If something went wrong, use STEP 7 to rollback

NOTES:
- The code will handle both formats automatically
- Migration is optional - only needed for data consistency
- Always test on staging environment first
- Keep backup table for at least 1 week after migration

For questions or issues, refer to:
MIGRATION_CORRECT_ANSWER_FORMAT.md
*/
