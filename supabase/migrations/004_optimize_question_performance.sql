-- Migration: Optimize Question Selection Performance
-- This addresses slow question selection with 1M+ questions

-- 1. Add critical database indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_exercise_questions_target_language 
ON exercise_questions (target_language);

CREATE INDEX IF NOT EXISTS idx_exercise_questions_difficulty 
ON exercise_questions (difficulty);

CREATE INDEX IF NOT EXISTS idx_exercise_questions_concept 
ON exercise_questions (concept);

CREATE INDEX IF NOT EXISTS idx_exercise_questions_lang_diff_concept 
ON exercise_questions (target_language, difficulty, concept);

CREATE INDEX IF NOT EXISTS idx_user_question_history_user_id 
ON user_question_history (user_id);

CREATE INDEX IF NOT EXISTS idx_user_question_history_question_id 
ON user_question_history (question_id);

CREATE INDEX IF NOT EXISTS idx_user_question_history_user_question 
ON user_question_history (user_id, question_id);

CREATE INDEX IF NOT EXISTS idx_user_question_history_last_seen 
ON user_question_history (user_id, last_seen_at);

CREATE INDEX IF NOT EXISTS idx_concept_progress_user_lang 
ON concept_progress (user_id, target_language);

CREATE INDEX IF NOT EXISTS idx_concept_progress_needs_review 
ON concept_progress (user_id, target_language, needs_review, mastery_level);

-- 2. Create a faster, simplified question selection function
CREATE OR REPLACE FUNCTION get_next_question_fast(
  p_user_id UUID,
  p_target_language TEXT DEFAULT 'Spanish',
  p_difficulty TEXT DEFAULT NULL
) RETURNS TABLE (
  question_id UUID,
  concept TEXT,
  question_type TEXT,
  difficulty TEXT,
  target_language TEXT,
  question_text TEXT,
  correct_answer TEXT,
  options JSONB,
  hints TEXT,
  audio_url TEXT,
  image_url TEXT
) AS $$
DECLARE
  random_offset INTEGER;
  total_questions INTEGER;
BEGIN
  -- Fast approach: Get total count and random offset
  SELECT COUNT(*) INTO total_questions
  FROM exercise_questions eq
  WHERE eq.target_language = p_target_language
    AND (p_difficulty IS NULL OR eq.difficulty = p_difficulty)
    AND NOT EXISTS (
      SELECT 1 FROM user_question_history uqh 
      WHERE uqh.question_id = eq.id 
        AND uqh.user_id = p_user_id
        AND uqh.last_seen_at > NOW() - INTERVAL '12 hours'
    );
  
  -- If we have available questions, pick one randomly but fast
  IF total_questions > 0 THEN
    random_offset := floor(random() * total_questions)::INTEGER;
    
    RETURN QUERY
    SELECT 
      eq.id,
      eq.concept,
      eq.question_type,
      eq.difficulty,
      eq.target_language,
      eq.question_text,
      eq.correct_answer,
      eq.options,
      eq.hints,
      eq.audio_url,
      eq.image_url
    FROM exercise_questions eq
    WHERE eq.target_language = p_target_language
      AND (p_difficulty IS NULL OR eq.difficulty = p_difficulty)
      AND NOT EXISTS (
        SELECT 1 FROM user_question_history uqh 
        WHERE uqh.question_id = eq.id 
          AND uqh.user_id = p_user_id
          AND uqh.last_seen_at > NOW() - INTERVAL '12 hours'
      )
    ORDER BY eq.id -- Consistent ordering for offset
    LIMIT 1 OFFSET random_offset;
  ELSE
    -- Fallback: Pick any question if all have been seen recently
    random_offset := floor(random() * (SELECT COUNT(*) FROM exercise_questions WHERE target_language = p_target_language))::INTEGER;
    
    RETURN QUERY
    SELECT 
      eq.id,
      eq.concept,
      eq.question_type,
      eq.difficulty,
      eq.target_language,
      eq.question_text,
      eq.correct_answer,
      eq.options,
      eq.hints,
      eq.audio_url,
      eq.image_url
    FROM exercise_questions eq
    WHERE eq.target_language = p_target_language
      AND (p_difficulty IS NULL OR eq.difficulty = p_difficulty)
    ORDER BY eq.id
    LIMIT 1 OFFSET random_offset;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create an even faster version for high-volume usage
CREATE OR REPLACE FUNCTION get_next_question_lightning(
  p_user_id UUID,
  p_target_language TEXT DEFAULT 'Spanish',
  p_difficulty TEXT DEFAULT NULL
) RETURNS TABLE (
  question_id UUID,
  concept TEXT,
  question_type TEXT,
  difficulty TEXT,
  target_language TEXT,
  question_text TEXT,
  correct_answer TEXT,
  options JSONB,
  hints TEXT,
  audio_url TEXT,
  image_url TEXT
) AS $$
BEGIN
  -- Lightning fast: Just get a random question, minimal filtering
  RETURN QUERY
  SELECT 
    eq.id,
    eq.concept,
    eq.question_type,
    eq.difficulty,
    eq.target_language,
    eq.question_text,
    eq.correct_answer,
    eq.options,
    eq.hints,
    eq.audio_url,
    eq.image_url
  FROM exercise_questions eq
  WHERE eq.target_language = p_target_language
    AND (p_difficulty IS NULL OR eq.difficulty = p_difficulty)
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update RLS policies for new functions
CREATE POLICY "Users can call fast question functions" 
  ON exercise_questions FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 5. Add table stats for query planner optimization
ANALYZE exercise_questions;
ANALYZE user_question_history;
ANALYZE concept_progress;