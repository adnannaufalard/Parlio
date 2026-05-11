-- Function to securely fetch class leaderboard without exposing quest answers
DROP FUNCTION IF EXISTS get_class_leaderboard(UUID);
DROP FUNCTION IF EXISTS get_class_leaderboard(INTEGER);

CREATE OR REPLACE FUNCTION get_class_leaderboard(p_class_id INTEGER)
RETURNS TABLE (
  student_id UUID,
  total_score NUMERIC,
  avg_score NUMERIC,
  quest_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  WITH class_quests AS (
    SELECT q.id
    FROM class_chapters cc
    JOIN lessons l ON l.chapter_id = cc.chapter_id
    JOIN quests q ON q.lesson_id = l.id
    WHERE cc.class_id = p_class_id AND cc.is_active = true
  ),
  best_attempts AS (
    SELECT 
      sqa.student_id,
      sqa.quest_id,
      MAX(sqa.percentage) as best_percentage
    FROM student_quest_attempts sqa
    WHERE sqa.quest_id IN (SELECT id FROM class_quests)
    GROUP BY sqa.student_id, sqa.quest_id
  )
  SELECT 
    cm.student_id,
    COALESCE(SUM(ba.best_percentage), 0)::NUMERIC AS total_score,
    (
      CASE 
        WHEN COUNT(ba.quest_id) > 0 
        THEN ROUND(COALESCE(SUM(ba.best_percentage), 0) / COUNT(ba.quest_id))
        ELSE 0 
      END
    )::NUMERIC AS avg_score,
    COUNT(ba.quest_id)::BIGINT AS quest_count
  FROM class_members cm
  LEFT JOIN best_attempts ba ON ba.student_id = cm.student_id
  WHERE cm.class_id = p_class_id
  GROUP BY cm.student_id;
$$;
