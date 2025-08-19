-- EMERGENCY DATABASE CLEANUP - Remove 30% of questions from each language
-- RUN THIS IN SUPABASE SQL EDITOR TO FREE UP STORAGE SPACE IMMEDIATELY

-- First, let's see what we have
SELECT 
  target_language,
  COUNT(*) as total_questions,
  ROUND(COUNT(*) * 0.3) as will_delete,
  COUNT(*) - ROUND(COUNT(*) * 0.3) as will_keep
FROM exercise_questions 
GROUP BY target_language 
ORDER BY COUNT(*) DESC;

-- Emergency Cleanup Function
CREATE OR REPLACE FUNCTION emergency_cleanup() RETURNS TEXT AS $$
DECLARE
  lang_record RECORD;
  delete_count INTEGER;
  total_deleted INTEGER := 0;
  result_text TEXT := '';
BEGIN
  -- Loop through each language
  FOR lang_record IN 
    SELECT target_language, COUNT(*) as question_count
    FROM exercise_questions 
    GROUP BY target_language
    ORDER BY COUNT(*) DESC
  LOOP
    -- Calculate 30% to delete
    delete_count := ROUND(lang_record.question_count * 0.3);
    
    -- Delete 30% of questions for this language (keep variety by using random)
    DELETE FROM exercise_questions 
    WHERE id IN (
      SELECT id 
      FROM exercise_questions 
      WHERE target_language = lang_record.target_language
      ORDER BY RANDOM()
      LIMIT delete_count
    );
    
    total_deleted := total_deleted + delete_count;
    result_text := result_text || lang_record.target_language || ': deleted ' || delete_count || ' questions' || chr(10);
  END LOOP;
  
  result_text := result_text || chr(10) || 'TOTAL DELETED: ' || total_deleted || ' questions';
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Show final summary before cleanup
SELECT 'BEFORE CLEANUP - Total questions: ' || COUNT(*) as status FROM exercise_questions;

-- UNCOMMENT THE NEXT LINE TO RUN THE CLEANUP (WARNING: PERMANENT!)
-- SELECT emergency_cleanup();

-- Show summary after cleanup (uncomment after running cleanup)
-- SELECT 'AFTER CLEANUP - Total questions: ' || COUNT(*) as status FROM exercise_questions;