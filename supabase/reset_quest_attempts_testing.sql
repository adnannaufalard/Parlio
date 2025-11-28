-- ============================================
-- TESTING SCRIPT: Reset Quest Attempts
-- ============================================
-- Purpose: Reset quest attempts, XP, coins for testing
-- Use this during development to test quest flow repeatedly
-- ============================================

-- OPTION 1: Reset specific quest for specific student
-- Replace <student_id> and <quest_id> with actual values
/*
DELETE FROM student_quest_attempts 
WHERE student_id = '<student_id>'  -- e.g., 'f21d0cd1-2bc8-42fe-a726-c13855ed3f42'
AND quest_id = <quest_id>;  -- e.g., 1
*/

-- OPTION 2: Reset all attempts for a specific student
-- Replace <student_id> with your test student ID
/*
DELETE FROM student_quest_attempts 
WHERE student_id = '<student_id>';
*/

-- OPTION 3: Reset all attempts for current logged in user
-- Run this while logged in as the test student
/*
DELETE FROM student_quest_attempts 
WHERE student_id = auth.uid();
*/

-- OPTION 4: Reset XP and Coins for specific student
-- Replace <student_id> with your test student ID
/*
UPDATE profiles 
SET xp_points = 0, coins = 0
WHERE id = '<student_id>';
*/

-- OPTION 5: Reset XP and Coins for current logged in user
/*
UPDATE profiles 
SET xp_points = 0, coins = 0
WHERE id = auth.uid();
*/

-- OPTION 6: Complete Reset (Attempts + XP + Coins) for current user
-- This is the most common testing scenario
/*
-- Delete all quest attempts
DELETE FROM student_quest_attempts WHERE student_id = auth.uid();

-- Reset XP and coins
UPDATE profiles SET xp_points = 0, coins = 0 WHERE id = auth.uid();

-- Verify
SELECT id, email, xp_points, coins FROM profiles WHERE id = auth.uid();
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all attempts for current user
SELECT 
  sqa.id,
  sqa.attempt_number,
  sqa.score,
  sqa.max_score,
  sqa.percentage,
  sqa.passed,
  sqa.xp_earned,
  sqa.coins_earned,
  sqa.completed_at,
  q.title as quest_title
FROM student_quest_attempts sqa
JOIN quests q ON q.id = sqa.quest_id
WHERE sqa.student_id = auth.uid()
ORDER BY sqa.completed_at DESC;

-- Check current XP and Coins
SELECT 
  id,
  email,
  full_name,
  xp_points,
  coins,
  role
FROM profiles 
WHERE id = auth.uid();

-- Check total XP earned from all quests
SELECT 
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN passed THEN 1 END) as passed_attempts,
  SUM(xp_earned) as total_xp_earned,
  SUM(coins_earned) as total_coins_earned,
  SUM(score) as total_score
FROM student_quest_attempts
WHERE student_id = auth.uid();
